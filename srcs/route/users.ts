import { PrismaClient } from '@prisma/client'
import { UserService } from '../modules/Users/users.service'
const prisma = new PrismaClient()
const { Router } = require('express')
const regex = require('../modules/regexUtils')
import * as jwt from '../modules/jwt'
const EnumAttr = require('../attr/enum'),
  EmailAttr = require('../attr/email'),
  { BoolAttr } = require('../attr/boolean'),
  PasswordAttr = require('../attr/password')
const passwordUtils = require('../modules/password')
const fileMiddleware = require('../modules/middleware-file')
const {
  parserMiddleware,
  QueryString,
  QueryInt,
  QueryEnum,
  parserQuery,
} = require('../modules/middleware-parser')
const { researchSort } = require('../modules/research')
const { mediumDict } = require('../controller/mediumEnum')
const logger = require('../modules/logger')

const querySearch = {
  name: new QueryString(),
}
const querySearchGallery = {
  longMin: new QueryInt({}),
  longMax: new QueryInt({}),
  lagMin: new QueryInt({}),
  lagMax: new QueryInt({}),
  medium: new QueryEnum(mediumDict, { isList: true }),
}

const publicScope = {
  email: false,
  password: false,
  firstname: true,
  pseudo: true,
  lastname: true,
  id: true,
  websiteUrl: true,
  description: true,
  src: true,
  role: true,
  medium: true,
  gallery: true,
  bio: true,
  geoReferenced: true,
}

const privateScope = {
  ...publicScope,
  email: true,
}

const scope = {
  public: publicScope,
  private: privateScope,
}

const router = new Router()

const userService = new UserService()

