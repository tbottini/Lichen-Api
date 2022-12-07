export function mustBeDefined(value: string | null | undefined) {
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
