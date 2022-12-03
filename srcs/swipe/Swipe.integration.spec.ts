import { app } from '../index'
import { clearDatabase } from '../../tests/helpers/clearDatabase.helper'
import { addUser } from '../../tests/helpers/user.test.helper'
import { mediumEnum } from '../medium/mediumEnum'
import {
  configureAddToken,
  createUserWithProjects,
} from '../../tests/helpers/request.helper'
const request = require('supertest')

describe('Swipe integration spec', () => {
  let addToken: (app) => any

  beforeAll(async () => {
    await clearDatabase()

    const { token } = await addUser({
      email: 'customer@test.com',
      firstname: 'customer',
      lastname: 'customer-lastname',
    })

    addToken = configureAddToken(token)

    await createUserWithProjects()
  })

  it('should provide artwork feed of any types', async () => {
    const res = await addToken(request(app).get('/swipe/random').query({}))

    expect(res.body).toHaveLength(2)
  })

  it('should provide artwork feed with medium', async () => {
    const res = await addToken(
      request(app)
        .get('/swipe/random')
        .query({ medium: [mediumEnum.DRAWING, mediumEnum.EDITING].join(',') })
    )

    expect(res.body).toHaveLength(1)
  })

  it('should acept query without token and provide all artworks if no filter was provided', async () => {
    const res = await request(app).get('/swipe/random').query({})
    expect(res.body).toHaveLength(2)
  })
})
