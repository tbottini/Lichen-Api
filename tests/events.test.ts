const request = require('supertest')
import { UserTestHandler } from './userTestHandler'
import { app } from '../srcs/index'
//todo set the database url with a env variable and change it in jest test

let token = ''
const ref: any = {}

describe('Likes', () => {
  beforeAll(async () => {
    await UserTestHandler.clearDatabase()
    token = await createUser()
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })

  it('should create an event', async () => {
    let res = await request(app)
      .post('/events')

      .set('Authorization', 'bearer ' + token)
      .send({
        name: 'event#1',
        description: 'description#1',
        dateStart: Date.UTC(2000, 12, 30, 12, 30, 10),
        dateEnd: Date.UTC(2001, 1, 3, 12, 30, 10),
        latitude: 45,
        longitude: 45,
      })

    const body = res.body

    console.log('create event', body)

    res = await request(app).get('/events/' + body.id)

    console.log('get event', res.body)

    expect(res.body).toMatchObject({
      id: body.id,
      name: 'event#1',
      description: 'description#1',
      longitude: 45,
      latitude: 45,
      organisator: {
        firstname: 'george',
        lastname: 'orwell',
      },
    })
  })

  it('should create an event with image', async () => {
    console.log('EVENT', Date.UTC(2002, 3, 12, 22, 0, 0))

    const event = await request(app)
      .post('/events')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('name', 'event#2')
      .field('dateStart', Date.UTC(2002, 3, 12, 22, 0, 0))
      .field('dateEnd', Date.UTC(2002, 3, 12, 24, 0, 0))

    console.log('RESULT TEST', event.body)
    expect(event.body).toMatchObject({
      name: 'event#2',
    })
    expect(event.body).toHaveProperty('src')
    expect(event.status).toBe(200)

    ref.event = event.body
  })

  it('should create an event with date type string', async () => {
    const event = await request(app)
      .post('/events')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('name', 'event#2')
      .field('dateStart', '2019-10-11 08:52:09.181716')

    console.log('DATE RESULT', event.body)

    expect(event.body).toMatchObject({
      name: 'event#2',
      dateStart: '2019-10-11T06:52:09.181Z',
    })
    expect(event.body).toHaveProperty('src')
    expect(event.status).toBe(200)
  })

  it('should create an event with datenumber', async () => {
    const datenumber = Date.UTC(2002, 3, 12, 22, 0, 0)
    const event = await request(app)
      .post('/events')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('name', 'event#2')
      .field('dateStart', datenumber)

    console.log('DATE RESULT', event.body)

    expect(event.body).toMatchObject({
      name: 'event#2',
    })
    const dateReceived = new Date(event.body.dateStart)
    console.log('COMPARE', dateReceived.getTime(), datenumber)
    expect(dateReceived.getTime() == datenumber).toBe(true)
    expect(event.body).toHaveProperty('src')
    expect(event.status).toBe(200)
  })

  it('should find an event depending of his medium', async () => {
    const user = await UserTestHandler.addUser({
      email: 'test@test.com',
      firstname: 'thomas',
      lastname: 'dumont',
      medium: 'SCULPTURE',
      longitude: 30,
      latitude: 30,
      events: [
        {
          name: 'event#1',
          description: 'description#1',
          dateStart: new Date('2022'),
          longitude: 45,
          latitude: 45,
          medium: 'PAINTING',
        },
      ],
    })

    console.log(user)

    const eventRef = user.events[0]
    console.log(eventRef)

    const e = await request(app).get('/events')
    console.log(e.body[1].organisator)

    const eventsGet = await request(app).get(
      '/events?longitude=45.0&latitude=45.0&radius=30&medium=PAINTING'
    )

    console.log(eventsGet.body)

    expect(eventsGet.statusCode).toBe(200)
    expect(eventsGet.body.length).toBe(1)

    var eventsGetMultipleFilter = await request(app).get(
      '/events?longitude=45.0&latitude=45.0&radius=30&medium=PAINTING,SCULPTURE'
    )

    console.log(eventsGetMultipleFilter.body)

    expect(eventsGetMultipleFilter.statusCode).toBe(200)
    expect(eventsGetMultipleFilter.body.length).toBe(1)

    var eventBadCall = await request(app).get(
      '/events?longitude=45.0&latitude=45.0&radius=30&medium=SCULPTURE'
    )
    expect(eventBadCall.statusCode).toBe(200)
    expect(eventBadCall.body.length).toBe(0)
  })

  it('should follow event', async () => {
    let self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)
    console.log('before follow ', self.body)

    const follow = await request(app)
      .post('/events/' + ref.event.id.toString() + '/follow')
      .set('Authorization', 'bearer ' + token)

    expect(follow.status).toBe(200)
    console.log('EVENT FOLLOW')

    self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)

    console.log('test', self.body)
    expect(self.body.eventFollow.length).toBe(1)
  })

  it('should unfollow event', async () => {
    const unfollow = await request(app)
      .delete('/events/' + ref.event.id.toString() + '/follow')
      .set('Authorization', 'bearer ' + token)

    expect(unfollow.status).toBe(200)

    const self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)

    expect(self.body.eventFollow.length).toBe(0)
  })

  it('should modify an event', async () => {
    const event = await request(app)
      .post('/events')

      .set('Authorization', 'bearer ' + token)
      .send({
        name: 'event#1',
        description: 'description#1',
        dateStart: Date.UTC(2000, 12, 30, 12, 30, 10),
        dateEnd: Date.UTC(2001, 1, 3, 12, 30, 10),
      })

    console.log('EVENT CREATED', event.body)

    const resEvent = await request(app)
      .put('/events/' + event.body.id)
      .set('Authorization', 'bearer ' + token)
      .send({
        longitude: 10,
        latitude: 10,
      })

    console.log('EVENT UPDATE', resEvent.body)
    expect(resEvent.status).toBe(200)
    console.log(resEvent.body, 'TESTT', resEvent.body.latitute)
    expect(resEvent.body.latitude).toBe(10)
    expect(resEvent.body.longitude).toBe(10)
  })
})

async function createUser() {
  const data = {
    firstname: 'george',
    lastname: 'orwell',
    email: 'les.animaux@bigbrother.com',
    password: 'notEffiscientPassword@1234,',
  }

  const res = await request(app).post('/users/register').send(data)

  return res.body.token
}
