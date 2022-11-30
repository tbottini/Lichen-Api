import { PrismaClient, ArtworkLikes } from '@prisma/client'
const prisma = new PrismaClient()

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
