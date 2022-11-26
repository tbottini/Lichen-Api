import { Query } from './Query.interface'
import logger from '../../../modules/logger'

export class QueryInt extends Query {
  max?: number
  min?: number
  default?: number
  constructor({
    max,
    min,
    defaultValue,
  }: {
    max?: number
    min?: number
    defaultValue?: number
  }) {
    super('int')
    if (max) this.max = max!
    if (min) this.min = min!
    if (defaultValue) this.default = defaultValue!
  }

  parse(value: string): boolean {
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
