import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const request = require('supertest')
const app = require('../srcs/index')
const { UserTestHandler } = require('./userTestHandler')

class PrismaControllerTest {
  static async deleteAll() {
    var t = ['user', 'artwork', 'gallery', 'event', 'project', 'eventFollow']
    for (const table of t) {
      await prisma[table].deleteMany()
    }
  }
}

describe('Search', () => {
  var users = null

  beforeAll(async () => {
    await UserTestHandler.clearDatabase()
    // tout doit être clear todo

    // await PrismaControllerTest.deleteAll();

    users = await UserTestHandler.createUserList([
      {
        email: 'Jo@joul.com',
        firstname: 'Jo',
        lastname: 'jou',
        latitude: 30,
        longitude: 40,
      },
      {
        email: 'thomas@protonmail.comdfjk',
        firstname: 'thom',
        lastname: 'bo',
        latitude: 31,
        longitude: 32,
        geoReferenced: true,
        projects: [
          {
            title: 'p1',
            artworks: [{ title: 'artwork#1' }, { title: 'artwork#2' }],
          },
        ],
      },
      {
        email: 'zorro@coreador.elm',
        firstname: 'zorro',
        lastname: 'zodor',
        latitude: 50,
        longitude: 50,
      },
      {
        email: 'conston@coreador.elm',
        firstname: 'conston',
        lastname: 'zodor',
        latitude: 30,
        longitude: 32,
        projects: [
          {
            title: 'project zorro #1',
            artworks: [{ title: 'artwork#1' }],
          },
        ],
      },
    ])
  })

  it('should search artworks by location zone', async () => {
    const res = await request(app).get('/artworks').query({
      latitude: 31,
      longitude: 32,
      radius: 100,
    })

    const result = await prisma.artwork.findMany({
      where: {},
      include: {
        project: {
          include: {
            author: {
              include: {
                gallery: true,
              },
            },
          },
        },
      },
    })

    // l'artiste n'est pas géoréférencé
    // todo ajouter un argument dans la fixture pour dire si il est georéférencé ou non
    console.log(
      'RESULT',
      result.map(artwork => artwork.project.author)
    )

    expect(res.body.map(artwork => artwork.title)).toEqual([
      'artwork#1',
      'artwork#2',
    ])

    res.body.forEach(artwork =>
      console.log(
        artwork.title,
        artwork.project.author.firstname,
        artwork.project.author.gallery
      )
    )
  })

  // it("should search by firstname / lastname", async() =>
  // {

  // })

  // it("should search by style / medium", async() =>
  // {

  // })

  // it("should find artwork by location and style", async() =>
  // {

  // })

  // it("should find events by location of organisator", async() =>
  // {

  // })

  // it("should get the news of friends", async() =>
  // {

  // })

  afterAll(async () => {
    await UserTestHandler.clearDatabase()
  })
})
