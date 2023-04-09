import { ArtworkService } from '../../artworks/services/Artwork.service'
import { ProjectService } from '../../artworks/services/Project.service'
import { Dependencies } from '../../dependencies'
import { EventService } from '../../events/services/Events.service'
import { UserService } from '../../users/services/Users.service'

const dependencies = new Dependencies()

/**
 * c'est une classe qui permet d'effectuer des actions sur tous les modules qui utilises des images
 * exemple: je veux récupérer toutes les images publier oeuvres/projects/photo de profil et event confondues
 */
export class ImageDomainBroadcaster {
  domains: DomainServiceImage[] = [
    {
      name: 'projects',
      service: new ProjectService(),
    },
    {
      name: 'artworks',
      service: new ArtworkService(),
    },
    {
      name: 'events',
      service: new EventService(),
    },
    {
      name: 'users',
      service: dependencies.getUserService(),
    },
  ]

  async getImages(): Promise<ImageSrc[]> {
    let images: ImageSrc[] = []
    for (const domain of this.domains) {
      images = images.concat(await domain.service.getImages())
    }

    return images
  }
}

type DomainServiceImage = {
  name: string
  service: {
    getImages(): Promise<ImageSrc[]>
  }
}

export type ImageSrc = {
  src: string
}
