import { addUser, createUserList } from './helpers/user.test.helper'
const request = require('supertest')
import { app } from '../srcs/index'
import { clearDatabase } from './helpers/clearDatabase.helper'

export class UserTestHandler {
  static async addUser(
    userCreationTestDto: UserFixtureCreationDto
  ): Promise<any> {
    return addUser(userCreationTestDto)
  }

  static async updateUser(token, { firstname, lastname, style, medium }) {
    const res = await request(app)
      .put('/users')
      .send({
        firstname,
        lastname,
      })
      .set('Authorization', 'bearer ' + token)

    return {
      ...res.body,
      token: token,
    }
  }

  static async updateGallery(token, { latitude, longitude }) {
    const res = await request(app)
      .put('/users/self/gallery')
      .send({ longitude, latitude })
      .set('Authorization', 'bearer ' + token)

    return {
      latitude: res.body.gallery.latitude,
      longitude: res.body.gallery.longitude,
    }
  }

  static async self(token) {
    const r = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)

    return r.body
  }

  static async createProject(token, { title, artworks }) {
    const projectResult = await request(app)
      .post('/projects')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('title', title || 'null')

    const project = projectResult.body
    project.artworks = []

    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i]
      const result = await request(app)
        .post('/projects/' + project.id + '/artworks')
        .attach('file', './tests/img_test.jpg')
        .set('Authorization', 'bearer ' + token)
        .field('title', artwork.title || 'null')
        .field('medium', artwork.medium || 'null')

      project.artworks.push(result.body)
    }
    return project
  }

  static async createUserList(listData: UserFixtureCreationDto[]) {
    return createUserList(listData)
  }

  async searchUsers({ firstname, lastname, zone, style, medium }) {
    const q = {}
    if (firstname) q['firstname'] = firstname
    if (lastname) q['lastname'] = lastname
    if (zone) {
      q['latitude'] = zone.latitude
      q['longitude'] = zone.longitude
      q['radius'] = zone.radius
    }
    if (style) {
      q['style'] = style
    }
    if (medium) {
      q['medium'] = medium
    }

    const res = await request(app).get('/users').query(q)

    return res.body
  }

  // event part

  static async createEvent(
    token,
    { name, description, dateStart, medium, longitude, latitude }
  ) {
    const res = await request(app)
      .post('/events')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('name', name || 'null')
      .field('description', description || 'null')
      .field('dateStart', dateStart ? dateStart.toString() : 'null')
      .field('medium', medium ? medium : 'null')
      .field('longitude', longitude ? longitude : 'null')
      .field('latitude', latitude ? latitude : 'null')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      name: name,
      description: description,
    })
    expect(res.body).toHaveProperty('src')
  }

  static async createListEvent(token, listData) {
    if (!listData) return undefined
    return await Promise.all(
      listData.map(async data => await this.createEvent(token, data))
    )
  }

  static async clearDatabase(): Promise<void> {
    await clearDatabase()
  }
}

export interface UserFixtureCreationDto {
  email?: string
  firstname?: string
  lastname?: string
  latitude?: number
  longitude?: number
  geoReferenced?: boolean
  events?
  medium?
  projects?
}
