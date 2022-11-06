import logger from '../modules/logger'
class EnumAttr {
  value
  error = false
  constructor(dict, value) {
    //if value is undefined or null
    //we keept the exact value
    //if null prisma will interpret that like a real value
    //if undefined will ignore it
    if (!value) {
      this.value = value
      return
    } else this.value = dict[value]
  }
}

module.exports = EnumAttr
