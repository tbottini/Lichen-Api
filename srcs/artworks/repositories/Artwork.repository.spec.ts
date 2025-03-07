require('dotenv').config({ path: '.env.test' })

import { Artwork, ArtworkLikes, Project, User } from '@prisma/client'
import { prisma } from '../../commons/prisma/prisma'
import {
  createProject,
  configureArtworkCreation,
  CreateArworkFunction,
} from '../../swipe/Artwork.fixture'
import { ArtworkRepository } from './Artwork.repository'
import { CircularZone } from '../../attr/CircularZone'
import {
  createUser,
  setCityReferenceForUser,
} from '../../../tests/fixture/user.fixture'
import { createLikeArtwork } from '../../../tests/fixture/like.fixture'
import { clearDatabase } from '../../../tests/helpers/clearDatabase.helper'
import { Position } from '../../commons/class/Position.class'

describe('Artwork Repository and ArtworkFeedQuery', () => {
  beforeAll(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await clearDatabase()
  })

  describe('Artwork feed', () => {
    let artworkRepository: ArtworkRepository

    let createArtworkForClient: (title: string) => Promise<Artwork>
    let user: User
    let project: Project

    let createArtworkForAnotherArtist: CreateArworkFunction
    let otherUser: User
    let otherProject: Project

    let likeArtwork: (artworkId: number) => Promise<ArtworkLikes>

    beforeAll(async () => {
      user = await createUser({
        firstname: 'u1',
      })
      project = await createProject({
        title: 'projectTitle',
        authorId: user.id,
      })
      createArtworkForClient = configureArtworkCreation(project.id)

      otherUser = await createUser({
        firstname: 'u2',
        email: 'test@gmail.com',
      })
      otherProject = await createProject({
        title: 'projectTitle',
        authorId: otherUser.id,
      })
      createArtworkForAnotherArtist = configureArtworkCreation(otherProject.id)

      artworkRepository = new ArtworkRepository()
    })

    afterEach(async () => {
      await prisma.artwork.deleteMany({})
    })

    it('should returns artwork of an other artist', async () => {
      await createArtworkForAnotherArtist('title-1')
      await createArtworkForAnotherArtist('title-2')

      const artworks = await artworkRepository.getArtworkFeed({
        userId: user.id,
        zoneFilter: undefined,
      })

      expect(artworks).toHaveLength(2)
      const checkedArtwork = artworks.find(a => a.title == 'title-1')
      expect(checkedArtwork).toMatchObject({
        id: expect.anything(),
        title: 'title-1',
        description: null,
        projectTitle: 'projectTitle',
        index: expect.anything(),
        projectId: otherProject.id,
        medium: null,
        width: null,
        length: null,
        height: null,
      })
    })

    it('should not return artwork already liked', async () => {
      const artwork1 = await createArtworkForAnotherArtist('title-1')
      const artwork2 = await createArtworkForAnotherArtist('title-2')

      likeArtwork = (artworkId: number) =>
        createLikeArtwork({
          artworkLiked: artworkId,
          likeBy: user.id,
        })
      await likeArtwork(artwork1.id)
      await likeArtwork(artwork2.id)

      const artworks = await artworkRepository.getArtworkFeed({
        userId: user.id,
        zoneFilter: undefined,
      })
      expect(artworks).toHaveLength(0)
    })

    it('should not return clients artworks', async () => {
      await createArtworkForClient('title-1')
      await createArtworkForClient('title-2')

      const artworks = await artworkRepository.getArtworkFeed({
        userId: user.id,
        zoneFilter: undefined,
      })
      expect(artworks).toHaveLength(0)
    })

    it("shouldn't returns artwork of an artist if he doesn't defined his position and we search feed in a zone", async () => {
      await createArtworkForAnotherArtist('title-1')
      await createArtworkForAnotherArtist('title-2')

      const artworks = await artworkRepository.getArtworkFeed({
        zoneFilter: new CircularZone(20, 10, 100),
        userId: user.id,
      })

      expect(artworks).toHaveLength(0)
    })

    it('should returns artwork by artist position', async () => {
      await createArtworkForAnotherArtist('title-1')
      await createArtworkForAnotherArtist('title-2')
      await setCityReferenceForUser(otherUser.id, new Position(20, 10))

      const artworks = await artworkRepository.getArtworkFeed({
        zoneFilter: new CircularZone(20, 10, 100),
        userId: user.id,
      })

      expect(artworks).toHaveLength(2)
    })

    it('should return artworks for a specific medium', async () => {
      await createArtworkForAnotherArtist('title-1', {
        medium: 'DRAWING',
      })
      await createArtworkForAnotherArtist('title-2', {
        medium: 'INSTALLATION',
      })
      await createArtworkForAnotherArtist('title-2', {
        medium: 'EDITING',
      })

      const artworks = await artworkRepository.getArtworkFeed({
        zoneFilter: undefined,
        userId: user.id,
        medium: ['DRAWING', 'INSTALLATION'],
      })

      expect(artworks).toHaveLength(2)
    })
  })
})
