import { Position } from '../../commons/class/Position.class'
import { prisma } from '../../commons/prisma/prisma'
import { IAccountMailer } from './AccountMail.service'
import { UsersRepository } from '../repositories/Users.repository'
import { UserPublicDto } from '../repositories/Users.scope'
import { MediumValues } from '../../medium/mediumEnum'
const jwt = require('../../modules/jwt')

const userRepository = new UsersRepository()

export class UserService {
  accountMailer: IAccountMailer

  constructor(accountMailer: IAccountMailer) {
    this.accountMailer = accountMailer
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
      token: jwt.create(user),
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

  async updateUser(userId: number, updateUser: UpdateUser) {
    const result = await userRepository.updateRaw(userId, updateUser)
    return result
  }
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
