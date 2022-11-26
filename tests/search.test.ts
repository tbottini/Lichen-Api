const request = require('supertest')
import { app } from '../srcs'
import { UserTestHandler } from './userTestHandler'

describe('Search', () => {
  let users: any[]

  beforeAll(async () => {
    await UserTestHandler.clearDatabase()

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

    // l'artiste n'est pas géoréférencé
    // todo ajouter un argument dans la fixture pour dire si il est georéférencé ou non

    expect(res.body.map(artwork => artwork.title)).toEqual([
      'artwork#1',
      'artwork#2',
    ])
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
