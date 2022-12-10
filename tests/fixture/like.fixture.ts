import { ArtworkLikes } from '@prisma/client'
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
