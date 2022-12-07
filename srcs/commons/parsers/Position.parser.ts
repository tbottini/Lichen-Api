import { Position } from '../../interfaces/Position.type'
import { mustBeDefined, toFloat, tryToParse } from './parser.common'

export function parsePosition(position?: {
  longitude?: string
  latitude?: string
}): Position {
  return {
    longitude: tryToParse('latitude', () =>
      toFloat(mustBeDefined(position?.latitude))
    ),
    latitude: tryToParse('longitude', () =>
      toFloat(mustBeDefined(position?.longitude))
    ),
  }
}
