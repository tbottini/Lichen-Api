import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const { Router } = require('express')
import * as jwt from '../modules/jwt'
const DateAttr = require('../attr/date')
const EnumAttr = require('../attr/enum')
const IndexAttr = require('../attr/index')

const fileMiddleware = require('../modules/middleware-file')
const { researchSort } = require('../modules/research')
const userScope = require('./users')
import { ZoneAttribute } from '../attr/zone'
import { Position } from '../commons/class/Position.class'
import {
  parserMiddleware,
  parserQuery,
  QueryDate,
  QueryEnum,
  QueryString,
} from '../commons/parsers/QueryParser'
import { mediumEnum } from '../medium/mediumEnum'

const logger = require('../modules/logger')

const querySearch = {
  dateStart: new QueryDate(),
  dateEnd: new QueryDate(),
  title: new QueryString(),
  medium: new QueryEnum(mediumEnum),
}
const { MiddlewareIntParser } = require('../attr/int')

const dimensionParse = new MiddlewareIntParser({
  attr: ['width', 'length', 'height'],
})

const router = new Router()

router
  /**
   * @route GET /artworks/
   * @group Artworks
   * @param {date} dateStart.query
   * @param {date} dateEnd.query
   * @param {string} title.query
   * @param {enum} medium.query
   * @param {float} latitude.query
   * @param {float} longitude.query
   * @param {float} radius.query
   * @returns {list} 200 - list of artworks
   */
  .get('/', parserQuery(querySearch), async (req, res) => {
    /*
     * pour les dates on met une date de départ et une date de fin
     * pour le titre[string] c'est une chaine qui doit être contenue
     * et pour la catégorie l'enum doit correspondre
     * pour la zone de recherche, il y a une latitude, une longitude, et un rayon de recherche
     */
    const { dateStart, dateEnd, title, medium, latitude, longitude, radius } =
      req.query

    const zone = ZoneAttribute.parse(latitude, longitude, radius)

    const getGeoFilter = (zone: ZoneAttribute | undefined) =>
      !zone
        ? undefined
        : {
            author: {
              geoReferenced: !zone ? undefined : true,
              gallery: zone.getZoneFilter(),
            },
          }

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

    let results = await prisma.artwork.findMany({
      where: {
        start: {
          lte: dateEnd,
          gte: dateStart,
        },
        title: {
          mode: 'insensitive',
          contains: title,
        },
        medium: medium,
        project: getGeoFilter(zone),
      },
      include: zone == undefined ? undefined : includeAuthorGallery,
    })

    if (zone != null) {
      results = filterArtworksOnZoneSquareToCircle(zone, results)

      logger.debug(results)
    }

    if (title) {
      results = researchSort(results, title, item => item.title)
      logger.debug(results)
    }

    return res.json(results)
  })

  .put(
    '/:id',
    [
      parserMiddleware({ id: 'int' }),
      jwt.middleware,
      fileMiddleware(),
      dimensionParse.getParser(),
    ],
    async (req, res) => {
      var { title, description, start, medium, index, length, width, height } =
        req.body

      logger.debug(req.body)

      var isOwn = await prisma.artwork.findFirst({
        where: {
          id: parseInt(req.params.id),
          project: {
            author: {
              id: req.user.id,
            },
          },
        },
      })
      logger.debug('is own', isOwn)
      if (isOwn == null)
        return res
          .status(404)
          .json({ error: 'no project exist at this id for you' })

      if (index) {
        //on update l'index selon sa position dans le user
        var indexAttr = new IndexAttr('projectId', null, 'Artwork')
        await indexAttr.queryUpdateIndex(req.params.id, index)
      }
      //parse date
      const startAttr = new DateAttr(start)
      if (startAttr.error)
        return res.status(400).json({ error: 'bad format for start attr' })

      var mediumAttr = new EnumAttr(mediumEnum, medium)
      if (mediumAttr.error)
        return res.status(400).json({ error: 'bad format for enum attr' })

      if (req.file) {
        var src = req.file.filename
      }

      //check error
      var result = await prisma.artwork.update({
        where: {
          id: req.params.id,
        },
        data: {
          title: title,
          description: description,
          start: startAttr.value,
          medium: mediumAttr.value,
          width: width,
          height: height,
          length: length,
          src: src,
        },
        include: {
          project: true,
        },
      })
      return res.json(result)
    }
  )

  /**
   * Delete your artwork
   * @route DELETE /artworks/
   * @group Artworks
   * @param {integer} firstname.path.required - firstname of user
   * @returns {object} 200 - The user profile
   * @security JWT
   */
  .delete(
    '/:id',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      var idProject = await prisma.artwork.findUnique({
        where: { id: req.params.id },
        select: { projectId: true },
      })
      if (idProject == null)
        return res
          .status(404)
          .json({ error: 'no ressource found with this id' })
      var indexAttr = new IndexAttr('projectId', idProject.projectId, 'Artwork')

      await indexAttr.uncrementOver(req.params.id)

      var result = await prisma.artwork.deleteMany({
        where: {
          id: req.params.id,
          project: {
            author: {
              id: req.user.id,
            },
          },
        },
      })
      logger.debug(result)
      if (result.count == 0)
        return res
          .status(404)
          .json({ error: 'this artwork isnt link to your profile' })
      return res.json(result)
    }
  )

  .get('/:id', parserMiddleware({ id: 'int' }), async (req, res) => {
    var result = await prisma.artwork.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        project: {
          include: {
            author: userScope.public,
          },
        },
      },
    })

    if (result == null)
      return res.status(404).json({ error: 'no ressources found' })
    return res.json(result)
  })

  // Routes for Artworks Likes
  // in prisma this routes is for LikeBy
  /**
   * Add an artwork to your list of artwork likes
   * @route POST /artworks/:id/like
   * @group Artworks
   * @param {integer} id.path.required - artwork's id to like
   * @returns {object} 200 - The user profile
   * @security JWT
   */
  .post(
    '/:id/like/',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      //on créé un élément dans la base de données

      var result = await prisma.artworkLikes.create({
        data: {
          user: {
            connect: {
              id: req.user.id,
            },
          },
          artwork: {
            connect: {
              id: req.params.id,
            },
          },
        },
        include: {
          artwork: true,
          user: userScope.public,
        },
      })
      logger.debug('artwork as been liked ')
      logger.debug(result)
      return res.json(result)
    }
  )

  .get('/:id/like', parserMiddleware({ id: 'int' }), async (req, res) => {
    var result = await prisma.artwork.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        likeBy: {
          include: {
            user: userScope.public,
          },
        },
      },
    })

    return res.json(result)
  })

  .delete(
    '/:id/like/',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      try {
        var result = await prisma.artworkLikes.deleteMany({
          where: {
            artwork: {
              id: req.params.id,
            },
            user: {
              id: req.user.id,
            },
          },
        })
      } catch (e) {
        return res.json({ error: 'uncorrect data ids was provided' })
      }

      return res.json(result)
    }
  )

function reinjectArtworkLikeBy(artwork) {
  logger.debug(artwork)

  artwork.likes = artwork.likes.map(like => {
    like.artwork.likeAt = like.creation
    return like.user
  })

  return artwork
}

/**
 * will take points filtered by a square zone (because
 * it's the only way to pre-filter with prisma)
 * and will filter again but with a circle zone this time
 * param points arrays of points that who we want to sort
 */
function filterArtworksOnZoneSquareToCircle(zone: ZoneAttribute, artworks) {
  return artworks.filter(artwork => {
    var g = artwork['project'].author.gallery
    var p: Position = new Position(g.latitude, g.longitude)
    return zone.isUnderCircleZone(p)
  })
}

module.exports = { router, dimensionParse }
