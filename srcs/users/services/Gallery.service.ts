import { prisma } from '../../commons/prisma/prisma'
import { MediumValues } from '../../medium/mediumEnum'
import { publicScope, UserRepositoryPublic } from '../repositories/Users.scope'

export class GalleryService {
  async getGalleries(
    filter?: PolarSquareZoneFilter,
    medium?: MediumValues
  ): Promise<UserRepositoryPublic[]> {
    const where = {
      gallery: filter ? toPrismaPolarFilter(filter) : undefined,
      medium: medium ? mediumToPrismaFilter(medium) : undefined,
      pseudo: { not: null }, // todo : c'est une dette technique, on empeche les utilisateurs sans pseudo = gallerie d'être retournés
    }

    console.log(where)

    const foundGalleries = await prisma.user.findMany({
      where,
      select: publicScope,
    })

    return foundGalleries.filter(g => !!g.gallery)
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
