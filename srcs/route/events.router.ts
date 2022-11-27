import { Prisma, PrismaClient } from '@prisma/client'
const _ = require('lodash')
import * as jwt from '../modules/jwt'
const prisma = new PrismaClient(),
  { Router } = require('express'),
  DateAttr = require('../attr/date'),
  { FloatAttribute } = require('../attr/Attribute'),
  { ParamParser } = require('../attr/ParamParser'),
  fileMiddleware = require('../modules/middleware-file'),
  IndexAttr = require('../attr/index'),
  { researchSort } = require('../modules/research'),
  userScope = require('./users.router').scope,
  { ZoneAttribute, Position } = require('../attr/zone'),
  EnumAttr = require('../attr/enum'),
  logger = require('../modules/logger')

import {
  parserMiddleware,
  parserQuery,
  QueryDate,
  QueryEnum,
  QueryString,
} from '../commons/parsers/QueryParser'
import { mediumEnum } from '../medium/mediumEnum'

const querySearch = {
  dateStart: new QueryDate(),
  dateEnd: new QueryDate(),
  title: new QueryString(),
  medium: new QueryEnum(mediumEnum, { isList: true }),
}

const positionParser = new ParamParser([
  new FloatAttribute('longitude'),
  new FloatAttribute('latitude'),
])

const includeField = {
  organisator: true,
  followedBy: true,
}

const router = new Router()
  .post(
    '/',
    [jwt.middleware, fileMiddleware(), positionParser.middleware],
    async (req, res) => {
      const { name, description, dateStart, dateEnd, medium } = req.body
      const { latitude, longitude } = req.body.parsed

      logger.debug(req.body)

      if (!name)
        return res.status(400).json({ error: 'attribute name is empty' })

      if (req.file) {
        var src = req.file.filename
      }

      var mediumAttr = new EnumAttr(mediumEnum, medium)
      if (mediumAttr.error)
        return res.status(400).json({ error: 'bad format for enum attr' })

      logger.debug('DATE START', dateStart)

      const dateStartAttr = new DateAttr(dateStart)
      if (dateStartAttr.error)
        return res.status(400).json({ error: 'bad format for date start attr' })

      const dateEndAttr = new DateAttr(dateEnd)
      if (dateEndAttr.error)
        return res.status(400).json({ error: 'bad format for date end attr' })

      var sizeOfArray = await prisma.event.count({
        where: {
          organisatorId: req.user.id,
        },
      })
      logger.debug(sizeOfArray)

      var result = await prisma.event.create({
        data: {
          name: name,
          description: description,
          dateStart: dateStartAttr.value,
          dateEnd: dateEndAttr.value,
          src: src,
          index: sizeOfArray,
          medium: mediumAttr.value,
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
    }
  )
  .get('/', parserQuery(querySearch), async (req, res) => {
    /*
     * pour les dates on met une date de départ et une date de fin
     * on ne cherche que en fonction de la date de début d'évènement
     * pour la string c'est une chaine qui doit être contenu par le titre
     */

    const { dateStart, dateEnd, name, latitude, longitude, radius, medium } =
      req.query

    logger.debug('MEDIUM EVENT', medium)

    var zone = ZoneAttribute.parse(latitude, longitude, radius)

    var whereClause: Prisma.EventWhereInput = {
      dateStart: {
        lte: dateEnd,
        gte: dateStart,
      },
      name: {
        mode: 'insensitive',
        contains: name,
      },
      medium:
        medium == undefined
          ? undefined
          : {
              in: medium,
            },
    }
    if (zone != undefined)
      whereClause = _.assign(whereClause, zone?.getZoneFilter())

    console.log(whereClause)

    var results = await prisma.event.findMany({
      where: whereClause,
      include: {
        organisator: {
          select: userScope.public,
        },
      },
    })

    if (name) {
      results = researchSort(results, name, item => item.name)
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
      positionParser.middleware,
    ],
    async (req, res) => {
      const { name, description, dateStart, dateEnd, index, medium } = req.body
      var { longitude, latitude } = req.body.parsed

      logger.debug(req.body)

      // we check if the event belongs to the user
      var isOwn = await prisma.event.findFirst({
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
        var indexAttr = new IndexAttr('organisatorId', req.user.id, 'Event')
        await indexAttr.queryUpdateIndex(req.params.id, index)
      }

      var mediumAttr = new EnumAttr(mediumEnum, medium)
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

      var result = await prisma.event.update({
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
      var indexAttr = new IndexAttr('organisatorId', req.user.id, 'Event')
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
    var result = await prisma.event.findUnique({
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
        var result = await prisma.eventFollow.create({
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
      } catch (e) {
        logger.debug(e)
        return res.status(400).json({ error: 'error' })
      }
      return res.json(result)
    }
  )

  .delete(
    '/:id/follow',
    [parserMiddleware({ id: 'int' }), jwt.middleware],
    async (req, res) => {
      logger.debug('event', req.params.id)
      try {
        var result = await prisma.eventFollow.deleteMany({
          where: {
            user: {
              id: req.user.id,
            },
            event: {
              id: req.params.id,
            },
          },
        })
      } catch (e) {
        logger.debug(e)
        return res.status(400).json({ error: 'error' })
      }
      return res.json(result)
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

module.exports = { router }
