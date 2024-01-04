import { createArtwork } from '../../tests/fixture/artwork.fixture'
import { createUser } from '../../tests/fixture/user.fixture'
import { clearDatabase } from '../../tests/helpers/clearDatabase.helper'
import { Artwork } from '../interfaces/Artwork.type'
import { createProject } from './Artwork.fixture'
import { SwipeService } from './Swipe.service'
import { User } from '@prisma/client'

describe('SwipeService', () => {
  let swipeService: SwipeService

  let oeuvreUtilisateur: Artwork
  let oeuvreAutre: Artwork
  let utilisateur: User

  beforeAll(async () => {
    await clearDatabase()
    swipeService = new SwipeService()

    utilisateur = await createUser({})
    const project = await createProject({
      title: 'project1',
      authorId: utilisateur.id,
    })
    oeuvreUtilisateur = await createArtwork({
      title: 'artwork1',
      projectId: project.id,
      src: '...',
    })

    const autre = await createUser({})
    const project2 = await createProject({
      title: 'project2',
      authorId: autre.id,
    })
    oeuvreAutre = await createArtwork({
      title: 'artwork2',
      projectId: project2.id,
      src: '...',
    })
  })

  test("ça doit renvoyer toutes les oeuvres si aucun userId n'est passé", async () => {
    const feed = await swipeService.getSwipeArtworkFeed({
      userId: undefined,
      limit: 10,
      zone: undefined,
      medium: undefined,
    })

    expect(feed).toHaveLength(2)
  })

  test("ça ne doit pas renvoyer les oeuvres de l'utilisateur", async () => {
    const feed = await swipeService.getSwipeArtworkFeed({
      userId: utilisateur.id,
      limit: 10,
      zone: undefined,
      medium: undefined,
    })

    expect(feed).toHaveLength(1)
    expect(feed[0].id).not.toBe(oeuvreUtilisateur.id)
  })
})
