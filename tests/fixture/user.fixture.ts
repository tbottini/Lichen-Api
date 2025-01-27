import { Prisma, Project, User } from '@prisma/client'
import { prisma } from '../../srcs/commons/prisma/prisma'
import { Position } from '../../srcs/commons/class/Position.class'
export function createUser(
  data?: Partial<Prisma.UserUncheckedCreateInput>
): Promise<User> {
  return prisma.user
    .create({
      data: {
        ...data,
        email: data?.email ?? `toto-${new Date().getTime()}@test-email.com`,
        password: data?.password ?? 'SimplePassword1234,',
      },
    })
    .finally()
}

export function createProject(
  data: Prisma.ProjectUncheckedCreateInput
): Promise<Project> {
  return prisma.project.create({
    data: data,
  })
}

export function setCityReferenceForUser(
  userId: number,
  position: Position
): Promise<User> {
  return prisma.user.update({
    data: {
      positionLatitude: position.latitude,
      positionLongitude: position.longitude,
    },
    where: {
      id: userId,
    },
  })
}

export class UserFixture {
  _projects: ProjectFixture[] = []

  constructor(public entity: User) {}

  static async create(createUserDto: Partial<Prisma.UserUncheckedCreateInput>) {
    return new UserFixture(await createUser(createUserDto))
  }

  async createProject(title: string): Promise<ProjectFixture> {
    const project = await ProjectFixture.create({
      authorId: this.entity.id,
      title,
    })
    this._projects.push(project)
    return project
  }
}

export class ProjectFixture {
  constructor(public entity: Project) {}

  static async create(createProjectDto: Prisma.ProjectUncheckedCreateInput) {
    return new ProjectFixture(await createProject(createProjectDto))
  }
}
