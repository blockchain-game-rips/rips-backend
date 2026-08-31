import { SetMetadata } from '@nestjs/common'

export enum AccessLevel {
	Public = 'public',
	User = 'user',
	Admin = 'admin',
}

export const ACCESS_LEVEL_KEY = 'accessLevel'

export const PublicAccess = () =>
	SetMetadata(ACCESS_LEVEL_KEY, AccessLevel.Public)

export const UserAccess = () => SetMetadata(ACCESS_LEVEL_KEY, AccessLevel.User)

export const AdminAccess = () =>
	SetMetadata(ACCESS_LEVEL_KEY, AccessLevel.Admin)
