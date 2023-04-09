import morgan from 'morgan'
import { logger } from './logger'

export const middlewareLogger = morgan(
  ':remote-addr :status :method :url - :date[web]',
  { stream: logger.stream }
)

export const logBody = (req, res, next) => {
  logger.info(req.url + ', body : ' + JSON.stringify(req.body, null, '\t'))
  next()
}
