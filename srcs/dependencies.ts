import { AccountMailer } from './users/services/AccountMail.service'
import { UserService } from './users/services/Users.service'

export class Dependencies {
  getUserService(): UserService {
    const accountMailer = new AccountMailer()
    const userService = new UserService(accountMailer)
    return userService
  }
}
