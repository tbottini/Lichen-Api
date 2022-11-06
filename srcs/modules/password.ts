import bcrypt from 'bcryptjs'
var regex = require('./regexUtils')

async function hash(pure: string) {
  return await bcrypt.hash(pure, 8)
}

function check(password: string) {
  return regex.password.test(password)
}

/**
 * pure is the hash of vaulted password
 */
function compare(pure: string, src: string) {
  return bcrypt.compare(pure, src)
}

module.exports = {
  hash,
  check: check,
  compare,
}
