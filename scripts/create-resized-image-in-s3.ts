require('../srcs/commons/env')
require('config')
import { ImageDomainBroadcaster } from '../srcs/modules/images/ImageDomainBroadcaster'
import { ImageResourcesService } from '../srcs/modules/images/ImageResourcesService'
import {
  IMAGE_WIDTH_SIZE,
  getResizedImageBuffer,
} from '../srcs/modules/file_size_enum'

const imageService = new ImageResourcesService()

export async function createResizedImageInS3() {
  const broadcaster = new ImageDomainBroadcaster()

  const images = await broadcaster.getImages()

  for (const image of images) {
    console.log('process image ', image.src)
    const src = image.src

    const mustResize =
      !(await imageService.exists(src + '_small')) ||
      !(await imageService.exists(src + '_medium'))

    if (mustResize) {
      const imageBuffer = await imageService.getImageBuffer(src)
      if (!imageBuffer) {
        continue
      }

      console.log(`Try to push small size image`)
      await pushResizedFileFromBuffer(
        imageBuffer,
        src,
        IMAGE_WIDTH_SIZE.small,
        'small'
      )

      console.log(`Try to push medium size image`)
      await pushResizedFileFromBuffer(
        imageBuffer,
        src,
        IMAGE_WIDTH_SIZE.medium,
        'medium'
      )
    }
  }
}

createResizedImageInS3()

async function pushResizedFileFromBuffer(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  width: number,
  size: 'small' | 'medium'
): Promise<void> {
  const buffer = await getResizedImageBuffer(fileBuffer, width)
  await imageService.publishObject({
    filename: filename + '_' + size,
    body: buffer,
  })
}
