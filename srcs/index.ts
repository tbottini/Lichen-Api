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

const { createIPX, createIPXMiddleware } = require('ipx')
const ipx = createIPX()

const projects = require('./route/projects.router.ts')
import { swipeRouter } from './swipe/Swipe.router'
import { userRouter } from './users/users.router'

// const expressSwagger = require('express-swagger-generator')(expressApp)
// expressSwagger(require('./swagger.options.js'))

if (process.env.DATABASE_URL == null) {
  logger.error('env DATABASE_URL isnt defined')
  process.exit(1)
}

logger.info('NODE_ENV', process.env.NODE_ENV)

const FRONT_APP_URL =
  process.env.NODE_ENV == 'production'
    ? 'https://app.reseau-lichen.fr'
    : 'http://localhost:8081'

expressApp.use(
  cors({
    origin: FRONT_APP_URL,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

expressApp
  .use(middlewareLogger)
  .use(express.json())
  .use('/_ipx', createIPXMiddleware(ipx))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .use(express.static('public'))

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
const PORT = config.get('app.port')
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
