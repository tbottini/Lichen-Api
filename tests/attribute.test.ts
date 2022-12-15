const { FloatAttribute } = require('../srcs/attr/Attribute')
const { ParamParser } = require('../srcs/attr/ParamParser')

describe('Attribute test', () => {
  it('should be correct with : 10.5', async () => {
    const floatAttribute = new FloatAttribute('float')

    expect(await floatAttribute.parse('10.5')).toBe(true)
  })

  it('should be uncorrect with : undefined', async () => {
    const floatAttribute = new FloatAttribute('float')

    expect(await floatAttribute.parse(undefined)).toBe(false)
  })

  it('should parse all the req', async () => {
    const req = {
      body: {
        a: '127.0',
        b: 127,
        c: 126,
      },
    }

    const parser = new ParamParser([
      new FloatAttribute('a'),
      new FloatAttribute('b'),
      new FloatAttribute('c'),
    ])

    const res = await parser.parseAll(parser.getReqSection(req))

    expect(res).toBe(true)

    expect(parser.parsedDict).toMatchObject({
      a: 127.0,
      b: 127,
      c: 126,
    })
  })
})
