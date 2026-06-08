/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export const Collections = {
	Authorigins: "_authOrigins",
	Externalauths: "_externalAuths",
	Mfas: "_mfas",
	Otps: "_otps",
	Superusers: "_superusers",
	Buildings: "buildings",
	Machines: "machines",
	Nudges: "nudges",
	Residents: "residents",
	Sessions: "sessions",
	Users: "users",
	WaitlistEntries: "waitlist_entries",
} as const
export type Collections = typeof Collections[keyof typeof Collections]

// Alias types for improved usability
export type IsoDateString = string
export type IsoAutoDateString = string & { readonly autodate: unique symbol }
export type RecordIdString = string
export type FileNameString = string & { readonly filename: unique symbol }
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated: IsoAutoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated: IsoAutoDateString
}

export type MfasRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	method: string
	recordRef: string
	updated: IsoAutoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated: IsoAutoDateString
}

export type SuperusersRecord = {
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export type BuildingsRecord = {
	address: string
	created: IsoAutoDateString
	id: string
	invite_code: string
	name: string
	updated: IsoAutoDateString
}

export const MachinesTypeOptions = {
	"washer": "washer",
	"dryer": "dryer",
} as const
export type MachinesTypeOptions = typeof MachinesTypeOptions[keyof typeof MachinesTypeOptions]

export const MachinesStatusOptions = {
	"available": "available",
	"in_use": "in_use",
	"fault": "fault",
} as const
export type MachinesStatusOptions = typeof MachinesStatusOptions[keyof typeof MachinesStatusOptions]
export type MachinesRecord = {
	building: RecordIdString
	created: IsoAutoDateString
	id: string
	label: string
	occupied_by?: RecordIdString
	started_at?: IsoDateString
	status: MachinesStatusOptions
	type: MachinesTypeOptions
	updated: IsoAutoDateString
}

export type NudgesRecord = {
	building: RecordIdString
	created: IsoAutoDateString
	from_user: RecordIdString
	id: string
	machine: RecordIdString
	to_user: RecordIdString
	updated: IsoAutoDateString
}

export const ResidentsRoleOptions = {
	"resident": "resident",
	"admin": "admin",
} as const
export type ResidentsRoleOptions = typeof ResidentsRoleOptions[keyof typeof ResidentsRoleOptions]
export type ResidentsRecord = {
	apartment?: string
	building?: RecordIdString
	created: IsoAutoDateString
	id: string
	role: ResidentsRoleOptions[]
	updated: IsoAutoDateString
	user?: RecordIdString
}

export type SessionsRecord = {
	building: RecordIdString
	created: IsoAutoDateString
	duration?: number
	ended_at?: IsoDateString
	id: string
	machine: RecordIdString
	resident: RecordIdString
	started_at: IsoDateString
	updated: IsoAutoDateString
}

export type UsersRecord = {
	avatar?: FileNameString
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export type WaitlistEntriesRecord = {
	building: RecordIdString
	created: IsoAutoDateString
	expires_at?: IsoDateString
	id: string
	joined_at: IsoDateString
	machine: RecordIdString
	notified_at?: IsoDateString
	position: number
	resident: RecordIdString
	updated: IsoAutoDateString
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type BuildingsResponse<Texpand = unknown> = Required<BuildingsRecord> & BaseSystemFields<Texpand>
export type MachinesResponse<Texpand = unknown> = Required<MachinesRecord> & BaseSystemFields<Texpand>
export type NudgesResponse<Texpand = unknown> = Required<NudgesRecord> & BaseSystemFields<Texpand>
export type ResidentsResponse<Texpand = unknown> = Required<ResidentsRecord> & BaseSystemFields<Texpand>
export type SessionsResponse<Texpand = unknown> = Required<SessionsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type WaitlistEntriesResponse<Texpand = unknown> = Required<WaitlistEntriesRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	buildings: BuildingsRecord
	machines: MachinesRecord
	nudges: NudgesRecord
	residents: ResidentsRecord
	sessions: SessionsRecord
	users: UsersRecord
	waitlist_entries: WaitlistEntriesRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	buildings: BuildingsResponse
	machines: MachinesResponse
	nudges: NudgesResponse
	residents: ResidentsResponse
	sessions: SessionsResponse
	users: UsersResponse
	waitlist_entries: WaitlistEntriesResponse
}

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<{
	// Omit AutoDate fields
	[K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: 
		// Convert FileNameString to File
		T[K] extends infer U ? 
			U extends (FileNameString | FileNameString[]) ? 
				U extends any[] ? File[] : File 
			: U
		: never
}, 'id'>

// Create type for Auth collections
export type CreateAuth<T> = {
	id?: RecordIdString
	email: string
	emailVisibility?: boolean
	password: string
	passwordConfirm: string
	verified?: boolean
} & ProcessCreateAndUpdateFields<T>

// Create type for Base collections
export type CreateBase<T> = {
	id?: RecordIdString
} & ProcessCreateAndUpdateFields<T>

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
	email?: string
	emailVisibility?: boolean
	oldPassword?: string
	password?: string
	passwordConfirm?: string
	verified?: boolean
}

// Update type for Base collections
export type UpdateBase<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? CreateAuth<CollectionRecords[T]>
		: CreateBase<CollectionRecords[T]>

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? UpdateAuth<CollectionRecords[T]>
		: UpdateBase<CollectionRecords[T]>

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
	collection<T extends keyof CollectionResponses>(
		idOrName: T
	): RecordService<CollectionResponses[T]>
} & PocketBase
