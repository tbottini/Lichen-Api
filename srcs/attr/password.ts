import { PrismaClient } from '@prisma/client'
const regex = require('../modules/regexUtils')
const prisma = new PrismaClient()
const passwordModule = require('../modules/password')
import logger from '../modules/logger'

class PasswordAttr {
  _value
  error = false
  errorMsg

  async getValue() {
    if (!this._value) return undefined
    logger.info('hash processing...')
    return await passwordModule.hash(this._value)
  }

  constructor(password) {
    logger.debug('password present : ', !!password)
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
