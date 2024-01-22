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
import { forbiden, isAuthorizedWithHeader, notFound } from '../modules/auth'
import { t } from '../modules/payloadTransformer'

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
  .post('/:userId', [fileMiddleware()], async (req, res) => {
    if (
      !isAuthorizedWithHeader(
        req.headers.authorization,
        parseInt(req.params.userId)
      )
    ) {
      return forbiden(res)
    }

    const { name, description, dateStart, dateEnd, medium } = req.body

    const createPositionParser = t
      .object<{ latitude?: number; longitude?: number }>()
      .schema({
        latitude: t.float().optionnal(),
        longitude: t.float().optionnal(),
      })

    const dtoPosition = createPositionParser.parse(req.body)
    logger.debug(`dtoPosition: ${JSON.stringify(dtoPosition)}`)

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

    const userId = parseInt(req.params.userId)

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
          longitude: dtoPosition.longitude,
          latitude: dtoPosition.latitude,
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
  })
  .post(
    '/',
    [jwt.middleware, fileMiddleware(), positionParser.middleware],
    async (req, res) => {
      const { name, description, dateStart, dateEnd, medium } = req.body
      const { latitude, longitude } = req.body.parsed

      if (!name) {
        return res.status(400).json({ error: 'Attribute name is empty' })
      }

      logger.info(`position: ${latitude} ${longitude}`)

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
      fileMiddleware(),
      positionParser.middleware,
    ],
    async (req, res) => {
      const { name, description, dateStart, dateEnd, index, medium } = req.body

      const { longitude, latitude } = req.body.parsed

      logger.debug(req.body)

      const event = await prisma.event.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
      })
      const organisator = await prisma.user.findFirst({
        where: {
          id: event?.organisatorId,
        },
      })

      if (!organisator) {
        return notFound(res)
      }
      if (!isAuthorizedWithHeader(req.headers.authorization, organisator.id)) {
        console.log('unauthorized')
        return forbiden(res)
      }

      // update index if defined
      if (index) {
        //on update l'index selon sa position dans le user
        const indexAttr = new IndexAttr(
          'organisatorId',
          organisator.id,
          'Event'
        )

        // update sql sur les index pour le ownerId
        await indexAttr.queryUpdateIndex(req.params.id, index)
      }

      const mediumAttr = new EnumAttr(mediumEnum, medium)
      if (mediumAttr.error)
        return res.status(400).json({ error: 'bad format for enum attr' })

      let src
      if (req.file) {
        src = req.file.filename
      }

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

          latitude,
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
  .delete('/:id', async (req, res) => {
    const event = await prisma.event.findFirst({
      where: {
        id: parseInt(req.params.id),
      },
    })
    if (!event) {
      return notFound(res)
    }

    if (
      !isAuthorizedWithHeader(req.headers.authorization, event.organisatorId)
    ) {
      return forbiden(res)
    }

    //on update l'index selon sa position dans le user
    const indexAttr = new IndexAttr(
      'organisatorId',
      event.organisatorId,
      'Event'
    )
    await indexAttr.uncrementOver(event.organisatorId)

    return res.json(
      await prisma.event.delete({
        where: {
          id: event.id,
        },
      })
    )
  })

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
