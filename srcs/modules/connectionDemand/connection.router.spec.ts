import { UserTestHandler } from '../../../tests/userTestHandler'
const request = require('supertest')
import { app } from '../../index'

describe('connection router', () => {
  beforeAll(async () => {
    await UserTestHandler.clearDatabase()
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })

  it('should create a connection with token', async () => {
    const from = await UserTestHandler.addUser({
      email: 'oulean@journaux.com',
      firstname: 'arnaud',
      lastname: 'bot',
    })

    const to = await UserTestHandler.addUser({
      email: 'oulean2@journaux.com',
      firstname: 'thomas',
      lastname: 'bot',
    })

    console.log(to)

    const demandRes = await request(app)
      .post('/connection/' + to.id)
      .set('Authorization', 'bearer ' + from.token)
      .send({ requestContent: 'hello' })
    expect(demandRes.status).toEqual(200)
    expect(demandRes.body.toEmail).toEqual(to.email)
    expect(demandRes.body.fromEmail).toEqual(from.email)
    expect(demandRes.body.id).toBeDefined()
  })
})
