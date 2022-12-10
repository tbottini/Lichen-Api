import { parseMultipleEnum } from './Enum.parser'

describe('parseMultipleEnum', () => {
  it('should parse multiple enums successfully', () => {
    const mediums = parseMultipleEnum('TEST,TEST2', {
      TEST: 'hello',
      TEST2: 'world',
    })

    expect(mediums).toEqual(['hello', 'world'])
  })

  it('should parse enum even if there are only one enum value', () => {
    const mediums = parseMultipleEnum('TEST', {
      TEST: 'hello',
      TEST2: 'world',
    })

    expect(mediums).toEqual(['hello'])
  })

  it('should parse enum even if there are no value', () => {
    const mediums = parseMultipleEnum('', {
      TEST: 'hello',
      TEST2: 'world',
    })

    expect(mediums).toEqual([])
  })

  it("should throw an error if we don't find enum", () => {
    expect(() =>
      parseMultipleEnum('TEST3', {
        TEST: 'hello',
        TEST2: 'world',
      })
    ).toThrow()
  })
})
