import { UserTestHandler } from '../../tests/userTestHandler'
const request = require('supertest')
import { app } from '../index'
import { User } from '@prisma/client'
import { addUser } from '../../tests/helpers/user.test.helper'
import {
  configureAddToken,
  createUserWithProjects,
} from '../../tests/helpers/request.helper'
import { followUser } from '../../tests/helpers/follow.helper'

console.log(app)

describe('News Routes Test', () => {
  let selfToken: string
  let addToken: (app) => any

  let createdUser: User

  beforeAll(async () => {
    const { token: createToken } = await addUser({
      email: 'customer@test.com',
      firstname: 'customer',
      lastname: 'customer-lastname',
    })
    selfToken = createToken

    addToken = configureAddToken(selfToken)

    const createdUserInfo = await createUserWithProjects()
    createdUser = await UserTestHandler.self(createdUserInfo.token)
  })

  it('should return project with artworks', async () => {
    await followUser(selfToken, {
      followedId: createdUser.id,
    })

    const res = await addToken(request(app).get('/news')).query({})

    expect(res.body.artworks).toHaveLength(2)
    const artwork = res.body.artworks[0]
    expect(artwork.project).toBeDefined()
    expect(artwork.project.artworks).toHaveLength(2)
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })
})
