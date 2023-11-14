import { Position } from '../../commons/class/Position.class'
import { prisma } from '../../commons/prisma/prisma'
import { IAccountMailer } from './AccountMail.service'
import { UsersRepository } from '../repositories/Users.repository'
import {
  IncludesUsers,
  UserFullPublicDto,
  UserPublicDto,
  UserRepositoryPublic,
  privateScope,
  publicScope,
} from '../repositories/Users.scope'
import { MediumValues } from '../../medium/mediumEnum'
import { passwordUtils } from '../../modules/password'
import { sortSearchedElements } from '../../modules/research'
import { createJwt } from '../../modules/jwt'
import { ImageSrc } from '../../modules/images/ImageDomainBroadcaster'

const userRepository = new UsersRepository()

export const userScope = {
  public: publicScope,
  private: privateScope,
}

export class UserService {
  accountMailer: IAccountMailer

  constructor(accountMailer: IAccountMailer) {
    this.accountMailer = accountMailer
  }

  getUser(filter: { id: number }) {
    return prisma.user.findFirst({
      where: {
        id: filter.id,
      },
    })
  }

  async getProfileUser(userId: number) {
    console.log('user', userId)
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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

    if (!user) {
      throw new Error(`Cannot found user with id : ${userId}`)
    }

    return reinjectUserFollow(user)
  }

  async createUser(dtoCreate: CreateUser): Promise<string> {
    const passwordHash = await passwordUtils.hash(dtoCreate.password)

    if (isNameDefined(dtoCreate) && isNotEmpty(dtoCreate.pseudo)) {
      throw new CanCreateUserWithPseudoAndNameError()
    }

    const createdUser = await userRepository.create({
      ...dtoCreate,
      password: passwordHash,
    })

    const token = createJwt(createdUser)

    return token
  }

  async forgotPassword(email: string): Promise<{ error?: string } | void> {
    const users = await prisma.user.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
      },
    })

    if (users.length <= 0) {
      return { error: "email doesn't exist" }
    }

    const user = users[0]

    this.accountMailer.resetPassword(email, {
      ...user,
      token: createJwt(user),
    })
  }

  async updateUserPosition(
    updatePosition: UpdateDefaultFilterPosition
  ): Promise<UserPublicDto> {
    const updatedUser = await userRepository.update(updatePosition.userId, {
      userPosition: updatePosition.newPosition,
    })

    return updatedUser
  }

  async updateUser(
    userId: number,
    updateUser: UpdateUser
  ): Promise<UserPublicDto> {
    const foundUser = await userRepository.getUserById(userId)

    if (isNameDefined(foundUser) && isNotEmpty(updateUser.pseudo)) {
      throw new PseudoIsDefinedWithPersonalIdentity(userId)
    } else if (isNameDefined(updateUser) && isNotEmpty(foundUser.pseudo)) {
      throw new PseudoIsDefinedWithPersonalIdentity(userId)
    }

    const result = await userRepository.updateRaw(userId, updateUser)

    return result
  }

  async searchUsers(name?: string): Promise<UserPublicDto[]> {
    const whereSection = {}

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

    const foundUsers = await userRepository.findMany(whereSection)

    if (!name) {
      return foundUsers
    }

    const filteredUsers = sortSearchedElements(foundUsers, name, item =>
      item.pseudo != null && item.pseudo != ''
        ? item.pseudo
        : item.firstname ?? '' + ' ' + item.lastname ?? ''
    )

    return filteredUsers
  }

  async getImages(): Promise<ImageSrc[]> {
    const users = await prisma.user.findMany({
      select: {
        src: true,
      },
    })
    return users.filter(u => u.src) as ImageSrc[]
  }

  async deleteAccount(userId: number): Promise<void> {
    await prisma.gallery.delete({
      where: {
        userId: userId,
      },
    })

    const projectsId = await prisma.project.findMany({
      select: {
        id: true,
      },
      where: { authorId: userId },
    })
    const artworksId = await prisma.artwork.findMany({
      select: {
        id: true,
      },
      where: { projectId: { in: projectsId.map(p => p.id) } },
    })

    await prisma.artworkLikes.deleteMany({
      where: {
        artworkId: {
          in: artworksId.map(a => a.id),
        },
      },
    })

    await prisma.artwork.deleteMany({
      where: {
        id: {
          in: artworksId.map(a => a.id),
        },
      },
    })

    await prisma.project.deleteMany({
      where: {
        authorId: userId,
      },
    })

    const events = await prisma.event.findMany({
      where: {
        organisatorId: userId,
      },
    })
    await prisma.eventFollow.deleteMany({
      where: {
        eventId: {
          in: events.map(e => e.id),
        },
      },
    })
    await prisma.event.deleteMany({
      where: {
        id: {
          in: events.map(e => e.id),
        },
      },
    })

    await prisma.user.delete({
      where: {
        id: userId,
      },
    })
  }
}

function isNameDefined(user: {
  firstname?: string | null
  lastname?: string | null
}) {
  return isNotEmpty(user.firstname) || isNotEmpty(user.lastname)
}

function isNotEmpty(str?: string | null): boolean {
  return str != null && str != ''
}

interface UpdateDefaultFilterPosition {
  userId: number
  newPosition: Position
}

type UpdateUser = Partial<{
  firstname: string
  lastname: string
  pseudo: string
  description: string
  src: string
  websiteUrl: string
  bio: string
  medium: MediumValues
  email: string
  password: string
  isVirtual: boolean
}>

export type CreateUser = {
  email: string
  password: string
  firstname?: string
  lastname?: string
  pseudo?: string
  websiteUrl?: string
  description?: string
  bio?: string
  medium?: MediumValues
  position?: Position
}

export class PseudoIsDefinedWithPersonalIdentity extends Error {
  constructor(userId: number) {
    super(
      `For user with id ${userId} you can't set pseudo with a non empty firstname or lastname`
    )
  }
}

export class CanCreateUserWithPseudoAndNameError extends Error {
  constructor() {
    super(`Trying to create user with pseudo and firstname or lastname`)
  }
}

export function reinjectUserFollow<AdditionalUserData>(
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
