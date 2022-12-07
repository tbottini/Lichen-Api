import { CircularZone } from '../../attr/CircularZone'
import { mustBeDefined, toFloat, tryToParse } from './parser.common'

export function parseRawZone(
  latitude: string,
  longitude: string,
  radius: string
): CircularZone | undefined {
  return new CircularZone(
    tryToParse('latitude', () => toFloat(mustBeDefined(latitude))),
    tryToParse('longitude', () => toFloat(mustBeDefined(longitude))),
    tryToParse('radius', () => toFloat(mustBeDefined(radius)))
  )
}
