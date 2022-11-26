import { Query } from './Query.interface'

export class QueryEnum extends Query {
  isList: boolean
  dict: Record<string, string>

  constructor(enumMap, params?: { isList: boolean }) {
    super('enum')
    this.dict = enumMap
    this.isList = params?.isList ?? false
  }

  parse(input: string | undefined): boolean {
    if (input == '' || !input) {
      this.value = undefined
      return true
    }

    if (this.isList) {
      this.value = input.split(',').map(mediumStr => this.dict[mediumStr])

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
