import { NumberLiteralType } from 'typescript'
import logger from './logger'

function parserMiddleware(options) {
  return (req, res, next) => {
    var error
    logger.debug(req.url)
    var rules = Object.entries(options)
    rules.forEach(rule => {
      logger.debug(rule)
      const [attr, type] = rule
      const value = req.params[attr]
      if (type == 'int') {
        if (value == undefined) error = 'no id was provided'
        var v = req.params[attr]
        v = parseInt(v)

        logger.debug(v)
        if (isNaN(v)) error = { error: 'bad format for id' }
        else req.params[attr] = v
      }
    })
    if (error) return res.status(400).json(error)
    next()
  }
}

abstract class Query {
  type: string
  value

  constructor(type: string) {
    this.type = type
  }

  abstract parse(value): Boolean
}

class QueryEnum extends Query {
  isList: boolean
  dict

  constructor(dict, params) {
    super('enum')
    this.dict = dict
    this.isList = params?.isList || null
  }

  parse(value): Boolean {
    if (value == '') {
      this.value = undefined
      return true
    }
    logger.debug('ENUM PARSER', value, 'isList', this.isList)
    if (this.isList) {
      this.value = value.split(',').map(mediumStr => this.dict[mediumStr])
      var err = this.value.filter(val => !val)
      if (err.length > 0) return false
      return true
    }
    this.value = this.dict[value]
    if (!this.value) return false
    return true
  }
}

class QueryString extends Query {
  constructor() {
    super('string')
  }

  parse(value): Boolean {
    this.value = value
    return true
  }
}

class QueryDate extends Query {
  constructor() {
    super('date')
  }

  parse(value): Boolean {
    this.value = new Date(value)

    logger.debug(value)

    if (isNaN(this.value.getTime())) {
      this.value = undefined
      return false
    }

    return true
  }
}

class QueryInt extends Query {
  max?: number
  min?: number
  default?: number
  constructor({ max = null, min = null, defaultValue = null }) {
    super('int')
    if (max) this.max = max!
    if (min) this.min = min!
    if (defaultValue) this.default = defaultValue!
  }

  parse(value: string): Boolean {
    if (!value && this.default) {
      this.value = this.default
      return true
    }

    this.value = parseInt(value)

    logger.debug(value)

    if (isNaN(this.value)) {
      this.value = undefined
      return false
    }

    if (this.max && this.value > this.max) return false
    else if (this.min && this.value < this.min) return false

    return true
  }
}

function parserQuery(options) {
  return (req, res, next) => {
    var error
    logger.debug(req.url)
    var rules = Object.entries(options)
    rules.forEach(rule => {
      logger.debug(rule)
      const query = rule[0]
      var law: Query
      law = rule[1] as Query
      const value = req.query[query]

      if (value != null) {
        if (law!.parse(value)) {
          req.query[query] = law.value
        } else {
          logger.debug('bad query format')
          error = 'bad format for ' + law.type + ' : ' + query
        }
      }
    })
    if (error) return res.status(400).json({ error: error })
    next()
  }
}

module.exports = {
  parserMiddleware,
  parserQuery,
  QueryDate,
  QueryEnum,
  QueryString,
  QueryInt,
}
