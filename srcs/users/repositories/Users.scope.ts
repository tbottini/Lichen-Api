import { Gallery, Role } from '@prisma/client'
import { Position } from '../../interfaces/Position.type'
import { MediumValues } from '../../medium/mediumEnum'

export const publicScope = {
  email: false,
  password: false,
  firstname: true,
  pseudo: true,
  lastname: true,
  id: true,
  websiteUrl: true,
  description: true,
  src: true,
  role: true,
  medium: true,
  gallery: true,
  bio: true,
  creation: true,
  positionLatitude: true,
  positionLongitude: true,
} as const

export const privateScope = {
  ...publicScope,
  email: true,
} as const

export type UserBase = {
  id: number
  firstname: string | null
  lastname: string | null
  pseudo: string | null
  src: string | null
  description: string | null
  bio: string | null
  websiteUrl: string | null
  creation: Date
  role: Role
  medium: MediumValues | null
  gallery: GalleryDto | null
}

export type RawUserPosition = {
  positionLatitude?: number | null
  positionLongitude?: number | null
}

export type UserRepositoryPublic = UserBase & RawUserPosition

export type UserRepositoryPrivate = UserRepositoryPublic &
  IncludesUsers & {
    email: string
    password: string
  }

export type IncludesUsers = {
  followed: any
  following: any
  projects: any
  events: any
  likes: any
  eventFollow: any
}

// dto

export type UserFullPublicDto = UserPublicDto & IncludesUsers

export type GalleryDto = {
  userId: number
  id: number
  open: boolean
  longitude: number
  latitude: number
}

export type UserPublicDto = UserBase & {
  position: Position | null
}

export type UserPrivateDto = UserRepositoryPrivate & {
  position: Position | null
}

export type UserUpdatbleAttributes = Partial<{
  email: string
  password: string
  firstname: string | null
  lastname: string | null
  pseudo: string | null
  src: string | null
  description: string | null
  bio: string | null
  websiteUrl: string | null
  medium: MediumValues | null
}>
