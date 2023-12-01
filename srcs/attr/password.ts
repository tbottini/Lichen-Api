import { hash } from '../modules/password'

const regex = require('../modules/regexUtils')

class PasswordAttr {
  _value
  error = false
  errorMsg

  async getValue() {
    if (!this._value) return undefined

    return await hash(this._value)
  }

  constructor(password) {
    if (!password) return

    const passwordIsCorretlyFormat = regex.password.test(password)

    if (!passwordIsCorretlyFormat) {
      this.error = true
      this.errorMsg = 'Password is wrongly format'
      return
    }

    this._value = password
  }
}

module.exports = PasswordAttr
