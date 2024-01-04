import { app } from '../../srcs'
import { UserPrivateDto } from '../../srcs/users/repositories/Users.scope'
import { UserPublicDto } from '../../srcs/users/repositories/Users.scope'
import { MediumValues } from '../../srcs/medium/mediumEnum'

import { EventEntity } from '../../srcs/events/types/Event.type'
const request = require('supertest')

export async function apiCreateUser(creationData?: {
  email?: string | undefined
  firstname?: string | undefined
  lastname?: string | undefined
  medium?: MediumValues | undefined
  password?: string | undefined
}): Promise<string> {
  const DEFAULT_PASSWORD = 'PasswordTest1234@,'

  const res = await request(app)
    .post('/users/register')
    .send({
      email: 'test@jean.com',
      ...creationData,
      password: creationData?.password ?? DEFAULT_PASSWORD,
    })

  return res.body.token
}

export async function apiGetUser(userId: number): Promise<UserPrivateDto> {
  const res = await request(app).get('/users/' + userId)

  return res.body
}

export async function apiSelf(token: string): Promise<UserPrivateDto> {
  const res = await request(app)
    .get('/users/self')
    .set('Authorization', 'bearer ' + token)

  return res.body
}

export async function apiLogin(log: {
  email: string | undefined
}): Promise<string> {
  const DEFAULT_PASSWORD = 'PasswordTest1234@,'

  const res = await request(app).post('/users/login').send({
    email: log.email,
    password: DEFAULT_PASSWORD,
  })

  return res.body.token
}

export async function apiUpdateUserPosition(
  token: string,
  data: { longitude: string; latitude: string }
): Promise<UserPublicDto> {
  const res = await request(app)
    .put('/users/new-position')
    .set('Authorization', 'bearer ' + token)
    .send({
      position: {
        longitude: data.longitude,
        latitude: data.latitude,
      },
    })

  return res.body
}

export async function apiCreateProject(
  token: string,
  data?: { title: string }
) {
  const project = (
    await request(app)
      .post('/projects')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('title', data?.title ?? 'title')
  ).body

  return project
}

export async function apiCreateArtwork(
  token: string,
  projectId: number,
  data?: { title: string; height: number }
) {
  const artwork = (
    await request(app)
      .post('/projects/' + projectId + '/artworks')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('title', data?.title ?? 'title')
      .field('height', data?.height ?? 200)
  ).body

  return artwork
}

export function expectDefaultPositionIsDefined(user: {
  position: { longitude: number; latitude: number } | undefined | null
}) {
  expect(user.position).toBeDefined()
  expect(user?.position?.longitude).toBeDefined()
  expect(user?.position?.latitude).toBeDefined()
}

export async function apiRetrieveTasks(filter?: {
  longitude: number
  latitude: number
  radius: number
}) {
  const resTasks = await request(app).get('/artworks/').query({
    longitude: filter?.longitude,
    latitude: filter?.latitude,
    radius: filter?.radius,
  })

  return resTasks.body
}

export async function apiCreateEvent(
  token: string,
  eventData?: Partial<EventEntity>
) {
  const res = await request(app)
    .post('/events')
    .set('Authorization', 'bearer ' + token)
    .send({
      name: 'event#1',
      description: 'description#1',
      dateStart: eventData?.dateStart ?? Date.UTC(2000, 12, 30, 12, 30, 10),
      dateEnd: eventData?.dateEnd,
      latitude: eventData?.latitude,
      longitude: eventData?.longitude,
      medium: eventData?.medium,
    })

  return res.body
}

export async function apiDeleteEvent(token: string, eventId: number) {
  const res = await request(app)
    .delete('/events/' + eventId)
    .set('Authorization', 'bearer ' + token)
}

export async function apiGetEvent(eventId: number) {
  return (await request(app).get('/events/' + eventId)).body
}

export async function apiGetEvents() {
  return (await request(app).get('/events/')).body
}

export async function apiFollow(token: string, eventId: number) {
  const res = await request(app)
    .post('/events/' + eventId + '/follow')
    .set('Authorization', 'bearer ' + token)
  return res.body
}
