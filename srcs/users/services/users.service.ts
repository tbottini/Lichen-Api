import { PrismaClient } from '@prisma/client'
import { Position } from '../../commons/class/Position.class'
const prisma = new PrismaClient()
import { AccountMailer } from './AccountMail.service'
import { UsersRepository } from '../repositories/Users.repository'
import {
  UserPublicDto,
  UserRepositoryPublic,
} from '../repositories/Users.scope'
const jwt = require('../../modules/jwt')

const userRepository = new UsersRepository()

export class UserService {
  accountMailer: AccountMailer

  constructor() {
    this.accountMailer = new AccountMailer()
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
}

interface UpdateDefaultFilterPosition {
  userId: number
  newPosition: Position
}
