import { Position } from '../../commons/class/Position.class'
import { prisma } from '../../commons/prisma/prisma'
import { IAccountMailer } from './AccountMail.service'
import { UsersRepository } from '../repositories/Users.repository'
import { UserPublicDto } from '../repositories/Users.scope'
import { MediumValues } from '../../medium/mediumEnum'
import { passwordUtils } from '../../modules/password'
import { sortSearchedElements } from '../../modules/research'
import { createJwt } from '../../modules/jwt'
import { ImageSrc } from '../../modules/images/ImageDomainBroadcaster'

const userRepository = new UsersRepository()

export class UserService {
  accountMailer: IAccountMailer

  constructor(accountMailer: IAccountMailer) {
    this.accountMailer = accountMailer
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
