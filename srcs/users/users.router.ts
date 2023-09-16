import { prisma } from '../commons/prisma/prisma'
const { Router } = require('express')
const regex = require('../modules/regexUtils')
import * as jwt from '../modules/jwt'
import {
  parserMiddleware,
  QueryString,
  QueryEnum,
  parserQuery,
} from '../commons/parsers/QueryParser'
import { mediumEnum } from '../medium/mediumEnum'
import { GalleryService } from './services/Gallery.service'
import {
  privateScope,
  publicScope,
  UserFullPublicDto,
  UserPublicDto,
} from './repositories/Users.scope'
import { QueryFloat } from '../commons/parsers/QueryParser/QueryFloat.parser'
import { EmailAttr } from '../attr/Email.attribute'
import { parsePosition } from '../commons/parsers/Position.parser'
import { UserRequestWithBody } from '../commons/interfaces/Request.types'
import { tryCompleteRequest } from '../commons/router/fallbackError'
import { UserRepositoryPublic, IncludesUsers } from './repositories/Users.scope'
import { GetSelfDto } from './dto/GetSelf.dto'
import { logger } from '../modules/logger'
import { logBody } from '../modules/middleware-logger'
import { parseIfDefined } from '../commons/parsers/parser.common'
import { getFilenameFromFile } from '../commons/parsers/FileParser'
import { passwordUtils } from '../modules/password'
import { Dependencies } from '../dependencies'
const EnumAttr = require('../attr/enum')
const PasswordAttr = require('../attr/password')
const fileMiddleware = require('../modules/middleware-file')

const querySearch = {
  name: new QueryString(),
}

export const userScope = {
  public: publicScope,
  private: privateScope,
}

const dependencies = new Dependencies()

const userService = dependencies.getUserService()
const galleryService = new GalleryService()

interface Response<T> {
  status: (code: number) => this
  json: (arg: T | { error: string }) => void
}