router

  /**
   * @route POST /users/register
   * @group Users - Opérations about users
   * @consumes application/x-www-form-urlencoded
   * @param {string} email.query
   * @param {string} firstname.query
   * @param {string} lastname.query
   * @param {string} pseudo.query
   * @param {string} websiteUrl.query
   * @param {string} description.query
   * @param {string} password.query
   * @param {enum} medium.query
   * @returns {object} 200 - the created user
   */
  .post('/register', async (req, res) => {
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
    } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'parameters missing' })

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
    if (!passwordCorrect || !emailCorrect)
      return res.status(400).json({ error: 'email or password bad format' })

    const passwordHash = await passwordUtils.hash(password)

    const mediumAttr = new EnumAttr(mediumDict, medium)
    if (mediumAttr.error)
      return res.status(400).json({ error: 'bad format for enum attr' })

    const u = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstname,
        lastname,
        pseudo,
        websiteUrl,
        description,
        bio,
        medium: mediumAttr.value,
        geoReferenced: false,
      },
    })

    const token = jwt.create(u)

    res.json({ token })
  })

  /**
   * @route POST /users/login
   * @group Users
   * @param {string} name.query.required - emails names who'll be search
   * @param {string} name.query.required - password names who'll be search
   * @returns {object} 200 - The user profile
   */
  .post('/login', async (req, res) => {
    const { email, password } = req.body
    logger.debug('login', req.body)
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

    logger.debug(passwordIdem)

    if (!passwordIdem)
      return res.status(400).json({ error: 'bad password provide' })

    return res.json({ token: jwt.create(user) })
  })

  /**
   * @route GET /users/self
   * @group Users
   * @returns {object} 200 - An Object corresponding to the user profile of  the client
   */
  .get('/self', jwt.middleware, async (req, res) => {
    logger.debug(req.user)

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
                select: scope.public,
              },
            },
          },
          following: {
            select: {
              userFollowed: {
                select: scope.public,
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
        logger.debug('find')
        return res.json(reinjectUserFollow(self))
      })
      .catch(err => {
        logger.debug('err', err)
        return res.status(400).json({ error: 'No user found with this token' })
      })
  })

  /**
   * @route GET /users/
   * @group Users
   * @param {string} name.query.required - users names who'll be search according to the firstname and the lastname of users
   * @returns {object} 200 - An array of users search depending on there names
   */
  .get('/', parserQuery(querySearch), async (req, res) => {
    const { name } = req.query

    const whereSection = {}
    console.log('test log')
    logger.debug('hello world')
    logger.debug({ ceci: "n'est pas un exercie" })
    logger.debug('houla', 'houla')
    logger.debug(JSON.stringify({ ceci: 'cela' }))
    logger.debug('', name)
    let multiFiltername
    if (name != undefined && name != '') {
      multiFiltername = name
        .split(' ')
        .filter(a => a)
        .map(filter => [
          { firstname: { contains: filter, mode: 'insensitive' } },
          { lastname: { contains: filter, mode: 'insensitive' } },
          { pseudo: { contains: filter, mode: 'insensitive' } },
        ])
        .reduce((a, b) => a.concat(b), [])

      whereSection['OR'] = multiFiltername
    }

    logger.debug(multiFiltername)

    let results = await prisma.user.findMany({
      where: whereSection,
      select: {
        ...scope.public,
      },
    })

    if (name) {
      results = researchSort(
        results,
        name,
        item => item.firstname + ' ' + item.lastname
      )
      logger.debug(results)
    }

    return res.json(results)
  })

  /**
   * Select Profiles depending to there positions
   * this path is dedicated to the use of google map or other mapping solution using a rectangular area
   * @route GET /users/gallery
   * @group Users
   * @param {float} lagMin.query - minimal lagitude
   * @param {float} lagMax.query - maximal lagitude
   * @param {float} longMin.query - minimal longitude
   * @param {float} longMax.query - maximal longitude
   * @param {enum} medium.query - user's medium
   * @returns {object} 200 - The user profile with his gallery information
   */
  .get('/gallery', parserQuery(querySearchGallery), async (req, res) => {
    //! todo add a security if they are an inconsistent parameter
    // ex : longitude / lagitude / radius
    const { lagMin, lagMax, longMin, longMax, medium } = req.query

    logger.debug('MEDIUM', medium)

    var result = await prisma.user.findMany({
      where: {
        geoReferenced: true,
        gallery: {
          longitude: {
            lte: longMax,
            gte: longMin,
          },
          latitude: {
            lte: lagMax,
            gte: lagMin,
          },
        },
        medium:
          medium == undefined || medium == ''
            ? undefined
            : {
                in: medium,
              },
      },
      select: {
        ...scope.public,
      },
    })

    return res.json(result)
  })

  /**
   * Search for a profile according to his id
   * @route GET /users/:id
   * @group Users
   * @param {integer} id.path.required the user's id
   * @security JWT
   * @returns {object} 200 - The user profile
   */
  .get('/:id', parserMiddleware({ id: 'int' }), async (req, res) => {
    prisma.user
      .findUnique({
        where: {
          id: req.params.id,
        },
        select: {
          ...scope.public,

          projects: {
            orderBy: { index: 'asc' },
            include: {
              artworks: { orderBy: { index: 'asc' } },
            },
          },
          events: { orderBy: { index: 'asc' } },
          followed: {
            select: {
              userFollowing: { select: scope.public },
            },
          },
          following: {
            select: {
              userFollowed: { select: scope.public },
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
      .catch(err => {
        return res.status(400).json({ error: 'No user found with this token' })
      })
  })

  /**
   * Delete your self profile
   * @route DELETE /users/self
   * @group Users
   * @returns {object} 200 - The user profile
   * @security JWT
   */
  .delete('/self', jwt.middleware, async (req, res) => {
    logger.debug('delete users ' + req.user.id + '...')
    var result = await prisma.user.delete({
      where: {
        id: req.user.id,
      },
      select: scope.private,
    })
    return res.json(result)
  })

  /**
   * Update your  profile
   * @route PUT /users/
   * @group Users
   * @consumes application/x-www-form-urlencoded application/json
   * @param {string} email.query
   * @param {string} password.query
   * @param {string} firstname.query - firstname of user
   * @param {string} lastname.query
   * @param {string} bio.query
   * @param {string} pseudo.query
   * @param {string} description.query
   * @param {string} websiteUrl.query
   * @param {file} file.query
   * @param {enum} medium.query
   * @param {boolean} geoReferenced.query
   * @returns {object} 200 - The user profile
   * @security JWT
   */
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
      geoReferenced,
    } = req.body

    const src = req.file ? req.file.filename : null

    const mediumAttr = new EnumAttr(mediumDict, medium)
    if (mediumAttr.error)
      return res.status(400).json({ error: 'bad format for enum attr' })

    const emailWrapper = new EmailAttr()
    await emailWrapper.check(email)
    if (emailWrapper.error)
      return res.status(400).json({ error: emailWrapper.errorMsg })

    const passwordWrapper = new PasswordAttr(password)
    if (passwordWrapper.error)
      return res.status(400).json({ error: passwordWrapper.errorMsg })

    const passwordValue = await passwordWrapper.getValue()
    logger.debug('password', passwordValue, password)

    const geoReferencedWrapper = new BoolAttr(geoReferenced)
    if (geoReferencedWrapper.error)
      return res
        .status(400)
        .json({ error: 'geoReferenced : ' + geoReferenced.error })

    try {
      const result = await prisma.user.update({
        where: {
          id: req.user.id,
        },
        select: scope.public,
        data: {
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
          geoReferenced: geoReferencedWrapper.value,
        },
      })
      return res.json(result)
    } catch (err) {
      return res.status(400).json({ error: "this token isn't valid" })
    }
  })

  // --- Users follow part ---
  /**
   * @route POST /users/:id/follow
   * @group Users
   * @param {integer} id.path.required - user's to follow
   * @security jwt
   * @returns {object} 200 - the user's follow
   */
  .post(
    '/:id/follow',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      var result = await prisma.userFollow.findFirst({
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
          userFollowed: { select: scope.public },
          userFollowing: { select: scope.public },
        },
      })
      return res.json(result)
    }
  )

  /**
   * @route DELETE /users/:id/follow
   * @group Users
   * @param {integer} id.path.required - user's to unfollow
   * @security jwt
   * @returns {object} 200 - the user's unfollow
   */
  //! you must precise the id of user and not the id of relation
  .delete(
    '/:id/follow',
    [jwt.middleware, parserMiddleware({ id: 'int' })],
    async (req, res) => {
      var result = await prisma.userFollow.deleteMany({
        where: {
          userFollowingId: req.user.id,
          userFollowedId: req.params.id,
        },
      })
      return res.json(result)
    }
  )

  /**
   * Will delete your own gallery
   * @route PUT /users/self/gallery
   * @group Users
   * @security jwt
   * @param {float} longitude.query
   * @param {float} latitute.query
   * @returns {object} 200 - the user's unfollow
   */
  .put('/self/gallery', [jwt.middleware], async (req, res) => {
    //change the location of the gallery of user
    var { longitude, latitude } = req.body

    logger.debug(req.body)

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
        ...scope.public,
      },
    })

    return res.json(result)
  })

  /**
   * will delete your own gallery
   * @route DELETE /users/self/gallery
   * @group Users
   * @security jwt
   * @returns {object} 200 - the user's unfollow
   */
  .delete('/self/gallery', [jwt.middleware], async (req, res) => {
    //delete the gallery of users

    const result = await prisma.gallery.deleteMany({
      where: {
        user: {
          id: req.user.id,
        },
      },
    })

    return res.json(result)
  })

  /**
   * @route POST /users/password-forgot
   * @group Users
   * @param {string} email.query.required
   * @returns {object} 200 confirmation of password changed
   */
  .post('/password-forgot', async (req, res) => {
    // we send an email with the token
    const { email } = req.body

    if (!email) return res.status(400).json({ error: 'no email provided' })

    const result = await userService.forgotPassword(email)
    if (result?.error) {
      return res.status(400).json(result.error)
    }
    res.json({ msg: 'an email was sent to your email address' })
  })

function reinjectUserFollow(user) {
  logger.debug(user)
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
      logger.debug(like)
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
  return user
}
module.exports = { router, scope }
