import { app } from '../index'
const request = require('supertest')
import {
  apiCreateEvent,
  apiCreateUser,
  apiGetEvent,
  apiSelf,
} from '../../tests/helpers/api.helpers'
import { clearDatabase } from '../../tests/helpers/clearDatabase.helper'
import { UserTestHandler } from '../../tests/userTestHandler'
import { prisma } from '../commons/prisma/prisma'

let token: string
const ref: any = {}

const createRefEvent = (userEventCreatorToken: string) =>
  apiCreateEvent(userEventCreatorToken, {
    name: 'event#2',
    dateStart: new Date(2002, 3, 12, 22, 0, 0),
    dateEnd: new Date(2002, 3, 12, 24, 0, 0),
  })

const createRefUser = () =>
  apiCreateUser({
    email: 'test-events-follow@gmail.test',
    firstname: 'george',
    lastname: 'orwell',
  })

describe('Events', () => {
  beforeAll(async () => {
    await clearDatabase()
    token = await apiCreateUser({
      firstname: 'george',
      lastname: 'orwell',
    })
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })

  describe('Creation', () => {
    it('should create an event', async () => {
      const createdEvent = await apiCreateEvent(token, {
        name: 'event#1',
        description: 'description#1',
        dateStart: new Date(2000, 12, 30, 12, 30, 10),
        dateEnd: new Date(2001, 1, 3, 12, 30, 10),
        latitude: 45,
        longitude: 45,
      })

      const event = await apiGetEvent(createdEvent.id)

      expect(event).toMatchObject({
        id: createdEvent.id,
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
      const event = await request(app)
        .post('/events')
        .attach('file', './tests/img_test.jpg')
        .set('Authorization', 'bearer ' + token)
        .field('name', 'event#2')
        .field('dateStart', Date.UTC(2002, 3, 12, 22, 0, 0))
        .field('dateEnd', Date.UTC(2002, 3, 12, 24, 0, 0))

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

      expect(event.body).toMatchObject({
        name: 'event#2',
      })
      const dateReceived = new Date(event.body.dateStart)
      expect(dateReceived.getTime() == datenumber).toBe(true)
      expect(event.body).toHaveProperty('src')
      expect(event.status).toBe(200)
    })
  })

  describe('Retrieve', () => {
    let token: string

    beforeAll(async () => {
      token = await apiCreateUser({
        email: 'thomasbottini@gmail2.com',
        firstname: 'thomas',
        lastname: 'dumont',
      })
    })

    beforeEach(async () => {
      await prisma.event.deleteMany()
    })

    it('should find a events depending of his medium', async () => {
      await apiCreateEvent(token, {
        name: 'event#1',
        description: 'description#1',
        dateStart: new Date('2022'),
        medium: 'PAINTING',
      })

      const eventsGet = await request(app).get('/events').query({
        medium: 'PAINTING',
      })

      expect(eventsGet.statusCode).toBe(200)
      expect(eventsGet.body.length).toBe(1)

      const eventsGetMultipleFilter = await request(app).get('/events').query({
        medium: 'PAINTING,SCULPTURE',
      })

      expect(eventsGetMultipleFilter.statusCode).toBe(200)
      expect(eventsGetMultipleFilter.body.length).toBe(1)
    })

    it('should retrieve event with theire position', async () => {
      const createdEvent = await apiCreateEvent(token, {
        name: 'event#1',
        description: 'description#1',
        dateStart: new Date('2022'),
        latitude: 45,
        longitude: 45,
      })

      const eventGet = await request(app).get('/events').query({
        longitude: 45,
        latitude: 45,
        radius: 30,
      })

      expect(eventGet.body).toHaveLength(1)
      expect(eventGet.body[0].id).toEqual(createdEvent.id)
    })
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

    const resEvent = await request(app)
      .put('/events/' + event.body.id)
      .set('Authorization', 'bearer ' + token)
      .send({
        longitude: 10,
        latitude: 10,
      })

    expect(resEvent.status).toBe(200)
    expect(resEvent.body.latitude).toBe(10)
    expect(resEvent.body.longitude).toBe(10)
  })

  // ! ce test detruit la db, les autres test ne sont pas idempotent du coup il ne faut pas passer les tests au dessus en dessous de ce bloc de tests
  describe('Follow', () => {
    afterEach(async () => {
      await clearDatabase()
    })
    it('should follow event', async () => {
      const tokenUser = await createRefUser()
      const eventFollow = await createRefEvent(tokenUser)

      const follow = await request(app)
        .post('/events/' + eventFollow.id + '/follow')
        .set('Authorization', 'bearer ' + tokenUser)

      expect(follow.status).toBe(200)

      const self = await apiSelf(tokenUser)

      expect(self.eventFollow.length).toBe(1)
    })

    it('should unfollow event', async () => {
      const tokenUser = await createRefUser()
      const eventFollow = await createRefEvent(tokenUser)

      await request(app)
        .post('/events/' + eventFollow.id + '/follow')
        .set('Authorization', 'bearer ' + tokenUser)

      await request(app)
        .delete('/events/' + eventFollow.id + '/follow')
        .set('Authorization', 'bearer ' + tokenUser)

      const self = await apiSelf(tokenUser)

      expect(self.eventFollow.length).toBe(0)
    })
  })
})
