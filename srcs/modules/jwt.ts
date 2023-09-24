const jwt = require('jsonwebtoken')
const jwtExpress = require('express-jwt')

if (process.env.JWT_SECRET == null) {
  throw new Error("JWT_SECRET var wasn't defined")
}

const SECRET = process.env.JWT_SECRET

export function create(user) {
  delete user.password

  return jwt.sign(user, SECRET, { algorithm: 'HS256' })
}

export const createJwt = create

export function verify(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET, {
      algorithm: 'HS256',
    })
    return decoded
  } catch (err) {
    console.log(err)
    return null
  }
}

export const middleware = [
  jwtExpress({
    secret: SECRET,
    algorithms: ['HS256'],
  }),
]

export const unrequiredJwt = jwtExpress({
  secret: SECRET,
  algorithms: ['HS256'],
  credentialsRequired: false,
})
