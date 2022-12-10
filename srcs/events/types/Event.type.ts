import { MediumValues } from '../../medium/mediumEnum'

export type EventEntity = {
  id: number
  name: string
  description: string | null
  src: string | null
  dateStart: Date
  dateEnd: Date | null
  index: number | null
  organisatorId: number
  insertion: Date
  latitude: number | null
  longitude: number | null
  medium: MediumValues | null
}
