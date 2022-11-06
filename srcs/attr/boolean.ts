class BoolAttr {
  value?: boolean
  error?: string
  constructor(value) {
    if (typeof value == 'string') {
      try {
        this.value = JSON.parse(value.toLowerCase())
      } catch (e) {
        this.error = 'bad value for attribute boolean'
      }
    } else if (typeof value == 'boolean') {
      this.value = value
    }
  }
}

module.exports = { BoolAttr }
