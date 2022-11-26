import { PrismaClient } from '@prisma/client'
import { ArtworkUnitFeed } from '../Swipe.service'
import { RepositoryZoneFilter } from './RepositoryZoneFilter.class'
import { Position } from '../../commons/class/Position.class'
import { ZoneAttribute } from '../../attr/zone'
const prisma = new PrismaClient()

export class ArtworkRepository {
  public async getArtworkFeed(feedOptions: ArtworkFeedOptions) {
    const artworks = await prisma.$queryRawUnsafe<ArtworkUnitFeed[]>(
      this.feedSql(feedOptions)
    )

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
}

interface ArtworkFeedOptions {
  zoneFilter: ZoneAttribute | undefined
  userId: number
}
