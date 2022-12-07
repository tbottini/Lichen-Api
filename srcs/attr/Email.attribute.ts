import { PrismaClient } from '@prisma/client'
const regex = require('../modules/regexUtils')
const prisma = new PrismaClient()
import { logger } from '../modules/logger'

export class EmailAttr {
  _value
  error = false
  _checkCalled = false
  errorMsg

  get value() {
    if (!this._checkCalled)
      throw new Error(
        "Email Attr - check() wasn't called whereas value is being get"
      )
    return this._value
  }

  /**
   * unlike other attribute email must called
   * we'll verify if email doesn't exist in the database
   * if it isn't free, error set as true
   */
  async check(newEmail) {
    logger.debug('check email ' + newEmail)
    this._checkCalled = true
    if (!newEmail) return

    const emailIsCorretlyFormat = regex.email.test(newEmail)
    if (!emailIsCorretlyFormat) {
      this.error = true
      this.errorMsg = 'Email is wrongly format'
      return false
    }

    const res = await prisma.user.findUnique({
      where: {
        email: newEmail,
      },
    })

    logger.debug('email exist : ', res)

    if (res != null) {
      this.error = true
      this.errorMsg = 'Email is already taken'
      return false
    }

    this._value = newEmail
    return true
  }
}
