import { Attribute } from './Attribute'

/**
 * on donne une liste d'attribut au param parser
 * et il va checker et récupérer les donner de chaque attribut
 */
abstract class AttributeParser {
  attributes: Array<Attribute>
  parsedDict

  constructor(attributes) {
    this.attributes = attributes
    this.parsedDict = {}
  }

  async parseAll(body: any): Promise<boolean> {
    console.log(body)
    var parseResult = this.attributes.every(async (attribute: Attribute) => {
      console.log('test')
      const name = attribute.name
      var value = body[name]
      if (value == undefined) return true
      console.log(value)
      try {
        const correct = await attribute.parse(value)
        console.log('errro', correct)
        if (correct) this.parsedDict[attribute.name] = attribute.value
        return correct
      } catch (e) {
        return false
      }
    })

    return parseResult
  }

  get middleware() {
    return async (req, res, next) => {
      const thereIsNoError = await this.parseAll(this.getReqSection(req))
      if (!thereIsNoError) return res.json({ error: 'error' })
      req.body.parsed = this.parsedDict
      next()
    }
  }

  abstract getReqSection(req)
}

class ParamParser extends AttributeParser {
  constructor(attributes) {
    super(attributes)
  }

  getReqSection(req) {
    return req.body
  }
}

class QueryParser extends AttributeParser {
  constructor(attributes) {
    super(attributes)
  }

  getReqSection(req) {
    return req.query
  }
}

module.exports = { AttributeParser, QueryParser, ParamParser }
