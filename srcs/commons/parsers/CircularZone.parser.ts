import { ZoneAttribute } from '../../attr/zone'

export function parseRawZone(
  latitude: string,
  longitude: string,
  radius: string
): ZoneAttribute | undefined {
  return new ZoneAttribute(
    tryToParse('latitude', () => toFloat(mustBeDefined(latitude))),
    tryToParse('longitude', () => toFloat(mustBeDefined(longitude))),
    tryToParse('radius', () => toFloat(mustBeDefined(radius)))
  )
}

export function mustBeDefined(value: string | null) {
  if (!value) {
    throw new Error(`Attribute must be defined`)
  }
  return value
}

export function toFloat(value: string) {
  const number = parseFloat(value)
  if (isNaN(number)) {
    throw new Error(`Try to parse value : ${value} as number`)
  }
  return number
}

export function tryToParse<T>(nameAttribute: string, callback: () => T): T {
  try {
    return callback()
  } catch (e) {
    throw new Error(
      `Try to parse attribute : ${nameAttribute} but throw during validation with errors : ${e}`
    )
  }
}
