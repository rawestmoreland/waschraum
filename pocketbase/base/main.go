package main

import (
	"fmt"
	"log"
	"os"

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

	app.OnRecordAfterUpdateSuccess("machines").BindFunc(func(e *core.RecordEvent) error {
		record := e.Record
		app := e.App

		if record.GetString("status") != "available" {
			return e.Next()
		}

		if record.Original().GetString("status") != "in_use" {
			return e.Next()
		}

		// Guard against re-entry: if occupied_by is already cleared, this is our
		// own cleanup save triggering the hook again — skip it.
		if record.GetString("occupied_by") == "" {
			return e.Next()
		}

		// Remove the resident and clear started_at
		record.Set("occupied_by", "")
		record.Set("started_at", "")

		app.Save(record)

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

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
