import { ArtworkUnitFeed } from '../../swipe/Swipe.service'
import { Position } from '../../commons/class/Position.class'
import { CircularZone } from '../../attr/CircularZone'
import { MediumValues } from '../../medium/mediumEnum'
import { RepositoryZoneFilter } from '../../swipe/repositories/RepositoryZoneFilter.class'
import { GetNewsForUser } from '../../news/News.service'
import { prisma } from '../../commons/prisma/prisma'

export class ArtworkRepository {
  public async getArtworkFeed(
    feedOptions: ArtworkFeedOptions
  ): Promise<ArtworkUnitFeed[]> {
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
    const queryBuilder = new QueryBuilder()

    queryBuilder.select(
      'select artwork.*, project.title as "projectTitle", users.firstname, users.lastname, users.id as author'
    )
    const from = `
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

    if (feedOptions.userId) {
      queryBuilder.where(`users.id != ${feedOptions.userId}
      and artwork.id not in (${this.getArtworkAlreadyLikedSql(
        feedOptions.userId
      )})`)
    }

    if (feedOptions.zoneFilter) {
      const positionFilterSql = this.getPositionFilter(feedOptions.zoneFilter)

      queryBuilder.select(positionFilterSql.select)
      queryBuilder.where(positionFilterSql.whereQuery)
    }

    if (feedOptions.medium != null && feedOptions.medium.length > 0) {
      const mediumFilter = this.getFilterByMedium(feedOptions.medium)

      queryBuilder.where(mediumFilter.whereQuery)
    }

    return `${
      queryBuilder.selectQuery
    } ${from} ${queryBuilder.buildWhereSql()} order by random() limit 100`
  }

  private getPositionFilter(zoneFilter: CircularZone): {
    select: string
    whereQuery: string
  } {
    const squareZoneBounded = new RepositoryZoneFilter(
      zoneFilter.longitude,
      zoneFilter.latitude,
      zoneFilter.radius
    ).zone
    if (!squareZoneBounded) {
      throw new Error('Generated zone filter for Prisma is undefined')
    }

    return {
      select:
        ', users."positionLatitude" as latitude, users."positionLongitude" as longitude ',
      whereQuery: `
      users."positionLatitude" >= ${squareZoneBounded.minLatitude}
      and users."positionLatitude" <= ${squareZoneBounded.maxLatitude}
      and users."positionLongitude" >= ${squareZoneBounded.minLongitude}
      and users."positionLongitude" <= ${squareZoneBounded.maxLongitude}
      `,
    }
  }

  private getFilterByMedium(medium: MediumValues[]): { whereQuery: string } {
    return {
      whereQuery: `
      artwork.medium in (${medium.map(m => `'${m}'`).join(', ')})
    `,
    }
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

class QueryBuilder {
  whereQueries: string[] = []
  selectQuery = ''

  where(query: string) {
    this.whereQueries.push(query)
  }

  select(selection: string) {
    this.selectQuery += selection
  }

  buildWhereSql(): string {
    if (!this.whereQueries.length) {
      return ''
    }
    return ` where ${this.whereQueries.join(' and ')} `
  }
}

interface ArtworkFeedOptions {
  zoneFilter: CircularZone | undefined
  userId?: number
  medium?: MediumValues[]
}