export const userRouter = new Router()
  .use(logBody)
  .post('/register', async (req, res: Response<{ token: string }>) => {
    const {
      email,
      password,
      firstname,
      lastname,
      pseudo,
      description,
      websiteUrl,
      bio,
      medium,
      position,
    } = req.body

    await tryCompleteRequest(res, async () => {
      const parsedPosition = parseIfDefined(position, () =>
        parsePosition(position)
      )

      if (!email || !password) {
        return res.status(400).json({ error: 'parameters missing' })
      }

      const users = await prisma.user.findMany({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      })

      if (users.length > 0)
        return res.status(400).json({ error: 'email is taken' })

      const passwordCorrect = passwordUtils.check(password)
      const emailCorrect = regex.email.test(email)
      if (!passwordCorrect || !emailCorrect) {
        return res.status(400).json({ error: 'email or password bad format' })
      }
      const mediumAttr = new EnumAttr(mediumEnum, medium)
      if (mediumAttr.error)
        return res.status(400).json({ error: 'bad format for enum attr' })

      const token = await userService.createUser({
        email,
        password,
        firstname,
        lastname,
        pseudo,
        websiteUrl,
        description,
        bio,
        medium: mediumAttr.value,
        position: parsedPosition,
      })

      res.json({ token })
    })
  })
  .post('/login', async (req, res: Response<{ token: string }>) => {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'parameters missing' })
    const users = await prisma.user.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    })

    if (users.length > 2) {
      console.warn(
        'They are multiple account with the same email, probaly with uppercase'
      )
    }
    if (users.length <= 0)
      return res.status(404).json({ error: 'user not found' })
    // we arbitrarily take the first one
    const user = users[0]
    const passwordIdem = await passwordUtils.compare(password, user.password)

    if (!passwordIdem)
      return res.status(400).json({ error: 'bad password provide' })

    return res.json({ token: jwt.create(user) })
  })
  .get('/self', jwt.middleware, async (req, res: Response<GetSelfDto>) => {
    prisma.user
      .findUnique({
        where: {
          id: req.user.id,
        },
        select: {
          ...privateScope,
          followed: {
            select: {
              userFollowing: {
                select: userScope.public,
              },
            },
          },
          following: {
            select: {
              userFollowed: {
                select: userScope.public,
              },
            },
          },
          projects: {
            orderBy: {
              index: 'asc',
            },
            include: {
              artworks: {
                orderBy: { index: 'asc' },
              },
            },
          },
          events: {
            orderBy: {
              index: 'asc',
            },
          },
          likes: {
            include: {
              artwork: true,
            },
          },
          eventFollow: {
            include: {
              event: true,
            },
          },
        },
      })
      .then(self => {
        return res.json(reinjectUserFollow<{ email: string }>(self))
      })
      .catch(err => {
        logger.debug('err', err)
        return res.status(400).json({ error: 'No user found with this token' })
      })
  })

  .get('/', parserQuery(querySearch), async (req, res) => {
    const { name } = req.query

    const results = await userService.searchUsers(name)

    return res.json(results)
  })
  .get(
    '/gallery',
    parserQuery({
      longMin: new QueryFloat({}),
      longMax: new QueryFloat({}),
      lagMin: new QueryFloat({}),
      lagMax: new QueryFloat({}),
      medium: new QueryEnum(mediumEnum, { isList: true }),
    }),
    async (req, res) => {
      //! todo add a security if they are an inconsistent parameter
      const { lagMin, lagMax, longMin, longMax, medium } = req.query

      const result = await galleryService.getGalleries(
        lagMin && lagMax && longMin && longMax
          ? {
              latitudeMax: lagMax,
              latitudeMin: lagMin,
              longitudeMax: longMax,
              longitudeMin: longMin,
            }
          : undefined,
        medium == undefined || medium == '' ? undefined : medium
      )

      return res.json(result)
    }
  )
  .get('/:id', parserMiddleware({ id: 'int' }), async (req, res) => {
    prisma.user
      .findUnique({
        where: {
          id: req.params.id,
        },
        select: {
          ...userScope.public,

          projects: {
            orderBy: { index: 'asc' },
            include: {
              artworks: { orderBy: { index: 'asc' } },
            },
          },
          events: { orderBy: { index: 'asc' } },
          followed: {
            select: {
              userFollowing: { select: userScope.public },
            },
          },
          following: {
            select: {
              userFollowed: { select: userScope.public },
            },
          },
          likes: {
            include: {
              artwork: true,
            },
          },
          eventFollow: true,
        },
      })
      .then(result => {
        return res.json(reinjectUserFollow(result))
      })
      .catch(() => {
        return res.status(400).json({ error: 'No user found with this token' })
      })
  })
  .delete('/self', jwt.middleware, async (req, res) => {
    logger.debug('delete users ' + req.user.id + '...')
    const result = await prisma.user.delete({
      where: {
        id: req.user.id,
      },
      select: userScope.private,
    })
    return res.json(result)
  })
  .put('/', [jwt.middleware, fileMiddleware()], async (req, res) => {
    const {
      firstname,
      lastname,
      pseudo,
      description,
      websiteUrl,
      medium,
      email,
      bio,
      password,
    } = req.body

    const src = parseIfDefined(req.file, getFilenameFromFile)

    const mediumAttr = new EnumAttr(mediumEnum, medium)
    if (mediumAttr.error) {
      return res.status(400).json({ error: 'bad format for enum attr' })
    }

    const emailWrapper = new EmailAttr()
    await emailWrapper.check(email)
    if (emailWrapper.error) {
      return res.status(400).json({ error: emailWrapper.errorMsg })
    }
    const passwordWrapper = new PasswordAttr(password)
    if (passwordWrapper.error) {
      return res.status(400).json({ error: passwordWrapper.errorMsg })
    }

    // todo -> move to user service
    const passwordValue = await passwordWrapper.getValue()

    tryCompleteRequest(res, async () => {
      const result = await userService.updateUser(req.user.id, {
        firstname,
        lastname,
        pseudo,
        description,
        src,
        websiteUrl,
        bio,
        medium: mediumAttr.value,
        email: emailWrapper.value,
        password: passwordValue,
      })

      return res.json(result)
    })
  })
  .put(
    '/new-position',
    [...jwt.middleware],
    async (
      req: UserRequestWithBody<{
        position: { longitude: string; latitude: string }
      }>,
      res: Response<UserPublicDto>
    ) => {
      const { position } = req.body

      tryCompleteRequest(res, async () => {
        const parsedPosition = parsePosition(position)

        const result = await userService.updateUserPosition({
          userId: req.user.id,
          newPosition: parsedPosition,
        })

        return res.status(200).json(result)
      })
    }
  )
  .post(
    '/:id/follow',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      let result = await prisma.userFollow.findFirst({
        where: {
          userFollowingId: req.user.id,
          userFollowedId: req.params.id,
        },
      })
      if (result) return res.json({ msg: 'you already follow this user' })

      result = await prisma.userFollow.create({
        data: {
          userFollowing: {
            connect: {
              id: req.user.id,
            },
          },
          userFollowed: {
            connect: {
              id: req.params.id,
            },
          },
        },
        include: {
          userFollowed: { select: userScope.public },
          userFollowing: { select: userScope.public },
        },
      })
      return res.json(result)
    }
  )

  //! you must precise the id of user and not the id of relation
  .delete(
    '/:id/follow',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      const result = await prisma.userFollow.deleteMany({
        where: {
          userFollowingId: req.user.id,
          userFollowedId: req.params.id,
        },
      })
      return res.json(result)
    }
  )
  .put('/self/gallery', [jwt.middleware], async (req, res) => {
    //change the location of the gallery of user
    let { longitude, latitude } = req.body

    console.log(req.body)
    if (!longitude || !latitude)
      return res.status(400).json({ error: 'params missing' })

    longitude = parseFloat(longitude)
    latitude = parseFloat(latitude)
    if (isNaN(longitude))
      return res.status(400).json({ error: 'bad format for longitude' })
    if (isNaN(latitude))
      return res.status(400).json({ error: 'bad foramt for latitude' })

    //on check si l'utilisateur n'a pas encore de gallery
    const result = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        gallery: {
          upsert: {
            create: {
              latitude: latitude,
              longitude: longitude,
            },
            update: {
              latitude: latitude,
              longitude: longitude,
            },
          },
        },
      },
      select: {
        ...userScope.public,
      },
    })

    return res.json(result)
  })
  .delete('/self/gallery', [jwt.middleware], async (req, res) => {
    const result = await prisma.gallery.deleteMany({
      where: {
        user: {
          id: req.user.id,
        },
      },
    })

    return res.json(result)
  })
  .post('/password-forgot', async (req, res) => {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'no email provided' })
    }

    const result = await userService.forgotPassword(email)
    if (result?.error) {
      return res.status(400).json(result.error)
    }
    res.json({ msg: 'an email was sent to your email address' })
  })

function reinjectUserFollow<AdditionalUserData>(
  user: (UserRepositoryPublic & IncludesUsers & AdditionalUserData) | null
): UserFullPublicDto & AdditionalUserData {
  if (!user) {
    throw new Error('')
  }
  user.following = user.following.map(follow => {
    //parmis les personnes que l'on suit
    follow.userFollowed.followAt = follow.creation
    return follow.userFollowed
  })

  user.followed = user.followed.map(follow => {
    follow.userFollowing.followAt = follow.creation
    return follow.userFollowing
  })

  user.likes = user.likes
    .filter(like => like.artwork != null)
    .map(like => {
      like.artwork.likeAt = like.creation
      return like.artwork
    })

  user.eventFollow = user.eventFollow
    .map(eventFollow => {
      //! error e.event can be null
      //todo error: when event is delete / the eventsFollow attribute may doesnt remove the event link
      if (eventFollow.event == null) return null
      eventFollow.event.followAt = eventFollow.creation
      return eventFollow.event
    })
    .filter(eventFollow => eventFollow != null)

  return {
    ...user,
    position:
      user.positionLatitude && user.positionLongitude
        ? {
            latitude: user.positionLatitude,
            longitude: user.positionLongitude,
          }
        : null,
  }
}
