const { Router } = require('express')
import * as jwt from '../modules/jwt'
const DateAttr = require('../attr/date')
const EnumAttr = require('../attr/enum')
const IndexAttr = require('../attr/index')
const fileMiddleware = require('../modules/middleware-file')
import { CircularZone } from '../attr/CircularZone'
import {
  parserMiddleware,
  parserQuery,
  QueryDate,
  QueryEnum,
  QueryString,
} from '../commons/parsers/QueryParser'
import { mediumEnum } from '../medium/mediumEnum'
import { userScope } from '../users/users.router'
import { ArtworkService } from './services/Artwork.service'
import { logger } from '../modules/logger'
import { prisma } from '../commons/prisma/prisma'

const querySearch = {
  dateStart: new QueryDate(),
  dateEnd: new QueryDate(),
  title: new QueryString(),
  medium: new QueryEnum(mediumEnum),
}
const { MiddlewareIntParser } = require('../attr/int')

export const dimensionParse = new MiddlewareIntParser({
  attr: ['width', 'length', 'height'],
})

const artworkService = new ArtworkService()

export const artworksRouter = new Router()
  .get('/', parserQuery(querySearch), async (req, res) => {
    /*
     * pour les dates on met une date de départ et une date de fin
     * pour le titre[string] c'est une chaine qui doit être contenue
     * et pour la catégorie l'enum doit correspondre
     * pour la zone de recherche, il y a une latitude, une longitude, et un rayon de recherche
     */
    const { dateStart, dateEnd, title, medium, latitude, longitude, radius } =
      req.query

    const zone = CircularZone.parse(latitude, longitude, radius)

    const foundArtworks = await artworkService.getAllTasks({
      zone,
      dateStart,
      dateEnd,
      title,
      medium,
    })

    return res.json(foundArtworks)
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
      const {
        title,
        description,
        start,
        medium,
        index,
        length,
        width,
        height,
      } = req.body

      const isOwn = await prisma.artwork.findFirst({
        where: {
          id: parseInt(req.params.id),
          project: {
            author: {
              id: req.user.id,
            },
          },
        },
      })
      if (isOwn == null)
        return res
          .status(404)
          .json({ error: 'no project exist at this id for you' })

      if (index) {
        //on update l'index selon sa position dans le user
        const indexAttr = new IndexAttr('projectId', null, 'Artwork')
        await indexAttr.queryUpdateIndex(req.params.id, index)
      }
      //parse date
      const startAttr = new DateAttr(start)
      if (startAttr.error)
        return res.status(400).json({ error: 'bad format for start attr' })

      const mediumAttr = new EnumAttr(mediumEnum, medium)
      if (mediumAttr.error)
        return res.status(400).json({ error: 'bad format for enum attr' })

      if (req.file) {
        var src = req.file.key
      }

      //check error
      const result = await prisma.artwork.update({
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

  .delete(
    '/:id',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      const idProject = await prisma.artwork.findUnique({
        where: { id: req.params.id },
        select: { projectId: true },
      })
      if (idProject == null)
        return res
          .status(404)
          .json({ error: 'no ressource found with this id' })
      const indexAttr = new IndexAttr(
        'projectId',
        idProject.projectId,
        'Artwork'
      )

      await indexAttr.uncrementOver(req.params.id)

      const result = await prisma.artwork.deleteMany({
        where: {
          id: req.params.id,
          project: {
            author: {
              id: req.user.id,
            },
          },
        },
      })
      if (result.count == 0)
        return res
          .status(404)
          .json({ error: 'this artwork isnt link to your profile' })
      return res.json(result)
    }
  )

  .get('/:id', parserMiddleware({ id: 'int' }), async (req, res) => {
    const result = await prisma.artwork.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        project: {
          include: {
            author: { select: userScope.public },
          },
        },
      },
    })

    if (result == null)
      return res.status(404).json({ error: 'no ressources found' })
    return res.json(result)
  })

  .post(
    '/:id/like/',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      //on créé un élément dans la base de données

      const result = await prisma.artworkLikes.create({
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
          user: {
            select: userScope.public,
          },
        },
      })

      logger.debug('artwork as been liked ')
      return res.json(result)
    }
  )

  .get('/:id/like', parserMiddleware({ id: 'int' }), async (req, res) => {
    const result = await prisma.artwork.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        likeBy: {
          include: {
            user: { select: userScope.public },
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
        const result = await prisma.artworkLikes.deleteMany({
          where: {
            artwork: {
              id: req.params.id,
            },
            user: {
              id: req.user.id,
            },
          },
        })
        return res.json(result)
      } catch (e) {
        return res.json({ error: 'uncorrect data ids was provided' })
      }
    }
  )
