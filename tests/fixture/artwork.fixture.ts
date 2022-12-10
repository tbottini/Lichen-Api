import { Artwork, Prisma } from '@prisma/client'
import { prisma } from '../../srcs/commons/prisma/prisma'

export async function createArtwork(
  data: Prisma.ArtworkUncheckedCreateInput
): Promise<Artwork> {
  return prisma.artwork.create({
    data,
  })
}
