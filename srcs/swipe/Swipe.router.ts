import { Router } from 'express'
import { SwipeService } from '../swipe/Swipe.service'
const { QueryInt, parserQuery } = require('../modules/middleware-parser')
import * as jwt from '../modules/jwt'
import { parseRawZone } from '../commons/parsers/CircularZone.parser'
import { ZoneAttribute } from '../attr/zone'

const swipeService = new SwipeService()
export const swipeRouter = Router()

swipeRouter.get(
  '/random',
  [jwt.middleware, parserQuery({ limit: new QueryInt({ max: 100, min: 0 }) })],
  async (req, res) => getSwipeArtworkFeedHttp(req, res)
)

export async function getSwipeArtworkFeedHttp(req, res) {
  const { limit, longitude, latitude, radius } = req.query

  let zone: ZoneAttribute | undefined
  if (isAllDefined(latitude, longitude, radius)) {
    try {
      zone = parseRawZone(latitude, longitude, radius)
    } catch (e) {
      return res.status(400).json(e)
    }
  }

  const parsedLimit = limit ?? 10

  const artworksFeed = await swipeService.getSwipeArtworkFeed({
    userId: req.user.id,
    limit: parsedLimit,
    zone: zone,
  })

  return res.json(artworksFeed)
}

function isAllDefined(...attributes: string[]): boolean {
  return attributes.filter(a => a == undefined).length == 0
}
