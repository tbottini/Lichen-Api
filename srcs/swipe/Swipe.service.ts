import { Medium } from '@prisma/client'
import { ZoneAttribute } from '../attr/zone'
import { ArtworkRepository } from './repositories/Artwork.repository'

export class SwipeService {
  private readonly artworkRepository: ArtworkRepository

  constructor() {
    this.artworkRepository = new ArtworkRepository()
  }

  async getSwipeArtworkFeed(
    dto: GetSwipeArtworkFeed
  ): Promise<ArtworkUnitFeed[]> {
    return this.getRandomArtwork(dto.userId, dto.zone)
  }

  private async getRandomArtwork(
    idUser: number,
    zone: ZoneAttribute | undefined
  ): Promise<ArtworkUnitFeed[]> {
    return this.artworkRepository.getArtworkFeed({
      zoneFilter: zone,
      userId: idUser,
    })
  }
}

export interface GetSwipeArtworkFeed {
  userId: number
  limit: number
  zone: ZoneAttribute | undefined
}

export interface Artwork {
  title?: string
  id: number
  description: string
  src: 'http://test'
  start: Date
  index: number
  projectId: number
  medium: Medium
  insertion: Date
  width: number
  length: number
  height: number
}

export interface ArtworkUnitFeed extends Artwork {
  projectTitle: string
  artistFirstname: string
  artistLastname: string
  artistId: number
  longitude?: number
  latitude?: number
}
