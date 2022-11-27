import { Artwork, Project } from '@prisma/client'

import { UserTestHandler } from './userTestHandler'
const request = require('supertest')
import { app } from '../srcs/index'

describe('Artworks Routes Test', () => {
  let user

  beforeAll(async () => {
    await UserTestHandler.clearDatabase()
    user = await UserTestHandler.addUser({
      email: 'Jean@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })

  const ref: { artwork: Artwork | undefined; project: Project | undefined } = {
    project: undefined,
    artwork: undefined,
  }

  it('should create an artwork', async () => {
    const user = await UserTestHandler.addUser({
      email: 'oulean@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    const project = (
      await request(app)
        .post('/projects')
        .attach('file', './tests/img_test.jpg')
        .set('Authorization', 'bearer ' + user.token)
        .field('title', 'title')
    ).body

    const artwork = (
      await request(app)
        .post('/projects/' + project.id + '/artworks')
        .attach('file', './tests/img_test.jpg')
        .set('Authorization', 'bearer ' + user.token)
        .field('title', 'title')
        .field('height', 200)
    ).body

    expect(artwork).toMatchObject({
      height: 200,
      title: 'title',
    })
  })

  it('should modify an artwork (medium)', async () => {
    const project = await UserTestHandler.createProject(user?.token, {
      title: 'casimodo',
      artworks: [{ title: 'artwork1', medium: 'PAINTING' }],
    })

    const artwork = project.artworks[0]
    expect(artwork).toMatchObject({
      title: 'artwork1',
      medium: 'PAINTING',
    })

    const res = await request(app)
      .put('/artworks/' + artwork.id)
      .set('Authorization', 'bearer ' + user.token)
      .send({
        medium: 'SCULPTURE',
      })

    const artworkModified = res.body
    expect(artworkModified).toMatchObject({
      title: 'artwork1',
      medium: 'SCULPTURE',
    })

    ref.project = project
    ref.artwork = artwork
  })

  it('should modify an artwork dimension', async () => {
    const res = await request(app)
      .put('/artworks/' + ref.artwork?.id)
      .set('Authorization', 'bearer ' + user.token)
      .send({
        length: 30,
        height: 20,
        width: 20,
      })

    expect(res.body).toMatchObject({
      height: 20,
      width: 20,
      length: 30,
    })
    expect(res.status).toBe(200)
  })

  it('should update to null the dimension', async () => {
    var res = await request(app)
      .put('/artworks/' + ref.artwork?.id)
      .set('Authorization', 'bearer ' + user.token)
      .field('length', 'null')
      .field('height', 'null')

    expect(res.body).toMatchObject({
      height: null,
      width: 20,
      length: null,
    })
    expect(res.status).toBe(200)
  })

  it('should follow an artwork', async () => {
    var follow = await request(app)
      .post('/artworks/' + ref.artwork?.id.toString() + '/like')
      .set('Authorization', 'bearer ' + user.token)

    expect(follow.status).toBe(200)

    var self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + user.token)

    expect(self.body.likes.length).toBe(1)
  })

  it('should unfollow an artwork', async () => {
    var unfollow = await request(app)
      .delete('/artworks/' + ref.artwork?.id.toString() + '/like')
      .set('Authorization', 'bearer ' + user.token)

    expect(unfollow.body).toMatchObject({
      count: 1,
    })

    var self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + user.token)

    expect(self.body.likes.length).toBe(0)
  })

  it("should follow an artwork and them check that the artwork isn't followed after is deletion", async () => {
    var u = await UserTestHandler.addUser({
      email: 'oulean2@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
      projects: [
        {
          title: 'test',
          artworks: [
            {
              title: 'artwork#1',
            },
          ],
        },
      ],
    })

    var user = await UserTestHandler.self(u.token)

    var uFollower = await UserTestHandler.addUser({
      email: 'oulean.followerSS@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    var res = await request(app)
      .post('/artworks/' + user.projects[0].artworks[0].id + '/like')
      .set('Authorization', 'bearer ' + uFollower.token)

    expect(res.status).toBe(200)

    var uFollowerSelf = await UserTestHandler.self(uFollower.token)

    expect(uFollowerSelf.likes.length).toBe(1)

    res = await request(app)
      .delete('/artworks/' + user.projects[0].artworks[0].id)
      .set('Authorization', 'bearer ' + u.token)

    res = await UserTestHandler.self(u.token)
    expect(res.projects[0].artworks.length).toBe(0)

    uFollowerSelf = await UserTestHandler.self(uFollower.token)
    expect(uFollowerSelf.likes.length).toBe(0)
  })

  it('should delete project and delete likes and artworks', async () => {
    const u = await UserTestHandler.addUser({
      email: 'test171@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
      projects: [
        {
          title: 'test',
          artworks: [
            {
              title: 'artwork#1',
            },
          ],
        },
      ],
    })

    const user = await UserTestHandler.self(u.token)
    const artwork = user.projects[0].artworks[0]

    const uFollower = await UserTestHandler.addUser({
      email: 'test172@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    let res = await request(app)
      .post('/artworks/' + user.projects[0].artworks[0].id + '/like')
      .set('Authorization', 'bearer ' + uFollower.token)

    expect(res.status).toBe(200)

    let uFollowerSelf = await UserTestHandler.self(uFollower.token)

    expect(uFollowerSelf.likes.length).toBe(1)

    // test part
    res = await request(app)
      .delete('/projects/' + user.projects[0].id)
      .set('Authorization', 'bearer ' + u.token)

    //on vérifie que l'artwork aggrégé par le projet n'existe plus
    res = await request(app).get('/artworks/' + artwork.id)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')

    //on vérifie que l'utilisateur ne suit plus l'artwork
    uFollowerSelf = await UserTestHandler.self(uFollower.token)
    expect(uFollowerSelf.likes.length).toBe(0)
  })
})
