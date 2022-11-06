var { FloatAttribute } = require('../srcs/attr/Attribute')
const { ParamParser } = require('../srcs/attr/ParamParser')

describe('Attribute test', () => {
  it('should be correct with : 10.5', async () => {
    var a = new FloatAttribute('float')

    expect(await a.parse('10.5')).toBe(true)
  })

  it('should be uncorrect with : undefined', async () => {
    var a = new FloatAttribute('float')

    expect(await a.parse(undefined)).toBe(false)
  })

  it('should parse all the req', async () => {
    var req = {
      body: {
        a: '127.0',
        b: 127,
        c: 126,
      },
    }

    var parser = new ParamParser([
      new FloatAttribute('a'),
      new FloatAttribute('b'),
      new FloatAttribute('c'),
    ])

    var res = await parser.parseAll(parser.getReqSection(req))

    console.log(res)
    expect(res).toBe(true)
    console.log(parser.parsedDict)
    expect(parser.parsedDict).toMatchObject({
      a: 127.0,
      b: 127,
      c: 126,
    })
  })
})
