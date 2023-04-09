import { Prisma } from '@prisma/client'
import { CircularZone } from '../../attr/CircularZone'
import { prisma } from '../../commons/prisma/prisma'
import { MediumValues } from '../../medium/mediumEnum'
import { logger } from '../../modules/logger'
import { sortSearchedElements } from '../../modules/research'
import { userScope } from '../../users/users.router'
import { ImageSrc } from '../../modules/images/ImageDomainBroadcaster'
const _ = require('lodash')

export class EventService {
  async getEvents(filter: GetEventFilter) {
    let whereClause: Prisma.EventWhereInput = {
      dateStart: {
        lte: filter.dateEnd,
        gte: filter.dateStart,
      },
      name: {
        mode: 'insensitive',
        contains: filter.name,
      },
      medium:
        filter.mediums.length == 0
          ? undefined
          : {
              in: filter.mediums,
            },
    }
    if (filter.zone != undefined) {
      whereClause = _.assign(whereClause, filter.zone?.getZoneFilter())
    }

    try {
      let results = await prisma.event.findMany({
        where: whereClause,
        include: {
          organisator: {
            select: userScope.public,
          },
        },
      })

      if (filter.name) {
        results = sortSearchedElements(results, filter.name, item => item.name)
        logger.debug(results)
      }

      return results
    } catch (e) {
      throw new InternalError(e)
    }
  }

  async getImages(): Promise<ImageSrc[]> {
    const events = await prisma.event.findMany({
      select: {
        src: true,
      },
    })
    return events.filter(e => e.src) as ImageSrc[]
  }
}

interface GetEventFilter {
  name?: string
  dateEnd?: Date
  dateStart: Date
  zone: CircularZone | undefined
  mediums: MediumValues[]
}

export class InternalError extends Error {
  type: string
  constructor(error) {
    super(error)
    this.type = 'InternalError'
  }
}
