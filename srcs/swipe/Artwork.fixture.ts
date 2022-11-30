import { MediumValues } from '../medium/mediumEnum'
import { PrismaClient, Prisma, Artwork, Project } from '@prisma/client'
import { createArtwork } from '../../tests/fixture/artwork.fixture'
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
