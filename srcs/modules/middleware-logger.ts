import morgan from 'morgan'
import { logger } from './logger'

// create a Morgan middleware instance
// const middlewareLogger = morgan(":status :method :url - :date[web]");

const middlewareLogger = morgan(
  ':remote-addr :status :method :url - :date[web]',
  { stream: logger.stream }
)

module.exports = middlewareLogger
