import { Medium } from '@prisma/client'

export interface Artwork {
  title: string | null
  id: number
  description: string | null
  src: string
  start: Date
  index: number
  projectId: number
  medium: Medium | null
  insertion: Date
  width: number | null
  length: number | null
  height: number | null
}
