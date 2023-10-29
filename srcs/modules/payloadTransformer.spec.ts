import { t } from './payloadTransformer'

describe('payload', () => {
  it('should parse only defined field', () => {
    const schema = t
      .object<{ pseudo?: string; userId: number; isVirtual: boolean }>()
      .schema({
        pseudo: t.string(),
        userId: t.optional().int(),
        isVirtual: t.boolean(),
      })

    const dto = schema.parse({
      pseudo: 'test',
      isVirtual: 'true',
    })

    expect(dto.isVirtual).toEqual(true)
    expect(dto.userId).toBeUndefined()
    expect(dto.pseudo).toEqual('test')
  })

  test('that all field should by optionnal by default', () => {
    const schema = t
      .object<{ pseudo?: string; userId: number; isVirtual: boolean }>()
      .schema({
        pseudo: t.string(),
        userId: t.int(),
        isVirtual: t.boolean(),
      })

    const dto = schema.parse({})
    expect(dto.isVirtual).toBeUndefined()
    expect(dto.userId).toBeUndefined()
    expect(dto.pseudo).toBeUndefined()
  })

  it('should parse optionnal field if defined', () => {
    const schema = t
      .object<{ pseudo?: string; userId: number; isVirtual: boolean }>()
      .schema({
        userId: t.optional().int(),
      })

    const dto = schema.parse({
      userId: '10',
    })
    expect(dto.userId).toEqual(10)
  })

  it('should parse boolean correctly', () => {
    const schema = t.object<{ bool: boolean }>().schema({
      bool: t.required().boolean(),
    })

    expect(
      schema.parse({
        bool: 'true',
      }).bool
    ).toBeTruthy()
    expect(
      schema.parse({
        bool: 'false',
      }).bool
    ).toBeFalsy()
    expect(
      schema.parse({
        bool: 'sldjfqfdlksjm',
      }).bool
    ).toBeFalsy()
  })

  it('should throw an error if required field is not present', () => {
    const schema = t
      .object<{ pseudo?: string; userId: number; isVirtual: boolean }>()
      .schema({
        pseudo: t.string(),
        userId: t.required().int(),
        isVirtual: t.boolean(),
      })

    expect(() =>
      schema.parse({
        pseudo: 'test',
        isVirtual: 'true',
      })
    ).toThrow()
  })
})
