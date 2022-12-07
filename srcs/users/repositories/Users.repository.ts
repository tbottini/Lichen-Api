import { Position } from '../../interfaces/Position.type'
import { Gallery, PrismaClient } from '@prisma/client'
import { UserRepositoryPublic } from './Users.scope'
import {
  GalleryDto,
  UserPublicDto,
  publicScope,
  UserUpdatbleAttributes,
} from './Users.scope'
const prisma = new PrismaClient()

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

  toUsers(users: UserRepositoryPublic[]): UserPublicDto[] {
    return users.map(this.toUser)
  }

  toUser(user: UserRepositoryPublic): UserPublicDto {
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
      geoReferenced: user.geoReferenced,
      medium: user.medium,
      defaultPosition:
        user.positionLatitude && user.positionLongitude
          ? {
              longitude: user.positionLongitude,
              latitude: user.positionLatitude,
            }
          : null,
      gallery: user.gallery ? this.toGallery(user.gallery) : null,
    }
  }

  toGallery(gallery: Gallery): GalleryDto {
    return gallery
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
      geoReferenced,
    }: UserUpdatbleAttributes
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
        geoReferenced,
      },
    })

    return this.toUser(result)
  }
}

interface UpdateUser {
  userPosition?: Position
}
