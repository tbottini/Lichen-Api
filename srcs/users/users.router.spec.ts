jest.mock('./services/AccountMail.service.ts')
const request = require('supertest')
import { app } from '../index'
import { UserTestHandler } from '../../tests/userTestHandler'
import {
  apiCreateUser,
  apiGetUser,
  apiSelf,
  apiUpdateUserPosition,
  expectDefaultPositionIsDefined,
} from '../../tests/helpers/api.helpers'
import { clearDatabase } from '../../tests/helpers/clearDatabase.helper'
import { addUser, apiCreateGallery } from '../../tests/helpers/user.test.helper'

describe('Users Routes Test', () => {
  const createUserReference = () =>
    UserTestHandler.addUser({
      email: 'Jean@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
      longitude: 80,
      latitude: 80,
      medium: 'STAMP',
    })

  const getUserReferenceId = async (token: string) => {
    const userReferenceData = await UserTestHandler.self(token)
    return userReferenceData.id
  }

  beforeAll(async () => {
    await UserTestHandler.clearDatabase()
  })

  afterEach(async () => {
    await clearDatabase()
  })

  describe('Create', () => {
    it('should create an account', async () => {
      const res = await request(app).post('/users/register').send({
        firstname: 'george',
        lastname: 'orwell',
        email: 'george.orwell@bigbrother.com',
        password: 'notEffiscientPassword@1234,',
        websiteUrl: 'test@hotmail.com',
      })

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty('token')
    })

    it('should create an user with an position', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          firstname: 'george',
          lastname: 'orwell',
          email: 'george.orwell@bigbrother.com',
          password: 'notEffiscientPassword@1234,',
          position: {
            latitude: 30,
            longitude: 430,
          },
        })

      expect(res.statusCode).toEqual(200)

      const createdUser = await apiSelf(res.body.token)
      expect(createdUser.position?.latitude).toEqual(30)
      expect(createdUser.position?.longitude).toEqual(430)
    })

    it('should failed with a position defined with bad attribute for longitude or latitude', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          email: 'george.orwell@bigbrother.com',
          password: 'notEffiscientPassword@1234,',
          position: {
            latitude: 'a',
            longitude: 430,
          },
        })

      expect(res.statusCode).toEqual(400)
    })

    //todo set a test for insensitive case email
    it('should failed when register with the same adress with a maj', async () => {
      await UserTestHandler.addUser({
        email: 'dumont@journaux.com',
        firstname: 'jean',
        lastname: 'dumont',
      })

      // we are creating an account with the same adress with maj for throwing a exception
      const userCopy = await request(app).post('/users/register').send({
        email: 'Dumont@journaux.com',
        password: 'notEffiscientPassword@1234,',
      })

      expect(userCopy.body).toHaveProperty('error')
    })

    it('should return an 400 when trying to create an user with both names and pseudo defined', async () => {
      const createUserResponse = await request(app)
        .post('/users/register')
        .send({
          firstname: 'george',
          lastname: 'orwell',
          pseudo: 'a writer',
          email: 'george.orwell@bigbrother.com',
          password: 'notEffiscientPassword@1234,',
          websiteUrl: 'test@hotmail.com',
        })

      console.log(createUserResponse.body)
      expect(createUserResponse.statusCode).toEqual(400)
    })
  })

  describe('Self', () => {
    it('should return position when get self profile', async () => {
      const token = await apiCreateUser({
        email: 'getSelfInfo@protonmail.com',
      })

      await apiUpdateUserPosition(token, {
        longitude: '10',
        latitude: '20',
      })

      const self = await apiSelf(token)

      expect(self.positionLatitude).toBe(20)
      expect(self.positionLongitude).toBe(10)
      expect(self.position?.latitude).toBe(20)
      expect(self.position?.longitude).toBe(10)
    })
  })

  describe('Get', () => {
    it('should return the user', async () => {
      const token = await apiCreateUser({
        email: 'getSelfInfo@protonmail.com',
      })
      const user = await apiSelf(token)

      const getted = await apiGetUser(user.id)

      expect(getted.id).toBeDefined
    })
  })

  describe('Login and Register', () => {
    it('should login to an account', async () => {
      await apiCreateUser({
        firstname: 'george',
        lastname: 'orwell',
        email: 'george.orwell@bigbrother.com',
        medium: 'STAMP',
        password: 'notEffiscientPassword@1234,',
      })

      const res = await request(app).post('/users/login').send({
        email: 'george.orwell@bigbrother.com',
        password: 'notEffiscientPassword@1234,',
      })

      expect(res.body).toHaveProperty('token')

      expect(res.statusCode).toBe(200)
    })

    it('should login with the same adresse with upper case', async () => {
      const userCreated = await UserTestHandler.addUser({
        email: 'petitpoulet@journaux.com',
        firstname: 'jean',
        lastname: 'dumont',
      })

      expect(userCreated.email).toBe('petitpoulet@journaux.com')

      // we are creating an account with the same adress with maj for throwing a exception
      const res = await request(app).post('/users/login').send({
        email: userCreated.email.toUpperCase(),
        password: userCreated.password,
      })

      expect(res.body).toHaveProperty('token')
      expect(res.statusCode).toBe(200)
      expect(res.body).not.toHaveProperty('error')
    })
  })

  describe('Update', () => {
    it('should update the medium of user', async () => {
      const userReference = await createUserReference()

      const res = await request(app)
        .put('/users/')
        .set('Authorization', 'bearer ' + userReference.token)
        .send({
          medium: 'SCULPTURE',
        })

      expect(res.body).toMatchObject({
        firstname: 'jean',
        lastname: 'dumont',
        medium: 'SCULPTURE',
      })
      expect(res.statusCode).toBe(200)
    })

    // it('should update user data without remove profile image', async () => {
    //   const token = await apiCreateUser({
    //     firstname: 'george',
    //     lastname: 'orwell',
    //     email: 'george.orwell@bigbrother.com',
    //     medium: 'STAMP',
    //   })

    //   await request(app)
    //     .put('/users/')
    //     .attach('file', './tests/img_test.jpg')
    //     .set('Authorization', 'bearer ' + token)

    //   const user = await apiSelf(token)
    //   console.log(user.src)
    //   expect(user.src).toBeDefined()
    //   const userProfilePicture = user.src

    //   await request(app)
    //     .put('/users/')
    //     .set('Authorization', 'bearer ' + token)
    //     .field('firstname', 'Thomas')

    //   const updatedUser = await apiSelf(token)
    //   expect(updatedUser.src).toEqual(userProfilePicture)
    //   expect(updatedUser.firstname).toEqual('Thomas')
    // })

    describe('update user position', () => {
      it('should update location of user', async () => {
        const token = await apiCreateUser({
          firstname: 'george',
          lastname: 'orwell',
          email: 'george.orwell@bigbrother.com',
          medium: 'STAMP',
        })

        const updated = await apiUpdateUserPosition(token, {
          longitude: '10',
          latitude: '10',
        })

        console.log(updated)

        expectDefaultPositionIsDefined(updated)
      })

      it('should update default location of user and self route should return defaultPosition', async () => {
        const token = await apiCreateUser({
          firstname: 'george',
          lastname: 'orwell',
          email: 'george.orwell2@bigbrother.com',
          medium: 'STAMP',
        })

        await apiUpdateUserPosition(token, {
          longitude: '10',
          latitude: '10',
        })

        const self = await apiSelf(token)

        expectDefaultPositionIsDefined(self)
      })
    })
  })

  describe('Gallery', () => {
    beforeEach(async () => {
      await clearDatabase()
    })

    const findGallery = (medium: string) => {
      return request(app).get('/users/gallery?medium=' + medium)
    }

    it('should find gallery according to medium', async () => {
      const userMedium = await apiCreateGallery({
        email: 'Jean@journaux.com',
        pseudo: 'test',

        longitude: 80,
        latitude: 80,
        medium: 'STAMP',
      })

      const gallery = await apiSelf(userMedium.token)
      expect(gallery).toMatchObject({
        medium: 'STAMP',
        gallery: {
          latitude: 80,
          longitude: 80,
        },
      })

      const foundStampGalleries = await findGallery('STAMP')
      const foundStampGallery = foundStampGalleries.body.find(
        gallery => gallery.id == gallery.id
      )
      expect(foundStampGallery).toBeDefined()
      expect(foundStampGallery).toMatchObject({
        medium: 'STAMP',
      })

      const foundStampOrSculptureGalleries = await findGallery(
        'STAMP,SCULPTURE'
      )
      const foundInStampOrSculptureGalleries =
        foundStampOrSculptureGalleries.body.find(
          gallery => gallery.id == gallery.id
        )
      expect(foundInStampOrSculptureGalleries).toMatchObject({
        medium: 'STAMP',
      })

      const allGalleries = await findGallery('')
      const foundInAllGalleries = allGalleries.body.find(
        gallery => gallery.id == gallery.id
      )
      expect(foundInAllGalleries).toMatchObject({
        medium: 'STAMP',
      })

      const sculptureGalleries = await findGallery('SCULPTURE')
      const foundSculptureGallery = sculptureGalleries.body.find(
        gallery => gallery.id == gallery.id
      )
      expect(foundSculptureGallery).toBe(undefined)

      const unknownMediumGalleries = await findGallery('mlkjlmkj')
      expect(unknownMediumGalleries.status).toBe(400)
      expect(unknownMediumGalleries.body).toHaveProperty('error')
    })

    it("should not find user as gallery if user haven't defined position", async () => {
      await apiCreateUser({
        email: 'test-not-gallery@protonmail.com',
        medium: 'AUDIOVISUAL',
      })

      const res = await findGallery('')
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
    })
  })

  describe('Follow', () => {
    let tokenUser

    beforeEach(async () => {
      tokenUser = await apiCreateUser({
        firstname: 'george',
        lastname: 'orwell',
        email: 'george.orwell@bigbrother.com',
      })
    })

    it('should follow an user', async () => {
      const userReference = await createUserReference()
      const userReferenceId = await getUserReferenceId(userReference.token)

      const follow = await request(app)
        .post('/users/' + userReferenceId + '/follow')
        .set('Authorization', 'bearer ' + tokenUser)

      expect(follow.status).toBe(200)

      const self = await request(app)
        .get('/users/self')
        .set('Authorization', 'bearer ' + tokenUser)

      expect(self.body.following.length).toBe(1)
    })

    it('should unfollow an user', async () => {
      const userReference = await createUserReference()
      const userReferenceId = await getUserReferenceId(userReference.token)

      await request(app)
        .post('/users/' + userReferenceId + '/follow')
        .set('Authorization', 'bearer ' + tokenUser)

      const unfollow = await request(app)
        .delete('/users/' + userReferenceId + '/follow')
        .set('Authorization', 'bearer ' + tokenUser)

      expect(unfollow.body).toMatchObject({
        count: 1,
      })

      const self = await request(app)
        .get('/users/self')
        .set('Authorization', 'bearer ' + tokenUser)

      expect(self.body.following.length).toBe(0)
    })
  })

  describe('Delete', () => {
    it.skip('should delete an account', async () => {
      const tokenUser = await apiCreateUser({
        firstname: 'george',
        lastname: 'orwell',
        email: 'george.orwell@bigbrother.com',
      })

      let userFinded = await request(app)
        .delete('/users/self')
        .set('Authorization', 'bearer ' + tokenUser)
      userFinded = userFinded.body

      expect(userFinded).toMatchObject({
        firstname: 'george',
        lastname: 'orwell',
        email: 'george.orwell@bigbrother.com',
      })

      const res = await request(app).get('/users/' + userFinded.id)

      expect(res.body).toHaveProperty('error')
      expect(res.statusCode).toBe(400)
    })
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })
})
