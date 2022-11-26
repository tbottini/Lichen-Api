import { Query } from './Query.interface'

export class QueryString extends Query {
  constructor() {
    super('string')
  }

  parse(value): boolean {
    this.value = value
    return true
  }
}
