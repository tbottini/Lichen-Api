require('./commons/env')
const config = require('config')
const cors = require('cors')
const bodyParser = require('body-parser')
const express = require('express')
import { Application } from 'express'
import { artworksRouter } from './artworks/artworks.router'
import { eventsRouter } from './events/events.router'
import { logger } from './modules/logger'
import { middlewareLogger } from './modules/middleware-logger'
import { newsRouter } from './news/news.router'
const expressApp: Application = express()

const projects = require('./route/projects.router.ts')
import { swipeRouter } from './swipe/Swipe.router'
import { userRouter } from './users/users.router'
import { ImageResourcesService } from './modules/images/ImageResourcesService'

// const expressSwagger = require('express-swagger-generator')(expressApp)
// expressSwagger(require('./swagger.options.js'))

if (process.env.DATABASE_URL == null) {
  logger.error('env DATABASE_URL isnt defined')
  process.exit(1)
}

logger.info('NODE_ENV', process.env.NODE_ENV)

const FRONT_APP_URL = config.webapp.url

console.log('front app url ', FRONT_APP_URL)

class Dependencies {
  getImageService() {
    return new ImageResourcesService()
  }
}

const dep = new Dependencies()

const imageService = dep.getImageService()

expressApp.use(
  cors({
    origin: FRONT_APP_URL,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

type ImageSize = 'original' | 'small' | 'medium'

expressApp
  .use(middlewareLogger)
  .use(express.json())

  .use('/images/:image_size/:image_name', async (req, res) => {
    const size: ImageSize = req.params.image_size as ImageSize
    if (!['original', 'small', 'medium'].includes(size)) {
      return res.status(400).end('wrong format for image_size')
    }
    const url = await imageService.getImageUrl({
      filename: req.params.image_name,
      size: size,
    })

    console.log(url)

    res.redirect(url)
  })
  .use('/images/:image_name', async (req, res) => {
    const url = await imageService.getImageUrl({
      filename: req.params.image_name,
    })

    console.log(url)

    res.redirect(url)
  })
  .use('/_ipx/:size/public/images/:image_name', async (req, res) => {
    const url = await imageService.getImageUrl({
      filename: req.params.image_name,
    })

    console.log(url)
    res.redirect(url)
  })
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
// .use(express.static('public'))

// define a route handler for the default home page
expressApp.get('/', (req, res) => {
  logger.info('hello world')
  res.send('Hello world!')
})

expressApp
  .use('/users/', userRouter)
  .use('/projects/', projects.router)
  .use('/events/', eventsRouter)
  .use('/artworks/', artworksRouter)
  .use('/news', newsRouter)
  .use('/swipe/', swipeRouter)

logger.info('NODE_ENV ' + process.env.NODE_ENV)

// start the Express server
const PORT = config.app.port
if (!PORT) {
  throw new Error(
    `Config variable isnt defined in config file for ENV : ${process.env.NODE_ENV}`
  )
}

if (process.env.NODE_ENV != 'test') {
  logger.info('will listen on port ' + PORT)
  expressApp.listen(PORT, () => {
    logger.info(`Server will start at http://localhost:${PORT}...
      /api-docs for documentation`)
  })
}
export const app = expressApp
