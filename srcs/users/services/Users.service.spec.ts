require('../../commons/env')
import { createUser } from '../../../tests/fixture/user.fixture'
import { clearDatabase } from '../../../tests/helpers/clearDatabase.helper'
import { UserService } from './users.service'

const accountMailerMock = {
  resetPassword: jest.fn(),
}

describe('Users Service', () => {
  const userService = new UserService(accountMailerMock)

  beforeAll(async () => {
    await clearDatabase()
  })

  describe('Forgot password', () => {
    it('should send an email when forgot password', async () => {
      await createUser({
        email: 'arnaudbottini@reseau-lichen.fr',
      })
      await createUser({
        email: 'thomasbottini@reseau-lichen.fr',
      })

      await userService.forgotPassword('thomasbottini@reseau-lichen.fr')

      expect(accountMailerMock.resetPassword).toHaveBeenCalledWith(
        'thomasbottini@reseau-lichen.fr',
        {
          id: expect.anything(),
          firstname: null,
          lastname: null,
          email: 'thomasbottini@reseau-lichen.fr',
          token: expect.anything(),
        }
      )
    })
  })
})
