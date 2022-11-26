import { Query } from './Query.interface'
import logger from '../../../modules/logger'

export class QueryDate extends Query {
  constructor() {
    super('date')
  }

  parse(value): boolean {
    this.value = new Date(value)

    logger.debug(value)

    if (isNaN(this.value.getTime())) {
      this.value = undefined
      return false
    }

    return true
  }
}
