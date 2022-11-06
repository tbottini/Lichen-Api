import { Medium, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const { Router } = require('express')
const jwt = require('../modules/jwt')
const {
  parserMiddleware,
  QueryEnum,
  QueryString,
  QueryDate,
  QueryInt,
  parserQuery,
} = require('../modules/middleware-parser')
const { ZoneAttribute, Position } = require('../attr/zone')
const logger = require('../modules/logger')

const mediumSearch = {
  artwork: 'artwork', //toutes les notif sur les nouveaux artwork
  event: 'event', //toutes les notif sur les nouveaux évènements
  like: 'like', //toutes les notif sur les nouveaux évènements (on a like une de vos oeuvres )
  follow: 'follow', // toutes les notif sur les follows (on vous suit, un ami à suivis quelqu'un)
}

const querySearch = {
  anchor: new QueryDate(),
  duration: new QueryInt({ max: 300 }), // max 123 days / 3 month
  limit: new QueryInt({ max: 100 }),
  medium: new QueryEnum(mediumSearch),
}

var router = new Router()

/**
 * @route GET - /news/
 * @group News - section for filters news about a profile
 * @param {date} anchor.query
 * @param {integer} duration.query
 * @param {double} longitude.query
 * @param {double} latitude.query
 * @param {double} radius.query
 * @security jwt
 * @returns 200 - a set of news depending to the parameters and the profile
 */
router.get(
  '/',
  [jwt.middleware, parserQuery(querySearch)],
  async (req, res) => {
    //DateAnchor la date de départ pour à partir de laquel on récupère les données
    //duration durée à partir de la date anchor où on récupère les news (en secondes)
    var { anchor, duration, limit, medium, longitude, latitude, radius } =
      req.query

    var zone = ZoneAttribute.parse(latitude, longitude, radius)

    if (!anchor) anchor = new Date()
    if (!duration) duration = 30

    var endDate = new Date(anchor.getTime())
    endDate.setDate(anchor.getDate() - duration)
    anchor.setDate(anchor.getDate() + 1)

    logger.debug(endDate.toDateString())
    logger.debug(anchor.toDateString())

    const insertionFilter = {
      gte: endDate,
      lte: anchor,
    }

    logger.debug('test')

    var promises: Array<Promise<Array<Object>>> = []
    //recherche des derniers artworks posté par les follow
    promises.push(
      prisma.artwork.findMany({
        where: {
          insertion: insertionFilter,
          project: {
            author: {
              followed: {
                some: {
                  userFollowingId: req.user.id,
                },
              },
              gallery: zone == undefined ? undefined : zone!.getZoneFilter(),
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
            },
          },
        },
      })
    )

    promises.push(
      prisma.event.findMany({
        where: {
          insertion: insertionFilter,
          organisator: {
            followed: {
              some: { userFollowingId: req.user.id },
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
                userFollowingId: req.user.id,
              },
            },
          },
        },
      })
    )

    promises.push(
      prisma.eventFollow.findMany({
        where: {
          creation: insertionFilter,
          user: {
            gallery: zone == undefined ? undefined : zone!.getZoneFilter(),
            followed: {
              some: {
                userFollowedId: req.user.id,
              },
            },
          },
        },
      })
    )

    var [artworks, events, artworksLike, eventFollow] = await Promise.all(
      promises
    )

    logger.debug(artworks, events)

    return res.json({ events, artworks, artworksLike, eventFollow })
  }
)

module.exports = { router }
