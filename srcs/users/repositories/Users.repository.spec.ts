require('../../commons/env')
import { createGalleryForUser } from '../../../tests/fixture/gallery.fixture'
import { createUser } from '../../../tests/fixture/user.fixture'
import { clearDatabase } from '../../../tests/helpers/clearDatabase.helper'
import { UsersRepository } from './Users.repository'

describe('UserRepository', () => {
  const userRepository = new UsersRepository()

  beforeEach(async () => {
    await clearDatabase()
  })

  describe('findMany', () => {
    it('should find many users and parsed them correctly', async () => {
      await createUser({
        email: 'test@gmail.com',
      })
      const user = await createUser({
        email: 'test2@gmail.com',
      })
      await createGalleryForUser(user.id, {
        latitude: 30,
        longitude: 40,
      })

      const users = await userRepository.findMany({})

      expect(users).toHaveLength(2)
    })
  })
})
