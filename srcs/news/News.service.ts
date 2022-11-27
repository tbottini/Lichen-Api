import { ZoneAttribute } from '../attr/zone'
import { PrismaClient } from '@prisma/client'
import { ArtworkRepository } from '../artworks/repositories/Artwork.repository'
const prisma = new PrismaClient()

const logger = require('../modules/logger')

const artworkRepository = new ArtworkRepository()

export class NewsService {
  async getNewsForUser(dto: GetNewsForUser): Promise<NewsFeed> {
    const insertionFilter = {
      gte: dto.period.begin,
      lte: dto.period.end,
    }

    const zone = dto.zone

    logger.debug('test')

    const promises: Array<Promise<Array<any>>> = []
    //recherche des derniers artworks posté par les follow
    promises.push(artworkRepository.getArtworksWithProjects(dto))

    promises.push(
      prisma.event.findMany({
        where: {
          insertion: insertionFilter,
          organisator: {
            followed: {
              some: { userFollowingId: dto.userId },
            },
            gallery: zone == undefined ? undefined : zone!.getZoneFilter(),
          },
        },
      })
    )

    promises.push(
      prisma.artworkLikes.findMany({
        where: {
          creation: insertionFilter,
          user: {
            gallery: zone == undefined ? undefined : zone!.getZoneFilter(),

            followed: {
              some: {
                userFollowingId: dto.userId,
              },
            },
          },
        },
      })
    )

    promises.push(this.getEvents(dto))

    const [artworks, events, artworksLike, eventFollow] = await Promise.all(
      promises
    )

    logger.debug(artworks, events)

    return { events, artworks, artworksLike, eventFollow }
  }

  private getEvents(dto: GetNewsForUser) {
    return prisma.eventFollow.findMany({
      where: {
        creation: {
          gte: dto.period.begin,
          lte: dto.period.end,
        },
        user: {
          gallery:
            dto.zone == undefined ? undefined : dto.zone!.getZoneFilter(),
          followed: {
            some: {
              userFollowedId: dto.userId,
            },
          },
        },
      },
    })
  }
}

export interface GetNewsForUser {
  zone: ZoneAttribute
  period: Period
  userId: number
}

interface Period {
  begin: Date
  end: Date
}

interface NewsFeed {
  events
  artworks
  artworksLike
  eventFollow
}
