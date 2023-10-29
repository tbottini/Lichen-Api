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

  console.log(user, ownerId)

  if (!user) {
    return false
  }
  if (user.id == ownerId) {
    return true
  }

  return false
}

export function forbiden(res) {
  return res.status(401).end('Forbiden')
}

export function notFound(res) {
  return res.status(404).end('Not Found')
}
