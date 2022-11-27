const request = require('supertest')
import { app } from '../../srcs/index'

export async function followUser(
  token: string,
  dto: FollowInput
): Promise<void> {
  await request(app)
    .post('/users/' + dto.followedId + '/follow')
    .set('Authorization', 'bearer ' + token)
}

export type FollowInput = {
  followedId: number
}
