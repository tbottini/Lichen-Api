const request = require('supertest')
const app = require('../srcs/index')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class UserTestHandler {
  static async addUser({
    email,
    firstname,
    lastname,
    password,
    projects,
    latitude,
    longitude,
    events,
    medium,
    geoReferenced,
  }) {
    const DEFAULT_PASSWORD = 'PasswordTest1234@,'

    var dataRequest = {
      email,
      firstname,
      lastname,
      password: DEFAULT_PASSWORD,
      medium,
    }

    var res = await request(app).post('/users/register').send(dataRequest)

    console.log(res.body)

    res = await request(app).post('/users/login').send({
      email: email,
      password: DEFAULT_PASSWORD,
    })
    console.log(res.body)

    expect(res.body).toHaveProperty('token')
    var token = res.body.token
    console.log(token)

    console.log(longitude, latitude)
    if (longitude && latitude) {
      var gallery = await this.updateGallery(token, { longitude, latitude })
      dataRequest = {
        ...dataRequest,
        ...gallery,
      }
      console.log('POSITION', res.body)
    }

    var user = {
      token: token,
      ...dataRequest,
    }

    user.projects = []

    if (projects && !Array.isArray(projects))
      throw 'UserTestHandler Projects attribute must be n array'
    for (var i = 0; projects && i < projects.length; i++) {
      var project = await this.createProject(token, projects[i])
      user.projects.push(project)
    }

    if (events != null && Array.isArray(events)) {
      user.events = await this.createListEvent(token, events)
    }

    if (geoReferenced == true) {
      await request(app)
        .put('/users/')
        .set('Authorization', 'bearer ' + token)
        .send({
          geoReferenced: true,
        })
      user.geoReferenced = true
    }

    return user
  }

  static async updateUser(token, { firstname, lastname, style, medium }) {
    var res = await request(app)
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
    var res = await request(app)
      .put('/users/self/gallery')
      .send({ longitude, latitude })
      .set('Authorization', 'bearer ' + token)

    console.log('GALLERY', res.body.gallery)

    return {
      latitude: res.body.gallery.latitude,
      longitude: res.body.gallery.longitude,
    }
  }

  static async self(token) {
    var r = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + token)

    console.log(r.body)
    return r.body
  }

  static async createProject(token, { title, artworks }) {
    const projectResult = await request(app)
      .post('/projects')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + token)
      .field('title', title || 'null')

    console.log('TOKEN PROJECT', projectResult.body)

    const project = projectResult.body
    project.artworks = []
    console.log(title, artworks)

    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i]
      const result = await request(app)
        .post('/projects/' + project.id + '/artworks')
        .attach('file', './tests/img_test.jpg')
        .set('Authorization', 'bearer ' + token)
        .field('title', artwork.title || 'null')
        .field('medium', artwork.medium || 'null')

      console.log('ARTWORK NEW', result.body)

      project.artworks.push(result.body)
    }
    return project
  }

  static async createUserList(listData) {
    // var users = await Promise.all(listData.map(async (data) => await this.addUser(data)));

    let u
    const uArray = []

    for (let i = 0; i < listData.length; i++) {
      console.log('DATA####')
      u = await this.addUser(listData[i])
      console.log(u)
      uArray.push(u)
    }
    return uArray
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

  static async clearDatabase() {
    await prisma.artwork.deleteMany()
    await prisma.project.deleteMany()
    await prisma.event.deleteMany()
    await prisma.artworkLikes.deleteMany()
    await prisma.eventFollow.deleteMany()
    await prisma.gallery.deleteMany()
    await prisma.userFollow.deleteMany()
    await prisma.user.deleteMany()
  }
}

module.exports = {
  UserTestHandler,
}
