require('dotenv').config({ path: getEnvFile() })
const config = require('config')
const cors = require('cors')
const users = require('./route/users')
const logger = require('./modules/logger')
const bodyParser = require('body-parser')
const express = require('express')
import { Application } from 'express'
const app: Application = express()
const { createIPX, createIPXMiddleware } = require('ipx')
const ipx = createIPX()
const middlewareLogger = require('./modules/middleware-logger')

const projects = require('./route/projects'),
  events = require('./route/events'),
  artworks = require('./route/artworks'),
  news = require('./route/news')
const expressSwagger = require('express-swagger-generator')(app)
expressSwagger(require('./swagger.options.js'))

if (process.env.DATABASE_URL == null) {
  logger.error('env DATABASE_URL isnt defined')
  process.exit(1)
}

if (process.env.NODE_ENV != 'production') app.use(cors())

app
  .use(middlewareLogger)
  .use(express.json())
  .use('/_ipx', createIPXMiddleware(ipx))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .use(express.static('public'))

// define a route handler for the default home page
app.get('/', (req, res) => {
  logger.info('hello world')
  res.send('Hello world!')
})

app
  .use('/users/', users.router)
  .use('/projects/', projects.router)
  .use('/events/', events.router)
  .use('/artworks/', artworks.router)
  .use('/news', news.router)

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
  app.listen(PORT, () => {
    console.log(`Server will start at http://localhost:${PORT}...
      /api-docs for documentation`)
  })
}

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

module.exports = app
