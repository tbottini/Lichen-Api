import { Position } from '../../interfaces/Position.type'
import { Gallery } from '@prisma/client'
import { UserRepositoryPublic } from './Users.scope'
import {
  GalleryDto,
  UserPublicDto,
  publicScope,
  UserUpdatbleAttributes as UserUpdatableAttributes,
} from './Users.scope'
import { prisma } from '../../commons/prisma/prisma'

export class UsersRepository {
  async update(userId: number, updateData: UpdateUser): Promise<UserPublicDto> {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      include: {
        gallery: true,
      },
      data: {
        positionLatitude: updateData.userPosition?.latitude,
        positionLongitude: updateData.userPosition?.longitude,
      },
    })

    return this.toUser(user)
  }

  async getUserById(userId: number): Promise<UserPublicDto> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        gallery: true,
      },
    })

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    return this.toUser(user)
  }

  async updateRaw(
    userId: number,
    {
      firstname,
      lastname,
      pseudo,
      description,
      src,
      websiteUrl,
      bio,
      medium,
      email,
      password,
    }: UserUpdatableAttributes
  ): Promise<UserPublicDto> {
    const result = await prisma.user.update({
      where: {
        id: userId,
      },
      select: publicScope,
      data: {
        firstname,
        lastname,
        pseudo,
        description,
        src,
        websiteUrl,
        bio,
        medium,
        email,
        password,
      },
    })

    return this.toUser(result)
  }

  private toUsers(users: UserRepositoryPublic[]): UserPublicDto[] {
    return users.map(this.toUser)
  }

  private toUser(user: UserRepositoryPublic): UserPublicDto {
    return {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      pseudo: user.pseudo,
      src: user.src,
      description: user.description,
      bio: user.bio,
      websiteUrl: user.websiteUrl,
      creation: user.creation,
      role: user.role,
      medium: user.medium,
      position:
        user.positionLatitude && user.positionLongitude
          ? {
              longitude: user.positionLongitude,
              latitude: user.positionLatitude,
            }
          : null,
      gallery: user.gallery ? this.toGallery(user.gallery) : null,
    }
  }

  private toGallery(gallery: Gallery): GalleryDto {
    return gallery
  }
}

interface UpdateUser {
  userPosition?: Position
}

class UserNotFoundError extends Error {
  constructor(userId: number) {
    super(`User with id ${userId} was not found.`)
  }
}
