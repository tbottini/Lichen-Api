var jwt = require('jsonwebtoken')
var jwtExpress = require('express-jwt')

if (process.env.JWT_SECRET == null) {
  throw new Error("JWT_SECRET var wasn't defined")
}

const SECRET = process.env.JWT_SECRET

export function create(user) {
  delete user.password

  return jwt.sign(user, SECRET, { algorithm: 'HS256' })
}

export function verify(jwt) {
  try {
    const decoded = jwt.verify(jwt, SECRET)
    return decoded
  } catch (err) {
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
