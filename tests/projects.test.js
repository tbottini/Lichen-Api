const { UserTestHandler } = require('./userTestHandler')
const request = require('supertest')
const app = require('../srcs/index')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

describe('Projects Routes Test', () => {
  ref = {}

  beforeAll(async () => {
    await UserTestHandler.clearDatabase()
    ref.user = await UserTestHandler.addUser({
      email: 'project@journaux.com',
      firstname: 'jean',
      lastname: 'dumont',
    })

    console.log('USER', ref.user)
  })

  it('should create an project', async () => {
    var project = await request(app)
      .post('/projects')
      .attach('file', './tests/img_test.jpg')
      .set('Authorization', 'bearer ' + ref.user.token)
      .field('title', 'title')
      .field('medium', 'SCULPTURE')
      .field('yearStart', 2000)
      .field('yearEnd', '2002')

    project = project.body

    expect(project).toMatchObject({
      title: 'title',
      medium: 'SCULPTURE',
      yearStart: 2000,
      yearEnd: 2002,
    })
    expect(project).toHaveProperty('src')

    ref.project = project
  })

  it('should modify a project', async () => {
    var project = await request(app)
      .put('/projects/' + ref.project.id.toString())
      .set('Authorization', 'bearer ' + ref.user.token)
      .send({
        title: 'title_new',
        medium: 'STAMP',
        yearStart: 2010,
        yearEnd: '2012',
      })

    project = project.body

    expect(project).toMatchObject({
      title: 'title_new',
      medium: 'STAMP',
      yearStart: 2010,
      yearEnd: 2012,
    })
  })

  it('should reset attribute to null', async () => {
    var project = await request(app)
      .put('/projects/' + ref.project.id.toString())
      .set('Authorization', 'bearer ' + ref.user.token)
      .send({
        yearStart: null,
        yearEnd: null,
      })

    project = project.body

    expect(project).toMatchObject({
      yearStart: null,
      yearEnd: null,
    })
  })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })
})
