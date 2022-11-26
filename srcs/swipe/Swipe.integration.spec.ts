import { app } from '../index'
import { clearDatabase } from '../../tests/helpers/clearDatabase.helper'
import { addUser } from '../../tests/helpers/user.test.helper'
import { mediumEnum } from '../medium/mediumEnum'
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
})

const configureAddToken = token => app =>
  app.set('Authorization', 'bearer ' + token)

function createUserWithProjects() {
  return addUser({
    email: 'test@test.com',
    firstname: 'test',
    lastname: 'test2',
    projects: [
      {
        titre: 'project1',
        artworks: [
          {
            title: 'artwork1',
            medium: mediumEnum.DRAWING,
          },
          {
            title: 'artwork2',
          },
        ],
      },
    ],
  })
}
