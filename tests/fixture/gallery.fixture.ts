import { Gallery, Prisma } from '@prisma/client'
import { prisma } from '../../srcs/commons/prisma/prisma'

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
