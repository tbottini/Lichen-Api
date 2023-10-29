const { Router } = require('express')
import { User } from '@prisma/client'
import { Dependencies } from '../../dependencies'
import * as jwt from '../../modules/jwt'
import { ConnectionService } from './connection.service'

const service = new ConnectionService()
const userService = new Dependencies().getUserService()

export const connectionRouter = new Router().post(
  '/:toUserId',
  [jwt.middleware],
  async (req, res) => {
    try {
      const toUser = await userService.getUser({
        id: parseInt(req.params.toUserId),
      })
      if (!toUser) {
        return res.status(404).end('not found')
      }

      const fromUser = await userService.getUser({
        id: parseInt(req.user.id),
      })
      if (!fromUser) {
        return res.status(404).end('not found')
      }
      console.log('from user', fromUser)

      const fromName = fromUser.pseudo
        ? fromUser.pseudo
        : (fromUser.firstname ?? '') + ' ' + (fromUser.lastname ?? '')

      const toName = toUser.pseudo
        ? toUser.pseudo
        : (toUser.firstname ?? '') + ' ' + (toUser.lastname ?? '')

      const demand = await service.sendConnectionRequestTo({
        fromEmail: fromUser.email,
        to: toUser.email,
        requestContent: req.body.requestContent,
        fromName,
        toName,
      })

      res.json(demand)
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message)
        res.status(400).end(e.message)
      }
    }
  }
)
