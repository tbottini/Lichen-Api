import { Artwork, Project } from '@prisma/client'
import {
  apiCreateArtwork,
  apiCreateProject,
  apiCreateUser,
  apiRetrieveTasks,
  apiUpdateUserPosition,
} from '../../tests/helpers/api.helpers'

import { UserTestHandler } from '../../tests/userTestHandler'
const request = require('supertest')
import { app } from '../index'

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

  describe('Create', () => {
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
  })

  describe('Retrieve', () => {
    it('should retrieve task by artist position', async () => {
      const token = await apiCreateUser()
      const project = await apiCreateProject(token)
      const artwork = await apiCreateArtwork(token, project.id)
      await apiUpdateUserPosition(token, {
        longitude: '20',
        latitude: '20',
      })

      // const newUserToken = await apiCreateUser()
      // const newProject = await apiCreateProject(newUserToken)
      // await apiCreateArtwork(newUserToken, newProject.id)

      const artworksFound = await apiRetrieveTasks({
        longitude: 20,
        latitude: 20,
        radius: 10,
      })

      expect(artworksFound).toHaveLength(1)
      expect(artworksFound[0].id).toEqual(artwork.id)
    })
  })

  describe('Medium', () => {
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
  })

  describe('Dimention', () => {
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
      const res = await request(app)
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
  })

  describe('Artworks Follow', () => {
    it('should follow an artwork', async () => {
      const follow = await request(app)
        .post('/artworks/' + ref.artwork?.id.toString() + '/like')
        .set('Authorization', 'bearer ' + user.token)

      expect(follow.status).toBe(200)

      const self = await request(app)
        .get('/users/self')
        .set('Authorization', 'bearer ' + user.token)

      expect(self.body.likes.length).toBe(1)
    })

    it('should unfollow an artwork', async () => {
      const unfollow = await request(app)
        .delete('/artworks/' + ref.artwork?.id.toString() + '/like')
        .set('Authorization', 'bearer ' + user.token)

      expect(unfollow.body).toMatchObject({
        count: 1,
      })

      const self = await request(app)
        .get('/users/self')
        .set('Authorization', 'bearer ' + user.token)

      expect(self.body.likes.length).toBe(0)
    })

    it("should follow an artwork and them check that the artwork isn't followed after is deletion", async () => {
      const followedUserToken = await UserTestHandler.addUser({
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

      const user = await UserTestHandler.self(followedUserToken.token)

      const followerToken = await UserTestHandler.addUser({
        email: 'oulean.followerSS@journaux.com',
        firstname: 'jean',
        lastname: 'dumont',
      })

      const followerTokenRes = await request(app)
        .post('/artworks/' + user.projects[0].artworks[0].id + '/like')
        .set('Authorization', 'bearer ' + followerToken.token)

      expect(followerTokenRes.status).toBe(200)

      const follower = await UserTestHandler.self(followerToken.token)

      expect(follower.likes.length).toBe(1)

      await request(app)
        .delete('/artworks/' + user.projects[0].artworks[0].id)
        .set('Authorization', 'bearer ' + followedUserToken.token)

      const followedUser = await UserTestHandler.self(followedUserToken.token)
      expect(followedUser.projects[0].artworks.length).toBe(0)

      const updatedFollower = await UserTestHandler.self(followerToken.token)
      expect(updatedFollower.likes.length).toBe(0)
    })
  })

  describe('Project and follows', () => {
    it('should delete project and delete likes and artworks', async () => {
      const userToken = await UserTestHandler.addUser({
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

      const user = await UserTestHandler.self(userToken.token)
      const artwork = user.projects[0].artworks[0]

      const followerToken = await UserTestHandler.addUser({
        email: 'test172@journaux.com',
        firstname: 'jean',
        lastname: 'dumont',
      })

      let postLikeRes = await request(app)
        .post('/artworks/' + user.projects[0].artworks[0].id + '/like')
        .set('Authorization', 'bearer ' + followerToken.token)

      expect(postLikeRes.status).toBe(200)

      let followerProfile = await UserTestHandler.self(followerToken.token)

      expect(followerProfile.likes.length).toBe(1)

      // test part
      postLikeRes = await request(app)
        .delete('/projects/' + user.projects[0].id)
        .set('Authorization', 'bearer ' + userToken.token)

      //on vérifie que l'artwork aggrégé par le projet n'existe plus
      postLikeRes = await request(app).get('/artworks/' + artwork.id)
      expect(postLikeRes.status).toBe(404)
      expect(postLikeRes.body).toHaveProperty('error')

      //on vérifie que l'utilisateur ne suit plus l'artwork
      followerProfile = await UserTestHandler.self(followerToken.token)
      expect(followerProfile.likes.length).toBe(0)
    })
  })
})
