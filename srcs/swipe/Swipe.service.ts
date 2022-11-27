import { ZoneAttribute } from '../attr/zone'
import { MediumValues } from '../medium/mediumEnum'
import { Artwork } from '../interfaces/Artwork.type'
import { ArtworkRepository } from '../artworks/repositories/Artwork.repository'

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
      medium: dto.medium,
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
