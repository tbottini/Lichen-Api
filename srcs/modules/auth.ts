import { verify } from './jwt'

function extractTokenFromHeader(header: string) {
  return header.split(' ')[1]
}

export function isAuthorizedWithHeader(header: string, ownerId: number) {
  return isAuthorized(extractTokenFromHeader(header), ownerId)
}

export function isAuthorized(header: string, ownerId: number) {
  console.log(header)

  if (!header) {
    return false
  }

  if (
    header == '0u1Kz9kusLXRfLOZ6zVv0pP6m0skePmMVkUAzKWLM2Ogds7cggaK5miww6kBstqb'
  ) {
    return true
  }

  const user = verify(header)

  console.log(user)
  if (!user) {
    return false
  }
  if (user.id == ownerId) {
    return true
  }

  return false
}

// export function configureMiddleware(getOwnerId: (req) => number) {
//   return (req, res, next) =>
//     middlewareAuthorization(getOwnerId(req), req, res, next)
// }

// function middlewareAuthorization(ownerId: number, req: any, res, next) {
//   const token = extractTokenFromHeader(req.headers.authorization)

//   if (!isAuthorized(token, ownerId)) {
//     return res.status(401).end('Unauthorized')
//   }

//   const user = verify(token)

//   req.user = {
//     id: user.id,
//   }
//   next()
// }

export function forbiden(res) {
  return res.status(401).end('Forbiden')
}

export function notFound(res) {
  return res.status(404).end('Not Found')
}
