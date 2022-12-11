import { parserMiddleware } from '../commons/parsers/QueryParser'
import { mediumEnum } from '../medium/mediumEnum'
import { prisma } from '../commons/prisma/prisma'
const { Router } = require('express')
import * as jwt from '../modules/jwt'
import { logger } from '../modules/logger'
const DateAttr = require('../attr/date')
const fileMiddleware = require('../modules/middleware-file')
const IndexAttr = require('../attr/index')
const { MiddlewareIntParser } = require('../attr/int')
const EnumAttr = require('../attr/enum')

const dimensionParse = new MiddlewareIntParser({
  attr: ['width', 'length', 'height'],
})
const yearProjectParse = new MiddlewareIntParser({
  attr: ['yearStart', 'yearEnd'],
})

const router = new Router()
  .post(
    '/',
    [jwt.middleware, fileMiddleware(), yearProjectParse.getParser()],
    async (req, res) => {
      const { title, description, medium, yearStart, yearEnd } = req.body

      //TODO remove ?
      const start = new DateAttr(req.body.start)
      if (start.error)
        return res.status(400).json({ error: 'bad format for start attr' })

      if (!req.file)
        return res.status(400).json({ error: 'no image was provided' })
      const src = req.file.filename

      var sizeOfArray = await prisma.project.count({
        where: {
          authorId: req.user.id,
        },
      })
      logger.debug(sizeOfArray)

      var mediumWrapper = new EnumAttr(mediumEnum, medium)
      if (mediumWrapper.error)
        return res.status(400).json({ error: 'bad format for enum attr' })

      var result = await prisma.project.create({
        data: {
          title: title,
          description: description,
          create: start.value,
          index: sizeOfArray,
          medium: mediumWrapper.value,
          yearStart: yearStart,
          yearEnd: yearEnd,
          src: src,
          author: {
            connect: {
              id: req.user.id,
            },
          },
        },
      })
      logger.debug(result)

      return res.json(result)
    }
  )
  .get('/', async (req, res) => {
    return res.json(await prisma.project.findMany({}))
  })
  .put(
    '/:id',
    [
      jwt.middleware,
      fileMiddleware(),

      parserMiddleware({ id: 'int' }),
      yearProjectParse.getParser(),
    ],
    async (req, res) => {
      var { title, description, index, medium, yearStart, yearEnd } = req.body

      //parse date
      const start = new DateAttr(req.body.start)
      logger.debug(start)
      if (start.error)
        return res.status(400).json({ error: 'bad format for start attr' })

      //on check l'index
      if (index) {
        //on update l'index selon sa position dans le user
        var indexAttr = new IndexAttr('authorId', req.user.id, 'Project')
        await indexAttr.queryUpdateIndex(req.params.id, index)
      }

      var isOwn = await prisma.project.findFirst({
        where: {
          id: parseInt(req.params.id),
          author: {
            id: req.user.id,
          },
        },
      })

      logger.debug('is own ', isOwn)

      if (isOwn == null)
        return res
          .status(404)
          .json({ error: 'no project exist at this id for you' })

      var mediumWrapper = new EnumAttr(mediumEnum, medium)
      if (mediumWrapper.error)
        return res.status(400).json({ error: 'bad format for enum attr' })

      if (req.file) {
        var src = req.file.filename
      }

      //check error
      var result = await prisma.project.update({
        where: {
          id: req.params.id,
        },
        data: {
          title: title,
          description: description,
          create: start.value,
          medium: mediumWrapper.value,
          yearEnd: yearEnd,
          yearStart: yearStart,
          src: src,
        },
      })
      return res.json(result)
    }
  )
  .put(
    '/:id_project/index/:id_artwork',
    [
      parserMiddleware({ id_artwork: 'int' }),
      parserMiddleware({ id_project: 'int' }),
      jwt.middleware,
    ],
    async (req, res) => {
      //le nom de la column qui contenant l'id qui lit l'artwork
      //avec les autres artwork, ici idProject

      logger.debug('idproject', req.params)
      const NAME_ARRAY = 'projectId'
      const TABLE_NAME = 'Artwork'

      const newIndex = req.body.index

      if (!newIndex)
        return res.status(400).json({ error: 'no new index present' })

      const isOwn = await prisma.artwork.findMany({
        where: {
          id: req.params.id_artwork,
          project: {
            id: req.params.id_project,
            author: {
              id: req.user.id,
            },
          },
        },
      })
      if (isOwn.length == 0)
        return res
          .status(400)
          .json({ error: 'artwork isnt link to your account' })

      var indexAttr = new IndexAttr(
        NAME_ARRAY,
        req.params.id_project,
        TABLE_NAME
      )

      await indexAttr.queryUpdateIndex(req.params.id_artwork, newIndex)
      return res.json(
        await prisma.project.findUnique({
          where: { id: req.params.id_project },
          include: {
            artworks: {
              orderBy: {
                index: 'asc',
              },
            },
          },
        })
      )
    }
  )
  .delete(
    '/:id',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      //on update l'index selon sa position dans le user
      var indexAttr = new IndexAttr('authorId', req.user.id, 'Project')
      await indexAttr.uncrementOver(req.params.id)

      await prisma.artwork.deleteMany({
        where: {
          project: { id: req.params.id },
        },
      })

      var result = await prisma.project.delete({
        where: {
          id: req.params.id,
        },
      })
      logger.debug(result)
      if (result == null)
        return res
          .status(404)
          .json({ error: 'this project isnt link to your profile' })
      return res.json(result)
    }
  )
  .get('/:id', parserMiddleware({ id: 'int' }), async (req, res) => {
    var result = await prisma.project.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        author: true,
        artworks: {
          orderBy: {
            index: 'asc',
          },
        },
      },
    })

    if (result == null)
      return res.status(404).json({ error: 'no ressources found' })
    return res.json(result)
  })
  .get('/:id/artworks', parserMiddleware({ id: 'int' }), async (req, res) => {
    //check if the project is own by the user
    //check params
    var result = await prisma.project.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        author: true,
        create: true,
        index: true,
        artworks: {
          orderBy: {
            index: 'asc',
          },
        },
      },
    })
    if (result == null)
      return res.status(404).json({ error: 'no ressources found' })
    return res.json(result)
  })
  .post(
    '/:id/artworks',
    [
      parserMiddleware({ id: 'int' }),
      jwt.middleware,
      fileMiddleware(),
      dimensionParse.getParser(),
    ],
    //! when a middleware handle body he must be setup after fileMiddleware because filemiddleware handle xxx-urlencoded and body not appear before this middleware
    async (req, res) => {
      const { title, description, start, medium, height, width, length } =
        req.body

      logger.debug(req.body)

      if (!req.file)
        return res.status(400).json({ error: 'no image was provided' })
      const src = req.file.filename

      if (medium != null) {
        var catAttr = mediumEnum[medium]

        if (!catAttr == null)
          return res.json(400).json({ error: 'bad format for medium attr' })
      }

      var startAttr = new DateAttr(start)
      if (startAttr.error)
        return res.status(400).json({ error: 'bad format for start attr' })

      var sizeOfArray = await prisma.artwork.count({
        where: {
          projectId: req.params.id,
        },
      })
      logger.debug(sizeOfArray)

      var result = await prisma.artwork.create({
        data: {
          description,
          title,
          start: startAttr.value,
          medium: catAttr,
          src: src,
          index: sizeOfArray,
          length,
          width,
          height,
          project: {
            connect: {
              id: req.params.id,
            },
          },
        },
      })
      return res.json(result)
    }
  )

module.exports = { router }
