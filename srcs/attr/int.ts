import logger from '../modules/logger'

class IntAttribute {
  _value: number | null | undefined
  error?: string

  constructor(initial: any) {
    this._check(initial)
  }

  getValue(): number | null | undefined {
    if (this.error != null) return undefined
    return this._value
  }

  parse(val: any) {
    this._check(val)
  }

  _check(newValue: any) {
    logger.debug('int value ', newValue)
    if (newValue == 'null' || newValue == '') newValue = null
    if (newValue == null) {
      this._value = newValue
      return this._value
    }
    logger.debug(
      Number.isInteger(newValue),
      typeof newValue,
      parseInt(newValue)
    )
    if (Number.isInteger(newValue)) {
      this._value = newValue
      return this._value
    }
    const number: number = parseInt(newValue!)

    if (isNaN(number)) {
      this.error = "the value isn't of type int"
      return null
    }
    this._value = number
    return number
  }

  haveError(): unknown {
    return this.error != null
  }
}

//TODO middleware parser of attributes

class MiddlewareIntParser {
  isQueryParameter: boolean
  attrs: any

  constructor({ isQueryParameter = false, attr }) {
    this.isQueryParameter = isQueryParameter
    this.attrs = attr
  }

  getParser() {
    return (req, res, next) => {
      var attrsCheck = Object.entries(req.body)
        .filter(([key, value]) => this.attrs.includes(key))
        .map(([key, value]) => {
          return {
            name: key,
            value: new IntAttribute(value as string | null | undefined),
          }
        })

      var errors = attrsCheck.filter(attr => attr.value.haveError())
      logger.debug('errors', errors, errors.length)
      if (errors.length > 0)
        return res
          .status(400)
          .json({
            error: errors.map(error => error.name + ': ' + error.value.error!),
          })

      attrsCheck.forEach(attr => {
        req.body[attr.name] = attr.value.getValue()
      })

      logger.debug('req.body', req.body, 'attrs parsed : ', attrsCheck)

      next()
    }
  }
}

module.exports = { IntAttribute, MiddlewareIntParser }
