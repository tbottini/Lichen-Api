const { execPath } = require('process')
const request = require('supertest')
const app = require('../srcs/index')
const { UserTestHandler } = require('./userTestHandler')
//todo set the database url with a env variable and change it in jest test

async function getSelf(token, expectValue = 200) {
  expect(token).not.toBe(undefined)
  var res = await request(app)
    .get('/users/self')
    .set('Authorization', 'bearer ' + token)

  console.log(res.statusCode)
  console.log(res.body)
  expect(res.statusCode).toBe(200)

  return res.body
}

async function createUser() {
  var data = {
    firstname: 'george',
    lastname: 'orwell',
    email: 'les.animaux@bigbrother.com',
    password: 'notEffiscientPassword@1234,',
  }

  var res = await request(app).post('/users/register').send(data)

  return res.body.token
}

var token = ''
var ref = {}

describe('Likes', () => {
  beforeAll(async () => {
    await UserTestHandler.clearDatabase()
    token = await createUser()
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })

  it('should create an event', async () => {
    var res = await request(app)
      .post('/events')

      .set('Authorization', 'bearer ' + token)
      .send({
        name: 'event#1',
        description: 'description#1',
        dateStart: Date.UTC(2000, 12, 30, 12, 30, 10),
        dateEnd: Date.UTC(2001, 01, 3, 12, 30, 10),
        latitude: 45,
        longitude: 45,
      })

    const body = res.body

    console.log('create event', body)

    var res = await request(app).get('/events/' + body.id)

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

    var event = await request(app)
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
    var event = await request(app)
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
    var datenumber = Date.UTC(2002, 3, 12, 22, 0, 0)
    var event = await request(app)
      .post('/events')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('name', 'event#2')
      .field('dateStart', datenumber)

    console.log('DATE RESULT', event.body)

    expect(event.body).toMatchObject({
      name: 'event#2',
    })
    var dateReceived = new Date(event.body.dateStart)
    console.log('COMPARE', dateReceived.getTime(), datenumber)
    expect(dateReceived.getTime() == datenumber).toBe(true)
    expect(event.body).toHaveProperty('src')
    expect(event.status).toBe(200)
  })

  it('should find an event depending of his medium', async () => {
    var user = await UserTestHandler.addUser({
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

    var e = await request(app).get('/events')
    console.log(e.body[1].organisator)

    var eventsGet = await request(app).get(
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
    var self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)
    console.log('before follow ', self.body)

    var follow = await request(app)
      .post('/events/' + ref.event.id.toString() + '/follow')
      .set('Authorization', 'bearer ' + token)

    expect(follow.status).toBe(200)
    console.log('EVENT FOLLOW')

    var self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)

    console.log('test', self.body)
    expect(self.body.eventFollow.length).toBe(1)
  })

  it('should unfollow event', async () => {
    var unfollow = await request(app)
      .delete('/events/' + ref.event.id.toString() + '/follow')
      .set('Authorization', 'bearer ' + token)

    expect(unfollow.status).toBe(200)

    var self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)

    expect(self.body.eventFollow.length).toBe(0)
  })

  it('should modify an event', async () => {
    var event = await request(app)
      .post('/events')

      .set('Authorization', 'bearer ' + token)
      .send({
        name: 'event#1',
        description: 'description#1',
        dateStart: Date.UTC(2000, 12, 30, 12, 30, 10),
        dateEnd: Date.UTC(2001, 01, 3, 12, 30, 10),
      })

    console.log('EVENT CREATED', event.body)

    var resEvent = await request(app)
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
