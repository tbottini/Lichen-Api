import { logger } from '../../../modules/logger'
import { Query } from './Query.interface'

export function parserMiddleware(options) {
  return (req, res, next) => {
    let error
    logger.debug(req.url)
    const rules = Object.entries(options)
    rules.forEach(rule => {
      const [attr, type] = rule
      const value = req.params[attr]
      if (type == 'int') {
        if (value == undefined) error = 'no id was provided'
        let paramValueForAttribute = req.params[attr]
        paramValueForAttribute = parseInt(paramValueForAttribute)

        if (isNaN(paramValueForAttribute))
          error = { error: 'bad format for id' }
        else req.params[attr] = paramValueForAttribute
      }
    })
    if (error) return res.status(400).json(error)
    next()
  }
}

export function parserQuery(options) {
  return (req, res, next) => {
    let error
    logger.debug(req.url)
    const rules = Object.entries(options)
    rules.forEach(rule => {
      const query = rule[0]
      const law = rule[1] as Query
      const queryValue = req.query[query]

      if (queryValue != null) {
        if (law.parse(queryValue)) {
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
