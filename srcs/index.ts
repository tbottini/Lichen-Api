require('dotenv').config({ path: getEnvFile() })
const config = require('config')
const cors = require('cors')
const users = require('./route/users.router.ts')
const logger = require('./modules/logger')
const bodyParser = require('body-parser')
const express = require('express')
import { Application } from 'express'
import { artworksRouter } from './artworks/artworks.router'
import { newsRouter } from './news/news.router'
const expressApp: Application = express()

const { createIPX, createIPXMiddleware } = require('ipx')
const ipx = createIPX()
const middlewareLogger = require('./modules/middleware-logger')

const projects = require('./route/projects.router.ts')
const events = require('./route/events.router.ts')

import { swipeRouter } from './swipe/Swipe.router'

// const expressSwagger = require('express-swagger-generator')(expressApp)
// expressSwagger(require('./swagger.options.js'))

if (process.env.DATABASE_URL == null) {
  logger.error('env DATABASE_URL isnt defined')
  process.exit(1)
}

console.log('NODE_ENV', process.env.NODE_ENV)

expressApp.use(
  cors({
    origin:
      process.env.NODE_ENV == 'production'
        ? 'https://app.reseau-lichen.fr'
        : 'http://localhost:8081',
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
  .use('/users/', users.router)
  .use('/projects/', projects.router)
  .use('/events/', events.router)
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
  console.log('will listen on port ' + PORT)
  expressApp.listen(PORT, () => {
    console.log(`Server will start at http://localhost:${PORT}...
      /api-docs for documentation`)
  })
}
export const app = expressApp

function getEnvFile(): string {
  switch (process.env.NODE_ENV) {
    case 'production':
      return '.env'
    case 'test':
      return '.env.test'
    case 'development':
      return '.env.dev'
    default:
      throw new Error(
        "env variable NODE_ENV isn't not valid value : production / dev / test"
      )
  }
}
