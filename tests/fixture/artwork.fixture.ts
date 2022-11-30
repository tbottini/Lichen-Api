import { Artwork, Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function createArtwork(
  data: Prisma.ArtworkUncheckedCreateInput
): Promise<Artwork> {
  return prisma.artwork.create({
    data,
  })
}
