import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { MediumValues } from '../../medium/mediumEnum'
import { publicScope, UserPublic } from '../repositories/Users.repository'

export class GalleryService {
  async getGalleries(
    filter: PolarSquareZoneFilter,
    medium?: MediumValues
  ): Promise<UserPublic[]> {
    const foundGalleries = await prisma.user.findMany({
      where: {
        geoReferenced: true,
        gallery: toPrismaPolarFilter(filter),
        medium: mediumToPrismaFilter(medium),
      },
      select: publicScope,
    })

    return foundGalleries as UserPublic[]
  }
}

interface PolarSquareZoneFilter {
  longitudeMax: number
  longitudeMin: number
  latitudeMax: number
  latitudeMin: number
}

function toPrismaPolarFilter(filter: PolarSquareZoneFilter) {
  return {
    longitude: {
      lte: filter.longitudeMax,
      gte: filter.longitudeMin,
    },
    latitude: {
      lte: filter.latitudeMax,
      gte: filter.latitudeMin,
    },
  }
}

function mediumToPrismaFilter(medium?: MediumValues) {
  return medium
    ? {
        in: medium,
      }
    : undefined
}
