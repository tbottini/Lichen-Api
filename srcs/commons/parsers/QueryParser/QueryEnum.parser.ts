import { Query } from './Query.interface'

export class QueryEnum extends Query {
  isList: boolean
  dict: Record<string, string>

  constructor(
    enumReferences: Record<string, string>,
    params?: { isList: boolean }
  ) {
    super('enum')
    this.dict = enumReferences
    this.isList = params?.isList ?? false
  }

  parse(input: string | undefined): boolean {
    if (input == '' || !input) {
      this.value = undefined
      return true
    }

    if (this.isList) {
      this.value = input.split(',').map(mediumInput => this.dict[mediumInput])

      if (this.value.filter(v => !v).length > 0) {
        return false
      }
      return true
    }

    this.value = this.dict[input]
    if (!this.value) {
      return false
    }
    return true
  }
}
