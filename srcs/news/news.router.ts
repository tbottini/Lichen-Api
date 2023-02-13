const { Router } = require('express')
import * as jwt from '../modules/jwt'

import {
  parserQuery,
  QueryDate,
  QueryEnum,
  QueryInt,
} from '../commons/parsers/QueryParser'
import { NewsService } from './News.service'
import { CircularZone } from '../attr/CircularZone'

const mediumSearch = {
  artwork: 'artwork', //toutes les notif sur les nouveaux artwork
  event: 'event', //toutes les notif sur les nouveaux évènements
  like: 'like', //toutes les notif sur les nouveaux évènements (on a like une de vos oeuvres )
  follow: 'follow', // toutes les notif sur les follows (on vous suit, un ami à suivis quelqu'un)
}

const querySearch = {
  anchor: new QueryDate(),
  duration: new QueryInt({ max: 300 }), // max 123 days / 3 month
  limit: new QueryInt({ max: 100 }),
  medium: new QueryEnum(mediumSearch),
}

const newsService = new NewsService()

export const newsRouter = new Router().get(
  '/',
  [jwt.middleware, parserQuery(querySearch)],
  async (req, res) => {
    //DateAnchor la date de départ pour à partir de laquel on récupère les données
    //duration durée à partir de la date anchor où on récupère les news (en secondes)
    let { anchor, duration } = req.query
    const { longitude, latitude, radius } = req.query

    const zone = CircularZone.parse(latitude, longitude, radius)

    if (!anchor) {
      anchor = new Date()
    }
    if (!duration) {
      duration = 30
    }

    const endDate = new Date(anchor.getTime())
    endDate.setDate(anchor.getDate() - duration)
    anchor.setDate(anchor.getDate() + 1)

    return res.json(
      await newsService.getNewsForUser({
        userId: req.user.id,
        zone: zone,
        period: {
          begin: endDate,
          end: anchor,
        },
      })
    )
  }
)
