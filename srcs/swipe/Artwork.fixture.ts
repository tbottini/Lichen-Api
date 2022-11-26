import { MediumValues } from '../medium/mediumEnum'
import {
  PrismaClient,
  Prisma,
  Artwork,
  Project,
  User,
  Gallery,
  ArtworkLikes,
} from '@prisma/client'
const prisma = new PrismaClient()

export function createProject(
  data: Prisma.ProjectUncheckedCreateInput
): Promise<Project> {
  return prisma.project
    .create({
      data: data,
    })
    .finally()
}

export function createUser(
  data?: Partial<Prisma.UserUncheckedCreateInput>
): Promise<User> {
  return prisma.user
    .create({
      data: {
        ...data,
        email: data?.email ?? 'toto@test-email.com',
        password: data?.password ?? 'SimplePassword1234,',
      },
    })
    .finally()
}

export async function createArtwork(
  data: Prisma.ArtworkUncheckedCreateInput
): Promise<Artwork> {
  return prisma.artwork.create({
    data,
  })
}

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

export function configureArtworkCreation(projectId: number) {
  return (title: string, options?: { medium: MediumValues }) =>
    createArtwork({
      title,
      src: 'test-src',
      projectId,
      medium: options?.medium,
    })
}
export type CreateArworkFunction = (
  title: string,
  options?: { medium: MediumValues }
) => Promise<Artwork>

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
