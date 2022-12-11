const request = require('supertest')
import { app } from '../index'
import { UserTestHandler } from '../../tests/userTestHandler'
import {
  apiCreateUser,
  apiSelf,
  apiUpdateUserPosition,
  expectDefaultPositionIsDefined,
} from '../../tests/helpers/api.helpers'
import { clearDatabase } from '../../tests/helpers/clearDatabase.helper'

describe('Users Routes Test', () => {
  // let userReference

  const createUserReference = () =>
    UserTestHandler.addUser({
      email: 'Jean@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
      longitude: 80,
      latitude: 80,
      medium: 'STAMP',
    })

  const getUserReferenceId = async token => {
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

      expect(self.positionLatitude).toBe(10)
      expect(self.positionLongitude).toBe(20)
      expect(self.position?.latitude).toBe(10)
      expect(self.position?.longitude).toBe(20)
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
  })

  describe('Update', () => {
    it('should set the geoReferenced on', async () => {
      const userReference = await createUserReference()

      let res = await request(app)
        .get('/users/self')
        .set('Authorization', 'bearer ' + userReference.token)
      expect(res.body).toMatchObject({
        geoReferenced: false,
        gallery: {
          latitude: 80,
          longitude: 80,
        },
      })

      const userRef = res.body

      // test if we find the profile who'snt referenced
      res = await request(app).get(
        '/users/gallery?longMin=60&longMax=100&lagMin=60&lagMax=100'
      )
      res = res.body
      let usersFinded = res.find(user => user.id == userRef.id)
      expect(usersFinded).toBe(undefined)

      res = await request(app)
        .put('/users/')
        .set('Authorization', 'bearer ' + userReference.token)
        .send({
          geoReferenced: true,
        })

      expect(res.body).toMatchObject({
        geoReferenced: true,
      })

      // test search

      res = await request(app).get(
        '/users/gallery?longMin=60&longMax=100&lagMin=60&lagMax=100'
      )
      usersFinded = res.body.find(user => user.id == userRef.id)
      expect(usersFinded).toMatchObject({
        id: userRef.id,
        geoReferenced: true,
        gallery: {
          latitude: 80,
          longitude: 80,
        },
      })
    })

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

    describe('update default location', () => {
      it('should update default location of user', async () => {
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

    it('should find gallery according to medium', async () => {
      const userMedium = await UserTestHandler.addUser({
        email: 'Jean@journaux.com',
        firstname: 'jean',
        lastname: 'dumont',
        longitude: 80,
        latitude: 80,
        medium: 'STAMP',
        geoReferenced: true,
      })

      let res = await request(app)
        .get('/users/self')
        .set('Authorization', 'bearer ' + userMedium.token)

      expect(res.body).toMatchObject({
        geoReferenced: true,
        medium: 'STAMP',
        gallery: {
          latitude: 80,
          longitude: 80,
        },
      })

      const userId = res.body.id

      res = await request(app).get('/users/gallery?medium=STAMP')
      console.log('MEDIUM : ', res.body)
      let usersFound = res.body.find(user => user.id == userId)
      expect(usersFound).toMatchObject({
        medium: 'STAMP',
      })

      res = await request(app).get('/users/gallery?medium=STAMP,SCULPTURE')
      const usersFindedMultipleFilter = res.body.find(user => user.id == userId)
      expect(usersFindedMultipleFilter).toMatchObject({
        medium: 'STAMP',
      })

      res = await request(app).get('/users/gallery?medium=')
      usersFound = res.body.find(user => user.id == userId)
      expect(usersFindedMultipleFilter).toMatchObject({
        medium: 'STAMP',
      })

      res = await request(app).get('/users/gallery?medium=SCULPTURE')
      console.log('MEDIUM : ', res.body)
      usersFound = res.body.find(user => user.id == userId)
      expect(usersFound).toBe(undefined)

      res = await request(app).get('/users/gallery?medium=mlkjlmkj')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
      console.log('BAD QUERY MEDIUM', res.body)
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
    it('should delete an account', async () => {
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

  it('should success when login with the same adresse with upper case', async () => {
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

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })
})
