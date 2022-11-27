import { PrismaClient } from '@prisma/client'
import { ArtworkUnitFeed } from '../../swipe/Swipe.service'
import { Position } from '../../commons/class/Position.class'
import { ZoneAttribute } from '../../attr/zone'
import { MediumValues } from '../../medium/mediumEnum'
import { RepositoryZoneFilter } from '../../swipe/repositories/RepositoryZoneFilter.class'
import { GetNewsForUser } from '../../news/News.service'
const prisma = new PrismaClient()

export class ArtworkRepository {
  public async getArtworkFeed(feedOptions: ArtworkFeedOptions) {
    const sql = this.feedSql(feedOptions)

    const artworks = await prisma.$queryRawUnsafe<ArtworkUnitFeed[]>(sql)

    if (feedOptions.zoneFilter) {
      const circularZoneFilter = new RepositoryZoneFilter(
        feedOptions.zoneFilter.longitude,
        feedOptions.zoneFilter.latitude,
        feedOptions.zoneFilter.radius
      )

      return artworks.filter((artwork: ArtworkUnitFeed) => {
        if (!artwork.latitude || !artwork.longitude) {
          return false
        }
        return circularZoneFilter.pointIsInZone(
          new Position(artwork.latitude, artwork.longitude)
        )
      })
    }
    return artworks
  }

  private feedSql(feedOptions: ArtworkFeedOptions) {
    let select =
      'select artwork.*, project.title as "projectTitle", users.firstname, users.lastname, users.id as author'
    let from = `
    from
      "Artwork" as artwork
    inner join
      "Project" as project
    on
      artwork."projectId" = project.id
    inner join
      "User" as users
    on
      users.id = project."authorId"
    `
    let where = `
    where users.id != ${feedOptions.userId}
      and artwork.id not in (${this.getArtworkAlreadyLikedSql(
        feedOptions.userId
      )})
    `

    if (feedOptions.zoneFilter) {
      select += ', gallery.longitude, gallery.latitude '
      from += `
      inner join
          "Gallery" as gallery
      on
          gallery."userId" = users.id
      `

      const squareZoneBounded = new RepositoryZoneFilter(
        feedOptions.zoneFilter.longitude,
        feedOptions.zoneFilter.latitude,
        feedOptions.zoneFilter.radius
      ).zone
      if (!squareZoneBounded) {
        throw new Error('Generated zone filter for Prisma is undefined')
      }

      where += `
      and gallery.latitude >= ${squareZoneBounded.minLatitude}
      and gallery.latitude <= ${squareZoneBounded.maxLatitude}
      and gallery.longitude >= ${squareZoneBounded.minLongitude}
      and gallery.longitude <= ${squareZoneBounded.maxLongitude}
      `
    }

    if (feedOptions.medium != null && feedOptions.medium.length > 0) {
      where += `
        and artwork.medium in (${feedOptions.medium
          .map(m => `'${m}'`)
          .join(', ')})
      `
    }

    return `${select} ${from} ${where} order by random() limit 100`
  }

  private getArtworkAlreadyLikedSql(idUser: number) {
    return `select
              artwork.id
          from 
              "Artwork" as artwork 
          inner join "ArtworkLikes" as artwork_likes on artwork.id = artwork_likes."artworkId" 
          inner join "User" as u on u.id = artwork_likes."userId" 
          where 
              u.id = ${idUser}`
  }

  public getArtworksWithProjects(dto: GetNewsForUser) {
    return prisma.artwork.findMany({
      where: {
        insertion: {
          gte: dto.period.begin,
          lte: dto.period.end,
        },
        project: {
          author: {
            followed: {
              some: {
                userFollowingId: dto.userId,
              },
            },
            gallery:
              dto.zone == undefined ? undefined : dto.zone!.getZoneFilter(),
          },
        },
      },
      include: {
        project: {
          include: {
            author: {
              include: {
                gallery: true,
              },
            },
            artworks: true,
          },
        },
      },
    })
  }
}

interface ArtworkFeedOptions {
  zoneFilter: ZoneAttribute | undefined
  userId: number
  medium?: MediumValues[]
}
