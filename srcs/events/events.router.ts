import * as jwt from '../modules/jwt'
import { prisma } from '../commons/prisma/prisma'
const { Router } = require('express')
const DateAttr = require('../attr/date')
const { FloatAttribute } = require('../attr/Attribute')
const { ParamParser } = require('../attr/ParamParser')
const fileMiddleware = require('../modules/middleware-file')
const IndexAttr = require('../attr/index')
const EnumAttr = require('../attr/enum')
import {
  parserMiddleware,
  parserQuery,
  QueryDate,
  QueryString,
} from '../commons/parsers/QueryParser'
import { mediumEnum } from '../medium/mediumEnum'
import { userScope } from '../users/users.router'
import { CircularZone } from '../attr/CircularZone'
import { logger } from '../modules/logger'
import { parseMultipleEnum } from '../commons/parsers/Enum.parser'
import { tryCompleteRequest } from '../commons/router/fallbackError'
import { EventService } from './services/Events.service'

const querySearch = {
  dateStart: new QueryDate(),
  dateEnd: new QueryDate(),
  title: new QueryString(),
}

const positionParser = new ParamParser([
  new FloatAttribute('longitude'),
  new FloatAttribute('latitude'),
])

const eventService = new EventService()

export const eventsRouter = new Router()
  .post(
    '/:galleryId',
    [fileMiddleware(), positionParser.middleware],
    async (req, res) => {
      if (
        req.headers.authorization !==
        `Bearer 0u1Kz9kusLXRfLOZ6zVv0pP6m0skePmMVkUAzKWLM2Ogds7cggaK5miww6kBstqb`
      ) {
        return res.status(401).end()
      }

      const { name, description, dateStart, dateEnd, medium } = req.body
      const { latitude, longitude } = req.body.parsed

      if (!name) {
        return res.status(400).json({ error: 'Attribute name is empty' })
      }

      const src = req.file ? req.file.filename : undefined

      const mediumQuery = new EnumAttr(mediumEnum, medium)
      if (mediumQuery.error) {
        return res.status(400).json({ error: 'Bad format for enum attr' })
      }

      const dateStartQuery = new DateAttr(dateStart)
      if (dateStartQuery.error) {
        return res.status(400).json({ error: 'Bad format for date start attr' })
      }

      const dateEndAttr = new DateAttr(dateEnd)
      if (dateEndAttr.error) {
        return res.status(400).json({ error: 'Bad format for date end attr' })
      }

      const userId = parseInt(req.params.galleryId)

      const sizeOfArray = await prisma.event.count({
        where: {
          organisatorId: userId,
        },
      })

      try {
        const result = await prisma.event.create({
          data: {
            name: name,
            description: description,
            dateStart: dateStartQuery.value,
            dateEnd: dateEndAttr.value,
            src: src,
            index: sizeOfArray,
            medium: mediumQuery.value,
            longitude,
            latitude,
            organisator: {
              connect: {
                id: userId,
              },
            },
          },
          include: {
            organisator: {
              select: userScope.public,
            },
          },
        })
        return res.json(result)
      } catch (e) {
        console.log(e)
        return res.status(500).end('Internal Error')
      }
    }
  )
  .post(
    '/',
    [jwt.middleware, fileMiddleware(), positionParser.middleware],
    async (req, res) => {
      const { name, description, dateStart, dateEnd, medium } = req.body
      const { latitude, longitude } = req.body.parsed

      if (!name) {
        return res.status(400).json({ error: 'Attribute name is empty' })
      }

      const src = req.file ? req.file.filename : undefined

      const mediumQuery = new EnumAttr(mediumEnum, medium)
      if (mediumQuery.error) {
        return res.status(400).json({ error: 'Bad format for enum attr' })
      }

      const dateStartQuery = new DateAttr(dateStart)
      if (dateStartQuery.error) {
        return res.status(400).json({ error: 'Bad format for date start attr' })
      }

      const dateEndAttr = new DateAttr(dateEnd)
      if (dateEndAttr.error) {
        return res.status(400).json({ error: 'Bad format for date end attr' })
      }

      const sizeOfArray = await prisma.event.count({
        where: {
          organisatorId: req.user.id,
        },
      })

      try {
        const result = await prisma.event.create({
          data: {
            name: name,
            description: description,
            dateStart: dateStartQuery.value,
            dateEnd: dateEndAttr.value,
            src: src,
            index: sizeOfArray,
            medium: mediumQuery.value,
            longitude,
            latitude,
            organisator: {
              connect: {
                id: req.user.id,
              },
            },
          },
          include: {
            organisator: {
              select: userScope.public,
            },
          },
        })
        return res.json(result)
      } catch (e) {
        console.log(e)
        return res.status(500).end('Internal Error')
      }
    }
  )
  .get('/', parserQuery(querySearch), async (req, res) => {
    /*
     * pour les dates on met une date de départ et une date de fin
     * on ne cherche que en fonction de la date de début d'évènement
     * pour la string c'est une chaine qui doit être contenu par le titre
     */

    tryCompleteRequest(res, async () => {
      const {
        dateStart,
        dateEnd,
        name,
        latitude,
        longitude,
        radius,
        medium,
        galleryId,
      } = req.query

      const zone = CircularZone.parse(latitude, longitude, radius)
      const mediums = parseMultipleEnum(medium, mediumEnum)

      res.status(200).json(
        await eventService.getEvents({
          name,
          zone,
          dateStart,
          dateEnd,
          mediums,
          galleryId: galleryId ? parseInt(galleryId) : undefined,
        })
      )
    })
  })
  .put(
    '/:id',
    [
      parserMiddleware({ id: 'int' }),
      jwt.middleware,
      fileMiddleware(),
      positionParser.middleware,
    ],
    async (req, res) => {
      const { name, description, dateStart, dateEnd, index, medium } = req.body
      const { longitude, latitude } = req.body.parsed

      logger.debug(req.body)

      // we check if the event belongs to the user
      const isOwn = await prisma.event.findFirst({
        where: {
          id: parseInt(req.params.id),
          organisator: {
            id: req.user.id,
          },
        },
      })
      logger.debug('is own', isOwn)
      if (isOwn == null)
        return res
          .status(404)
          .json({ error: 'no events exist at this id for you' })

      if (index) {
        //on update l'index selon sa position dans le user
        const indexAttr = new IndexAttr('organisatorId', req.user.id, 'Event')
        await indexAttr.queryUpdateIndex(req.params.id, index)
      }

      const mediumAttr = new EnumAttr(mediumEnum, medium)
      if (mediumAttr.error)
        return res.status(400).json({ error: 'bad format for enum attr' })

      if (req.file) {
        var src = req.file.filename
      }

      logger.debug('DATE START', dateStart)

      const dateStartAttr = new DateAttr(dateStart)
      if (dateStartAttr.error)
        return res.status(400).json({ error: 'bad format for start attr' })

      const dateEndAttr = new DateAttr(dateEnd)
      if (dateEndAttr.error)
        return res.status(400).json({ error: 'bad format for start attr' })

      const result = await prisma.event.update({
        where: {
          id: req.params.id,
        },
        data: {
          name: name,
          description: description,
          dateStart: dateStartAttr.value,
          dateEnd: dateEndAttr.value,
          medium: mediumAttr.value,
          latitude: latitude,
          longitude,
          src: src,
        },
        include: {
          organisator: {
            select: userScope.public,
          },
        },
      })
      return res.json(result)
    }
  )
  .delete(
    '/:id',
    [parserMiddleware({ id: 'int' }), jwt.middleware],
    async (req, res) => {
      //on update l'index selon sa position dans le user
      const indexAttr = new IndexAttr('organisatorId', req.user.id, 'Event')
      await indexAttr.uncrementOver(req.params.id)

      return res.json(
        await prisma.event.deleteMany({
          where: {
            id: req.params.id,
            organisator: {
              id: req.user.id,
            },
          },
        })
      )
    }
  )

  .get('/:id', parserMiddleware({ id: 'int' }), async (req, res) => {
    const result = await prisma.event.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        followBy: {
          include: {
            user: {
              select: userScope.public,
            },
          },
        },
        organisator: {
          select: userScope.public,
        },
      },
    })
    if (!result) return res.status(404).json({ error: 'no event at this id' })

    return res.json(reinjectEventFollow(result))
  })

  .post(
    '/:id/follow',
    [parserMiddleware({ id: 'int' }), jwt.middleware],
    async (req, res) => {
      try {
        const result = await prisma.eventFollow.create({
          data: {
            event: {
              connect: {
                id: req.params.id,
              },
            },
            user: {
              connect: {
                id: req.user.id,
              },
            },
          },
        })
        return res.json(result)
      } catch (e) {
        logger.debug(e)
        return res.status(400).json({ error: 'error' })
      }
    }
  )

  .delete(
    '/:id/follow',
    [parserMiddleware({ id: 'int' }), jwt.middleware],
    async (req, res) => {
      logger.debug('event', req.params.id)
      try {
        const result = await prisma.eventFollow.deleteMany({
          where: {
            user: {
              id: req.user.id,
            },
            event: {
              id: req.params.id,
            },
          },
        })
        return res.json(result)
      } catch (e) {
        logger.debug(e)
        return res.status(400).json({ error: 'error' })
      }
    }
  )

//fonction à appelé l'évènement est wrappé par un container follow
//qui est une table qui indique quand est-ce que et par qui l'évènement est suivis

function reinjectEventFollow(event) {
  event.followBy = event.followBy.map(follow => {
    follow.user.followAt = follow.creation
    return follow.user
  })
  return event
}
