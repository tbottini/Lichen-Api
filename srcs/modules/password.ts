import bcrypt from 'bcryptjs'
const regex = require('./regexUtils')

export async function hash(pure: string) {
  return await bcrypt.hash(pure, 8)
}

export function check(password: string) {
  return regex.password.test(password)
}

/**
 * pure is the hash of vaulted password
 */
export function compare(pure: string, src: string) {
  return bcrypt.compare(pure, src)
}
