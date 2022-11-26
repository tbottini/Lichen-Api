import { Medium } from '@prisma/client'

export interface Artwork {
  title?: string
  id: number
  description: string
  src: 'http://test'
  start: Date
  index: number
  projectId: number
  medium: Medium
  insertion: Date
  width: number
  length: number
  height: number
}
