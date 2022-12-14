import { Project, User, Gallery } from '@prisma/client'
import { prisma } from '../../commons/prisma/prisma'
import { CircularZone } from '../../attr/CircularZone'
import { Position } from '../../commons/class/Position.class'
import { Artwork as ArtworkDto } from '../../interfaces/Artwork.type'
import { MediumValues } from '../../medium/mediumEnum'
import { RepositoryZoneFilter } from '../../swipe/repositories/RepositoryZoneFilter.class'
import {
  getLatitudeFilterForBoundary,
  getLongitudeFilterForBoundary,
} from '../../commons/class/ZoneBoundary.class'
import { sortSearchedElements } from '../../modules/research'
import { logger } from '../../modules/logger'

export class ArtworkService {
  async getAllTasks(
    dto: GetAllTask
  ): Promise<ArtworkWithPositionInformation[]> {
    const includeAuthorGallery = {
      project: {
        include: {
          author: {
            include: {
              gallery: true,
            },
          },
        },
      },
    }

    console.log('test')

    let results = await prisma.artwork.findMany({
      where: {
        start: {
          lte: dto.dateEnd,
          gte: dto.dateStart,
        },
        title: {
          mode: 'insensitive',
          contains: dto.title,
        },
        medium: dto.medium,
        project: {
          author: dto.zone ? createFilterForUserPosition(dto.zone) : undefined,
        },
      },
      include: includeAuthorGallery,
    })

    if (dto.zone != null) {
      results = filterArtworksOnZoneSquareToCircle(dto.zone, results)
      logger.debug(results)
    }

    if (dto.title) {
      results = sortSearchedElements(
        results,
        dto.title,
        item => item.title ?? ''
      )
      logger.debug(results)
    }

    return results
  }
}

function createFilterForUserPosition(circularZone: CircularZone) {
  const zoneFilter = new RepositoryZoneFilter(
    circularZone.longitude,
    circularZone.latitude,
    circularZone.radius
  )

  const zoneBoundary = zoneFilter.getZoneBoundary()

  return {
    positionLatitude: getLatitudeFilterForBoundary(zoneBoundary),
    positionLongitude: getLongitudeFilterForBoundary(zoneBoundary),
  }
}

export interface GetAllTask {
  zone?: CircularZone
  title?: string
  medium?: MediumValues
  dateStart?: Date
  dateEnd?: Date
}

function filterArtworksOnZoneSquareToCircle(
  zone: CircularZone,
  artworks: ArtworkWithPositionInformation[]
): ArtworkWithPositionInformation[] {
  return artworks.filter(artwork => {
    const artist = artwork.project.author
    if (!artist.positionLatitude || !artist.positionLongitude) {
      return false
    }
    const position = new Position(
      artist.positionLatitude,
      artist.positionLongitude
    )
    return zone.isUnderCircleZone(position)
  })
}

type ArtworkWithPositionInformation = ArtworkDto & {
  project: Project & {
    author: User & {
      gallery: Gallery | null
    }
  }
}
