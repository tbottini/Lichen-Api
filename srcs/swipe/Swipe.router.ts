import { Router } from 'express'
import { SwipeService } from '../swipe/Swipe.service'
const { QueryInt, parserQuery } = require('../modules/middleware-parser')
import * as jwt from '../modules/jwt'
import { ZoneAttribute } from '../attr/zone'

const swipeService = new SwipeService()
export const swipeRouter = Router()

swipeRouter.get(
  '/random',
  [jwt.middleware, parserQuery({ limit: new QueryInt({ max: 100, min: 0 }) })],
  async (req, res) => {
    //todo add type of artwork research and place
    const { limit, longitude, latitude, radius } = req.query

    const zone = ZoneAttribute.parse(latitude, longitude, radius)
    const parsedLimit = limit ?? 10

    const artworksFeed = await swipeService.getSwipeArtworkFeed({
      userId: req.user.id,
      limit: parsedLimit,
      zone: zone,
    })

    return res.json(artworksFeed)
  }
)
