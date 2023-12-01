import { ArtworkLikes, EventFollow, UserFollow } from '@prisma/client'
import { prisma } from '../../srcs/commons/prisma/prisma'

export function createLikeArtwork({
  likeBy,
  artworkLiked,
}: {
  likeBy: number
  artworkLiked: number
}): Promise<ArtworkLikes> {
  return prisma.artworkLikes.create({
    data: {
      user: {
        connect: {
          id: likeBy,
        },
      },
      artwork: {
        connect: {
          id: artworkLiked,
        },
      },
    },
  })
}

export function createFollow({
  followedByUserId,
  followingUserId,
}: {
  followedByUserId: number
  followingUserId: number
}): Promise<UserFollow> {
  return prisma.userFollow.create({
    data: {
      userFollowed: {
        connect: {
          id: followedByUserId,
        },
      },
      userFollowing: {
        connect: {
          id: followingUserId,
        },
      },
    },
  })
}

export function createEventFollow({
  event,
  user,
}: {
  event: number
  user: number
}): Promise<EventFollow> {
  return prisma.eventFollow.create({
    data: {
      event: {
        connect: {
          id: event,
        },
      },
      user: {
        connect: {
          id: user,
        },
      },
    },
  })
}
