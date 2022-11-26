import { ZoneAttribute } from '../attr/zone'
import { ArtworkRepository } from './repositories/Artwork.repository'
import { MediumValues } from '../medium/mediumEnum'
import { Artwork } from '../interfaces/Artwork.type'

export class SwipeService {
  private readonly artworkRepository: ArtworkRepository

  constructor() {
    this.artworkRepository = new ArtworkRepository()
  }

  async getSwipeArtworkFeed(
    dto: GetSwipeArtworkFeed
  ): Promise<ArtworkUnitFeed[]> {
    return this.artworkRepository.getArtworkFeed({
      zoneFilter: dto.zone,
      userId: dto.userId,
    })
  }
}

export interface GetSwipeArtworkFeed {
  userId: number
  limit: number
  zone: ZoneAttribute | undefined
  medium?: MediumValues[]
}

export interface ArtworkUnitFeed extends Artwork {
  projectTitle: string
  artistFirstname: string
  artistLastname: string
  artistId: number
  longitude?: number
  latitude?: number
}
