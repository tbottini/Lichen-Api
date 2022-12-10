import { prisma } from '../../srcs/commons/prisma/prisma'

export async function clearDatabase() {
  await prisma.artwork.deleteMany()
  await prisma.project.deleteMany()
  await prisma.event.deleteMany()
  await prisma.artworkLikes.deleteMany()
  await prisma.eventFollow.deleteMany()
  await prisma.gallery.deleteMany()
  await prisma.userFollow.deleteMany()
  await prisma.user.deleteMany()
}
