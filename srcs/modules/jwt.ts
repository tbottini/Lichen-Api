var jwt = require('jsonwebtoken')
var jwtExpress = require('express-jwt')

if (process.env.JWT_SECRET == null) {
  throw new Error("JWT_SECRET var wasn't defined")
}

const SECRET = process.env.JWT_SECRET
function create(user) {
  delete user.password

  return jwt.sign(user, SECRET, { algorithm: 'HS256' })
}

function verify(jwt) {
  try {
    var decoded = jwt.verify(jwt, SECRET)
    return decoded
  } catch (err) {
    return null
  }
}

var middleware = [jwtExpress({ secret: SECRET, algorithms: ['HS256'] })]

module.exports = { create, verify, middleware }
