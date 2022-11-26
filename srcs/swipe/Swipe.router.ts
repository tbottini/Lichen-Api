import { Router } from 'express'
import { SwipeService } from '../swipe/Swipe.service'
import * as jwt from '../modules/jwt'
import { parseRawZone } from '../commons/parsers/CircularZone.parser'
import { ZoneAttribute } from '../attr/zone'
import {
  QueryEnum,
  QueryInt,
  parserQuery,
} from '../commons/parsers/QueryParser'
import { mediumEnum, MediumValues } from '../medium/mediumEnum'
import { RequestWithUser } from '../commons/interfaces/Request.types'

const swipeService = new SwipeService()
export const swipeRouter = Router()

swipeRouter.get(
  '/random',
  [
    ...jwt.middleware,
    parserQuery({
      limit: new QueryInt({ max: 100, min: 0 }),
      medium: new QueryEnum(mediumEnum, { isList: true }),
    }),
  ],
  async (req: RequestWithUser<GetSwipeArtworkDto>, res) => {
    const { limit, longitude, latitude, radius, medium } = req.query

    let zone: ZoneAttribute | undefined
    if (isAllDefined(latitude, longitude, radius)) {
      try {
        zone = parseRawZone(latitude!, longitude!, radius!)
      } catch (e) {
        return res.status(400).json(e)
      }
    }

    const parsedLimit = limit ?? 10

    const artworksFeed = await swipeService.getSwipeArtworkFeed({
      userId: req.user.id,
      limit: parsedLimit,
      zone: zone,
      medium,
    })

    return res.json(artworksFeed)
  }
)

export function isAllDefined(...attributes: (string | undefined)[]): boolean {
  return attributes.filter(a => a == undefined).length == 0
}

interface GetSwipeArtworkDto {
  limit?: number
  longitude: string
  latitude: string
  radius: string
  medium: MediumValues[]
}
