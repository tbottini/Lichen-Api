require('../../commons/env')
import { createUser } from '../../../tests/fixture/user.fixture'
import { clearDatabase } from '../../../tests/helpers/clearDatabase.helper'
import {
  PseudoIsDefinedWithPersonalIdentity,
  UserService,
} from './users.service'

const accountMailerMock = {
  resetPassword: jest.fn(),
}

describe('Users Service', () => {
  const userService = new UserService(accountMailerMock)

  beforeEach(async () => {
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

  describe('UpdateUser', () => {
    it('should throw an error when trying to set a pseudo to an user that have name setted', async () => {
      const user = await createUser({
        email: 'arnaudbottini@reseau-lichen.fr',
        firstname: 'thomas',
        lastname: 'test',
      })

      await expect(
        userService.updateUser(user.id, {
          pseudo: 'test',
        })
      ).rejects.toThrow(new PseudoIsDefinedWithPersonalIdentity(user.id))
    })

    it('should throw an error when trying to set a name to an user that have pseudo setted', async () => {
      const user = await createUser({
        email: 'arnaudbottini@reseau-lichen.fr',
        pseudo: 'test',
      })

      await expect(
        userService.updateUser(user.id, {
          firstname: 'thomas',
        })
      ).rejects.toThrow(new PseudoIsDefinedWithPersonalIdentity(user.id))
    })

    it("should consider '' as equivalent to null or undefined", async () => {
      const user = await createUser({
        email: 'arnaudbottini@reseau-lichen.fr',
        pseudo: '',
      })

      await userService.updateUser(user.id, {
        firstname: 'thomas',
      })
    })
  })
})
