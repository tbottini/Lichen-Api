import { Gallery, Role } from '@prisma/client'
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
  geoReferenced: true,
} as const

export const privateScope = {
  ...publicScope,
  email: true,
} as const

export type UserPublic = {
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
  geoReferenced: boolean | null
  medium: MediumValues | null

  gallery: Gallery
}

export type UserPrivate = UserPublic & {
  email: string
  password: string
}
