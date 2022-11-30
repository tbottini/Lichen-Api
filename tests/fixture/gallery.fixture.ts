import { Gallery, Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function createGalleryForUser(
  userId: number,
  data: Omit<Prisma.GalleryUncheckedCreateInput, 'userId'>
): Promise<Gallery> {
  return prisma.gallery.create({
    data: {
      ...data,
      userId,
    },
  })
}
