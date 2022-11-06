const { UserTestHandler } = require('./userTestHandler')
const request = require('supertest')
const app = require('../srcs/index')

describe('Artworks Routes Test', () => {
  user = null

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

  var ref = {
    project: undefined,
    artwork: undefined,
  }

  it('should create an artwork', async () => {
    var u = await UserTestHandler.addUser({
      email: 'oulean@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    console.log('USER', u)

    var project = await request(app)
      .post('/projects')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + u.token)
      .field('title', 'title')
    project = project.body

    console.log('Project', project)

    var artwork = await request(app)
      .post('/projects/' + project.id + '/artworks')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + u.token)
      .field('title', 'title')
      .field('height', 200)
    artwork = artwork.body

    expect(artwork).toMatchObject({
      height: 200,
      title: 'title',
    })
  })

  it('should modify an artwork (medium)', async () => {
    var project = await UserTestHandler.createProject(user.token, {
      title: 'casimodo',
      artworks: [{ title: 'artwork1', medium: 'PAINTING' }],
    })

    const artwork = project.artworks[0]
    expect(artwork).toMatchObject({
      title: 'artwork1',
      medium: 'PAINTING',
    })

    res = await request(app)
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
    var res = await request(app)
      .put('/artworks/' + ref.artwork.id)
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
      .put('/artworks/' + ref.artwork.id)
      .set('Authorization', 'bearer ' + user.token)
      .field('length', 'null')
      .field('height', 'null')
    console.log(res.body)

    expect(res.body).toMatchObject({
      height: null,
      width: 20,
      length: null,
    })
    expect(res.status).toBe(200)
  })

  it('should follow an artwork', async () => {
    var follow = await request(app)
      .post('/artworks/' + ref.artwork.id.toString() + '/like')
      .set('Authorization', 'bearer ' + user.token)

    expect(follow.status).toBe(200)
    console.log('Artwork FOLLOW')

    var self = await request(app)
      .get('/users/self')
      .set('Authorization', 'bearer ' + user.token)

    expect(self.body.likes.length).toBe(1)
  })

  it('should unfollow an artwork', async () => {
    var unfollow = await request(app)
      .delete('/artworks/' + ref.artwork.id.toString() + '/like')
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

    console.log('TOKEN', u)

    var user = await UserTestHandler.self(u.token)

    console.log('USER', user)

    var uFollower = await UserTestHandler.addUser({
      email: 'oulean.followerSS@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    console.log('USER2', uFollower)

    var res = await request(app)
      .post('/artworks/' + user.projects[0].artworks[0].id + '/like')
      .set('Authorization', 'bearer ' + uFollower.token)

    expect(res.status).toBe(200)

    console.log('LIKED', res.body)

    var uFollowerSelf = await UserTestHandler.self(uFollower.token)

    console.log('LIKE', uFollowerSelf)
    expect(uFollowerSelf.likes.length).toBe(1)

    res = await request(app)
      .delete('/artworks/' + user.projects[0].artworks[0].id)
      .set('Authorization', 'bearer ' + u.token)

    console.log('DELETE', res.body)

    res = await UserTestHandler.self(u.token)
    console.log('ARTWORK USER', res)
    expect(res.projects[0].artworks.length).toBe(0)

    uFollowerSelf = await UserTestHandler.self(uFollower.token)
    expect(uFollowerSelf.likes.length).toBe(0)
  })

  it('should delete project and delete likes and artworks', async () => {
    var u = await UserTestHandler.addUser({
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

    console.log('TOKEN', u)

    var user = await UserTestHandler.self(u.token)
    var artwork = user.projects[0].artworks[0]
    console.log('USER', user)

    var uFollower = await UserTestHandler.addUser({
      email: 'test172@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    console.log('USER2', uFollower)

    var res = await request(app)
      .post('/artworks/' + user.projects[0].artworks[0].id + '/like')
      .set('Authorization', 'bearer ' + uFollower.token)

    expect(res.status).toBe(200)

    console.log('LIKED', res.body)

    var uFollowerSelf = await UserTestHandler.self(uFollower.token)

    console.log('LIKE', uFollowerSelf)
    expect(uFollowerSelf.likes.length).toBe(1)

    // test part
    res = await request(app)
      .delete('/projects/' + user.projects[0].id)
      .set('Authorization', 'bearer ' + u.token)

    console.log('PROJECT DELETE', res.body)

    //on vérifie que l'artwork aggrégé par le projet n'éxiste plus
    res = await request(app).get('/artworks/' + artwork.id)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
    console.log('ARTWORK GETTED', res.body)

    //on vérifie que l'utilisateur ne suit plus l'artwork
    uFollowerSelf = await UserTestHandler.self(uFollower.token)
    expect(uFollowerSelf.likes.length).toBe(0)
  })
})
