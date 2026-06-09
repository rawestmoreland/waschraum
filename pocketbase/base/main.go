package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/pocketbase/pocketbase/tools/osutils"
	"github.com/pocketbase/pocketbase/tools/types"

	_ "waschraum/migrations"
)

func main() {
	app := pocketbase.New()

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the IsProbablyGoRun check is to enable it only during development)
		Automigrate: osutils.IsProbablyGoRun(),
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

		return se.Next()
	})

	app.Cron().MustAdd("machine_auto_release", "*/15 * * * *", func() {
		past := time.Now().Add(time.Hour * -3)

		machines, err := app.FindRecordsByFilter("machines", "status = 'in_use' && started_at < {:past}", "-started_at", 100, 0, dbx.Params{"past": past})
		if err != nil || len(machines) == 0 {
			fmt.Println("Could not find machines to release")
			return
		}
		for _, record := range machines {
			record.Set("status", "available")
			record.Set("occupied_by", "")
			record.Set("started_at", "")

			app.Save(record)
		}
	})

	app.Cron().MustAdd("waitlist_expiry", "*/1 * * * *", func() {
		now := types.NowDateTime().Time()
		entries, err := app.FindRecordsByFilter("waitlist_entries", "expires_at < {:now} && notified_at != ''", "-expires_at", 100, 0, dbx.Params{"now": now})

		if err != nil {
			fmt.Println("Error finding records")
			return
		}
		for _, s := range entries {
			// Delete each entry
			app.Delete(s)
		}
	})

	app.OnRecordAfterDeleteSuccess("waitlist_entries").BindFunc(func(e *core.RecordEvent) error {
		// No position reordering needed — queue order is always derived from joined_at
		// Find the entry with the earliest joined_at for this machine where expires_at is null
		// Set their expires_at = now + 10 min
		// Send push notification to that resident

		record := e.Record
		app := e.App

		machine := record.GetString("machine")

		earliest, err := app.FindRecordsByFilter("waitlist_entries", "machine = {:machine} && expires_at = ''", "joined_at", 1, 0, dbx.Params{"machine": machine})

		if err != nil || len(earliest) == 0 {
			return e.Next()
		}

		future := time.Now().Add(time.Minute * 10)

		earliest[0].Set("expires_at", future)

		if saveErr := app.Save(earliest[0]); saveErr != nil {
			return saveErr
		}

		return e.Next()
	})

	app.OnRecordAfterUpdateSuccess("machines").BindFunc(func(e *core.RecordEvent) error {
		record := e.Record
		app := e.App

		// Create the session if we're going available -> in_use
		if record.Original().GetString("status") == "available" && record.GetString("status") == "in_use" {
			sessions, err := app.FindCollectionByNameOrId("sessions")
			if err != nil {
				return err
			}
			session := core.NewRecord(sessions)

			session.Set("machine", record.Id)
			session.Set("resident", record.GetString("occupied_by"))
			session.Set("building", record.GetString("building"))
			session.Set("started_at", types.NowDateTime().Time())

			app.Save(session)
		}

		// When changing from in_use -> available
		if record.Original().GetString("status") == "in_use" && record.GetString("status") == "available" {

			// Check for active sessions on this machine
			session, err := app.FindFirstRecordByFilter("sessions", "started_at != '' && ended_at = '' && machine = {:machine}", dbx.Params{"machine": record.Id})
			if err != nil {
				// TODO: Handle the error better here.
				fmt.Println("No sessions found for this machine.")
				fmt.Println(e)
			} else {
				fmt.Printf("Found the session to update: %s", session.Id)

				// End the session
				now := types.NowDateTime()
				started := session.GetDateTime("started_at").Time()

				duration := now.Time().Sub(started)

				session.Set("ended_at", now)
				session.Set("duration", int64(duration.Seconds()))

				app.Save(session)
			}

			// Promote first waitlist entry for this machine
			earliest, err := app.FindRecordsByFilter("waitlist_entries", "machine = {:machine} && expires_at = ''", "joined_at", 1, 0, dbx.Params{"machine": record.Id})
			if err == nil && len(earliest) > 0 {
				earliest[0].Set("expires_at", time.Now().Add(time.Minute*10))
				app.Save(earliest[0])
			}
		}

		return e.Next()
	})

	app.OnRecordCreateRequest("nudges").BindFunc(func(e *core.RecordRequestEvent) error {
		record := e.Record
		app := e.App

		machine, err := app.FindFirstRecordByFilter("machines", "id = {:machine} && status = 'in_use'", dbx.Params{"machine": record.GetString("machine")})
		if err != nil {
			return apis.NewBadRequestError("The machine is not currently in use", nil)
		}

		session, err := app.FindFirstRecordByFilter("sessions", "started_at != '' && ended_at = '' && machine = {:machine}", dbx.Params{"machine": machine.Id})
		if err != nil {
			return apis.NewBadRequestError("No active session found for this machine", nil)
		}

		// Block duplicate nudges within the same session window
		_, err = app.FindFirstRecordByFilter("nudges", "machine = {:machine} && created >= {:started_at}", dbx.Params{
			"machine":    machine.Id,
			"started_at": session.GetDateTime("started_at"),
		})
		if err == nil {
			return apis.NewBadRequestError("A nudge has already been sent for this session", nil)
		}

		return e.Next()
	})

	app.OnRecordCreateRequest("machine_views").BindFunc(func(e *core.RecordRequestEvent) error {
		// Check if a view record exists for (machine, resident) since machine.started_at
		// If yes, update viewed_at on existing record and abort insert
		// If no, allow insert via e.Next()

		record := e.Record
		app := e.App

		errs := app.ExpandRecord(record, []string{"machine"}, nil)

		if len(errs) > 0 {
			return apis.NewBadRequestError("No machine found", nil)
		}

		machine := record.ExpandedOne("machine")

		existing, err := app.FindFirstRecordByFilter("machine_views", "viewed_at >= {:started_at} && machine = {:machine} && resident = {:resident}", dbx.Params{"machine": record.GetString("machine"), "resident": record.GetString("resident"), "started_at": machine.GetDateTime("started_at")})
		if err == nil {
			// record found - update viewed_at and abort the insert
			existing.Set("viewed_at", time.Now())
			if saveErr := app.Save(existing); saveErr != nil {
				return saveErr
			}
			return nil
		}

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
