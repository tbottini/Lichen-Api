require('dotenv').config({ path: '.env.test' })

import {
  Artwork,
  ArtworkLikes,
  PrismaClient,
  Project,
  User,
} from '@prisma/client'
import {
  createProject,
  createUser,
  configureArtworkCreation,
  createGalleryForUser,
  CreateArworkFunction,
} from '../Artwork.fixture'
import { ArtworkRepository } from './Artwork.repository'
import { ZoneAttribute } from '../../attr/zone'
import { createLikeArtwork } from '../Artwork.fixture'
const prisma = new PrismaClient()

describe('Artwork Repository and ArtworkFeedQuery', () => {
  afterEach(async () => {
    await prisma.artwork.deleteMany()
    await prisma.gallery.deleteMany()
    await prisma.artworkLikes.deleteMany()
  })

  afterAll(async () => {
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
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
      user = await createUser()
      project = await createProject({
        title: 'projectTitle',
        authorId: user.id,
      })
      createArtworkForClient = configureArtworkCreation(project.id)

      otherUser = await createUser({
        email: 'test@gmail.com',
      })
      otherProject = await createProject({
        title: 'projectTitle',
        authorId: otherUser.id,
      })
      createArtworkForAnotherArtist = configureArtworkCreation(otherProject.id)

      artworkRepository = new ArtworkRepository()
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

    it('should returns artwork by artist position', async () => {
      await createArtworkForAnotherArtist('title-1')
      await createArtworkForAnotherArtist('title-2')
      await createGalleryForUser(otherUser.id, {
        longitude: 10,
        latitude: 20,
      })

      const artworks = await artworkRepository.getArtworkFeed({
        zoneFilter: new ZoneAttribute(20, 10, 100),
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
