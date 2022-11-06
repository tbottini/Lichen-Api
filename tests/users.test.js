const request = require('supertest')
const app = require('../srcs/index')
const { UserTestHandler } = require('./userTestHandler')

describe('Users Routes Test', () => {
  var user

  beforeAll(async () => {
    await UserTestHandler.clearDatabase()

    user = await UserTestHandler.addUser({
      email: 'Jean@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
      longitude: 80,
      latitude: 80,
      medium: 'STAMP',
    })

    var u = await UserTestHandler.self(user.token)
    console.log('!USER', u)
    user.id = u.id
  })

  var userCreated1

  it('should create an account', async () => {
    const res = await request(app).post('/users/register').send({
      firstname: 'george',
      lastname: 'orwell',
      email: 'george.orwell@bigbrother.com',
      password: 'notEffiscientPassword@1234,',
      websiteUrl: 'test@hotmail.com',
    })

    console.log(res.body)
    userCreated1 = res.body

    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('token')
    token = res.body.token

    console.log(token)

    userCreated1.token = token
  })

  it('should login to an account', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'george.orwell@bigbrother.com',
      password: 'notEffiscientPassword@1234,',
    })

    console.log(res.body)

    expect(res.body).toHaveProperty('token')
    expect(res.statusCode).toBe(200)
  })

  it('should set the geoReferenced on', async () => {
    var res = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + user.token)
    expect(res.body).toMatchObject({
      geoReferenced: false,
      gallery: {
        latitude: 80,
        longitude: 80,
      },
    })

    var userRef = res.body

    // test if we find the profile who'snt referenced
    var res = await request(app).get(
      '/users/gallery?longMin=60&longMax=100&lagMin=60&lagMax=100'
    )
    res = res.body
    var usersFinded = res.find(user => user.id == userRef.id)
    expect(usersFinded).toBe(undefined)

    res = await request(app)
      .put('/users/')
      .set('Authorization', 'bearer ' + user.token)
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

  it('should find gallery according to medium', async () => {
    var userMedium = await UserTestHandler.addUser({
      email: 'Jean@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
      longitude: 80,
      latitude: 80,
      medium: 'STAMP',
      geoReferenced: true,
    })

    var res = await request(app)
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

    var userId = res.body.id

    res = await request(app).get('/users/gallery?medium=STAMP')
    console.log('MEDIUM : ', res.body)
    var usersFinded = res.body.find(user => user.id == userId)
    expect(usersFinded).toMatchObject({
      medium: 'STAMP',
    })

    res = await request(app).get('/users/gallery?medium=STAMP,SCULPTURE')
    var usersFindedMultipleFilter = res.body.find(user => user.id == userId)
    expect(usersFindedMultipleFilter).toMatchObject({
      medium: 'STAMP',
    })

    res = await request(app).get('/users/gallery?medium=')
    usersFinded = res.body.find(user => user.id == userId)
    expect(usersFindedMultipleFilter).toMatchObject({
      medium: 'STAMP',
    })

    res = await request(app).get('/users/gallery?medium=SCULPTURE')
    console.log('MEDIUM : ', res.body)
    usersFinded = res.body.find(user => user.id == userId)
    expect(usersFinded).toBe(undefined)

    res = await request(app).get('/users/gallery?medium=mlkjlmkj')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    console.log('BAD QUERY MEDIUM', res.body)
  })

  it('should follow an user', async () => {
    console.log('SHOULD ', user)

    var follow = await request(app)
      .post('/users/' + user.id.toString() + '/follow')
      .set('Authorization', 'bearer ' + userCreated1.token)

    expect(follow.status).toBe(200)

    var self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + userCreated1.token)

    expect(self.body.following.length).toBe(1)
  })

  it('should unfollow an user', async () => {
    var unfollow = await request(app)
      .delete('/users/' + user.id.toString() + '/follow')
      .set('Authorization', 'bearer ' + userCreated1.token)

    expect(unfollow.body).toMatchObject({
      count: 1,
    })

    var self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + userCreated1.token)

    expect(self.body.following.length).toBe(0)
  })

  it('should delete an account', async () => {
    var userFinded = await request(app)
      .delete('/users/self')
      .set('Authorization', 'bearer ' + userCreated1.token)
    userFinded = userFinded.body

    expect(userFinded).toMatchObject({
      firstname: 'george',
      lastname: 'orwell',
      email: 'george.orwell@bigbrother.com',
      websiteUrl: 'test@hotmail.com',
    })

    var res = await request(app).get('/users/' + userFinded.id)

    expect(res.body).toHaveProperty('error')
    expect(res.statusCode).toBe(400)
  })

  it('should update the medium of user', async () => {
    var res = await request(app)
      .put('/users/')
      .set('Authorization', 'bearer ' + user.token)
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

  //todo set a test for insensitive case email
  it('should failed when register with the same adress with a maj', async () => {
    await UserTestHandler.addUser({
      email: 'dumont@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    // we are creating an account with the same adress with maj for throwing a exception
    var userCopy = await request(app).post('/users/register').send({
      email: 'Dumont@journaux.com',
      password: 'notEffiscientPassword@1234,',
    })

    expect(userCopy.body).toHaveProperty('error')
  })

  it('should success when login with the same adresse with upper case', async () => {
    var userCreated = await UserTestHandler.addUser({
      email: 'petitpoulet@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    expect(userCreated.email).toBe('petitpoulet@journaux.com')

    // we are creating an account with the same adress with maj for throwing a exception
    var res = await request(app).post('/users/login').send({
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
