import { UserTestHandler } from './userTestHandler'
const request = require('supertest')
import { app } from '../srcs/index'

console.log(app)

describe('News Routes Test', () => {
  const ref: any = {}

  beforeAll(async () => {
    ref.user = await UserTestHandler.addUser({
      email: 'news@journaux.com',
      firstname: 'news',
      lastname: 'dumont',
    })

    console.log('NEWS', ref.user)
  })

  it('check the insertion time of elements database', async () => {
    let newUser = await UserTestHandler.addUser({
      email: 'lefantomeducoin@journaux.com',
      firstname: 'lefanto',
      lastname: 'me',
      projects: [
        {
          title: 'p1',
          medium: 'SCULPTURE',
          artworks: [{ title: 'artworks1', medium: 'SCULPTURE' }],
        },
      ],
      events: [
        {
          name: 'e1',
          description: 'description',
          medium: 'SCULPTURE',
          dateStart: Date.UTC(2000, 12, 30, 12, 30, 10),
        },
      ],
    })

    console.log('NEWUSER', newUser)

    newUser = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + newUser.token)

    console.log('USERCHECK', newUser.body)
    newUser = newUser.body
    expect(newUser).toMatchObject({
      projects: [
        {
          title: 'p1',
          artworks: [
            {
              title: 'artworks1',
            },
          ],
        },
      ],
      events: [{ name: 'e1' }],
    })

    const currentHours = new Date().getHours()
    const eventHour = new Date(newUser.events[0].insertion).getHours()

    expect(eventHour).toBe(currentHours)
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })
})
