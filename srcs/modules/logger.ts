const winston = require('winston')
const GelfTransport = require('winston-gelf')
require('winston-daily-rotate-file')
const { combine, simple, timestamp, printf, prettyPrint, json, colorize } =
  winston.format
const { Console, File, DailyRotateFile } = winston.transports
// log levels system
const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 5,
  http: 4,
}

const options = {
  gelfPro: {
    adapterName: 'udp', // optional; currently supported "udp", "tcp" and "tcp-tls"; default: udp
    adapterOptions: {
      // this object is passed to the adapter.connect() method
      host: '127.0.0.1', // optional; default: 127.0.0.1
      port: 12201, // optional; default: 12201
    },
  },
}

const gelfTransport = new GelfTransport(options)

const filter = level =>
  winston.format(info => {
    if (info.level === level) {
      return info
    }
  })()

const transports = [
  // create a logging target for errors and fatals
  new File({
    filename: 'log/error.log',
    level: 'error',
    format: combine(prettyPrint(), timestamp(), json()),
  }),
  new DailyRotateFile({
    filename: 'application-%DATE%.log',
    datePattern: 'MM-DD',
    maxSize: '14d',
    level: 'debug',
    dirname: 'log',
    format: combine(prettyPrint(), timestamp()),
  }),
  new File({
    filename: 'log/http.log',
    level: 'http',
    format: combine(filter('http'), prettyPrint(), simple()),
  }),
  gelfTransport,
]

// create a Winston logger
export const logger = winston.createLogger({
  // specify the own log levels system
  levels,
  // specify the logging targets
  transports,
})

const logFormat = printf(function (info) {
  return `${
    info.level
  }: ${typeof info.message == 'string' ? info.message : '\n' + JSON.stringify(info.message, null, 4)}`
})

if (process.env.NODE_ENV != 'test') {
  logger.add(
    new Console({
      level: 'http',
      format: combine(colorize(), logFormat),
    })
  )
}
logger.stream = {
  write: function (message, encoding) {
    logger.http(message)
  },
}
