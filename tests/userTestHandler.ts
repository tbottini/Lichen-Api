import { addUser, createUserList } from './helpers/user.test.helper'
const request = require('supertest')
import { app } from '../srcs/index'
import { clearDatabase } from './helpers/clearDatabase.helper'
import {
  Artwork,
  ArtworkLikes,
  Event,
  Medium,
  Project,
  User,
} from '@prisma/client'

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

  static async self(
    token
  ): Promise<
    User & { likes: ArtworkLikes[]; projects: ProjectWithArtworks[] }
  > {
    const r = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)

    return r.body
  }

  static async createProject(
    token: string,
    { title, artworks }: ProjectCreateInput
  ): Promise<ProjectWithArtworks> {
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
    token: string,
    {
      name,
      description,
      dateStart,
      medium,
      longitude,
      latitude,
    }: EventCreateInput
  ): Promise<Event> {
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
    return res.data
  }

  static async createListEvent(
    token: string,
    eventsToCreate: EventCreateInput[]
  ): Promise<Event[] | undefined> {
    if (!eventsToCreate) {
      return undefined
    }
    return await Promise.all(
      eventsToCreate.map(async data => await this.createEvent(token, data))
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
  events?: EventCreateInput[]
  medium?: Medium
  projects?: ProjectCreateInput[]
}

export type ProjectWithArtworks = Project & { artworks: Artwork[] }
export type ProjectCreateInput = {
  title: string | null
  artworks: ArtworkCreateInput[]
}
export type ArtworkCreateInput = {
  title: string | null
  medium?: Medium | null
}

export type EventCreateInput = Partial<{
  name: string
  description: string
  dateStart: Date
  medium: Medium
  longitude: number
  latitude: number
}>
