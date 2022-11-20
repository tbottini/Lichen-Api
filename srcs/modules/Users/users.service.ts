import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { AccountMailer } from './AccountMail.service'
const jwt = require('../../modules/jwt')

export class UserService {
  accountMailer: AccountMailer

  constructor() {
    this.accountMailer = new AccountMailer()

    this.accountMailer.resetPassword('thomasbottini@protonmail.com', {
      token: 'ouioui',
      id: 0,
      firstname: 'thomas',
      lastname: 'bottini',
      email: 'thomasbottini@protonmail.com',
    })
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
}
