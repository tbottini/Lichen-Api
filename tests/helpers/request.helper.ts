import { mediumEnum } from '../../srcs/medium/mediumEnum'
import { addUser } from './user.test.helper'

export const configureAddToken = token => app =>
  app.set('Authorization', 'bearer ' + token)

export function createUserWithProjects() {
  return addUser({
    email: 'test@test.com',
    firstname: 'test',
    lastname: 'test2',
    projects: [
      {
        title: 'project1',
        artworks: [
          {
            title: 'artwork1',
            medium: mediumEnum.DRAWING,
          },
          {
            title: 'artwork2',
          },
        ],
      },
    ],
  })
}
