import { tryToParse } from './parser.common'

export function parseMultipleEnum<T>(
  input: string,
  enumDict: Record<string, T>,
  attributeLabel = 'enum'
): T[] {
  if (!input) {
    return []
  }

  const inputValues = input.split(',')

  const parsedValue = tryToParse(attributeLabel, () =>
    isArray(inputValues).map(value => tryToGetEnum(value, enumDict))
  )

  return parsedValue
}

export function tryToGetEnum<T>(
  input: string,
  enumValues: Record<string, T>
): T {
  const foundEnumValue = enumValues[input]
  if (!foundEnumValue) {
    throw new Error('No enum value was found for input value : ' + input)
  }
  return foundEnumValue
}

export function isArray<T>(input: T): T {
  if (!Array.isArray(input)) {
    throw new Error('Is not array : ' + input)
  }
  return input
}
