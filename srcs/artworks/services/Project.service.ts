import { prisma } from '../../commons/prisma/prisma'
import { ImageSrc } from '../../modules/images/ImageDomainBroadcaster'

export class ProjectService {
  async getImages(): Promise<ImageSrc[]> {
    const projects = await prisma.project.findMany({
      select: {
        src: true,
      },
    })

    return projects.filter(p => p.src != null) as ImageSrc[]
  }
}
