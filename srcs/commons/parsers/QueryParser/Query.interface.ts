export abstract class Query {
  type: string
  value

  constructor(type: string) {
    this.type = type
  }

  abstract parse(value): boolean
}
