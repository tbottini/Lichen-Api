import { Query } from './Query.interface'
import logger from '../../../modules/logger'

export class QueryEnum extends Query {
  isList: boolean
  dict

  constructor(dict, params?) {
    super('enum')
    this.dict = dict
    this.isList = params?.isList || null
  }

  parse(value): boolean {
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
