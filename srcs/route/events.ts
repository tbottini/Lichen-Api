import { Prisma, PrismaClient } from '@prisma/client'
const _ = require('lodash')
const prisma = new PrismaClient(),
  { Router } = require('express'),
  jwt = require('../modules/jwt'),
  DateAttr = require('../attr/date'),
  {
    parserMiddleware,
    parserQuery,
    QueryDate,
    QueryString,
    QueryEnum,
  } = require('../modules/middleware-parser'),
  { FloatAttribute } = require('../attr/Attribute'),
  { ParamParser } = require('../attr/ParamParser'),
  fileMiddleware = require('../modules/middleware-file'),
  IndexAttr = require('../attr/index'),
  { researchSort } = require('../modules/research'),
  userScope = require('./users').scope,
  { ZoneAttribute, Position } = require('../attr/zone'),
  { mediumDict } = require('../controller/mediumEnum'),
  EnumAttr = require('../attr/enum'),
  logger = require('../modules/logger')
const querySearch = {
  dateStart: new QueryDate(),
  dateEnd: new QueryDate(),
  title: new QueryString(),
  medium: new QueryEnum(mediumDict, { isList: true }),
}

const positionParser = new ParamParser([
  new FloatAttribute('longitude'),
  new FloatAttribute('latitude'),
])

const includeField = {
  organisator: true,
  followedBy: true,
}

var router = new Router()

router
  /**
   * @route POST /events/
   * @group Events
   * @consumes application/x-www-form-urlencoded
   * @param {string} name.query - firstname of user
   * @param {string} description.query
   * @param {date} dateStart.query
   * @param {date} dateEnd.query
   * @param {enum} medium.query
   * @param {float} longitude.query
   * @param {float} latitude.query
   * @returns {object} 200 - the edited event
   * @security jwt
   */
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

      var mediumAttr = new EnumAttr(mediumDict, medium)
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

  /**
   * Will search events accordings to filters
   * @route GET /events/
   * @group Events
   * @param {date} dateStart.query
   * @param {date} dateEnd.query
   * @param {string} name.query
   * @param {float} latitude.query
   * @param {float} longitude.query
   * @param {float} radius.query
   * @param {enum} medium.query - filter about the medium of organisator
   * @returns {object} 200 - List of events
   */
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

  /**
   * Will edit an events
   * @route PUT /events/:id
   * @group Events
   * @param {integer} id.path.required
   * @param {string} name.query
   * @param {string} description.query
   * @param {integer} index.query - the event's occurence index
   * @param {date} dateStart.query
   * @param {date} dateEnd.query
   * @param {enum} medium.query
   * @param {float} longitude.query
   * @param {float} latitude.query
   * @security jwt
   * @returns {object} 200 - List of events
   */
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

      var mediumAttr = new EnumAttr(mediumDict, medium)
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

  /**
   * Delete an event
   * @route DELETE /events/:id
   * @group Events
   * @param {integer} id.path.required
   * @security jwt
   * @returns {object} 200 - the deleted event
   */
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

  /**
   * retrieve a specific event
   * @route GET /events/:id
   * @group Events
   * @param {integer} id.params.required
   * @returns {object} 200 - the precise event
   */
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

  /**
   * Follow a specific event
   * @route POST /events/:id/follow
   * @group Events
   * @param {integer} id.path.required - the id of followed event
   * @security jwt
   * @returns {object} 200 - return the followed event
   */
  .post(
    '/:id/follow',
    [parserMiddleware({ id: 'int' }), jwt.middleware],
    async (req, res) => {
      // var result = await prisma.eventFollow.findFirst({
      // 	where: {
      // 		userId: req.user.id,
      // 		eventId: req.params.id
      // 	}
      // });
      // if (result)
      // 	return res.json({ msg: "you already follow this event" });

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

  /**
   * Unfollow a specific event
   * @route DELETE /:id/follow
   * @group Events
   * @param {integer} id.path.required - the id of unfollowed event
   * @security jwt
   * @returns {object} 200 - return the unfollowed event
   */
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
