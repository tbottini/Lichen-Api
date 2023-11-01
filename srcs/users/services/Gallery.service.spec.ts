require('../../commons/env')
import { createGalleryForUser } from '../../../tests/fixture/gallery.fixture'
import { createUser } from '../../../tests/fixture/user.fixture'
import { clearDatabase } from '../../../tests/helpers/clearDatabase.helper'
import { GalleryService } from './Gallery.service'

describe('Gallery service', () => {
  const galleryService = new GalleryService()

  beforeEach(async () => {
    await clearDatabase()

    const user = await createUser({
      pseudo: 'test',
    })
    await createGalleryForUser(user.id, {
      latitude: 10.5,
      longitude: 10.5,
    })
  })

  it('should return user with gallery information', async () => {
    const galleries = await galleryService.getGalleries({
      longitudeMax: 12,
      longitudeMin: 9,
      latitudeMax: 12,
      latitudeMin: 9,
    })

    expect(galleries).toHaveLength(1)
    expect(galleries[0]).toMatchObject({
      gallery: {
        latitude: 10.5,
        longitude: 10.5,
      },
    })
  })

  it('should return gallery even if filter delta is decimal difference', async () => {
    const galleries = await galleryService.getGalleries({
      longitudeMax: 10.9,
      longitudeMin: 10.1,
      latitudeMax: 10.9,
      latitudeMin: 10.1,
    })

    expect(galleries).toHaveLength(1)
    expect(galleries[0]).toMatchObject({
      gallery: {
        latitude: 10.5,
        longitude: 10.5,
      },
    })
  })
})
