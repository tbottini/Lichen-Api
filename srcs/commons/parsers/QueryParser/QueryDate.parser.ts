import { Query } from './Query.interface'

export class QueryDate extends Query {
  constructor() {
    super('date')
  }

  parse(value): boolean {
    this.value = new Date(value)

    if (isNaN(this.value.getTime())) {
      this.value = undefined
      return false
    }

    return true
  }
}
