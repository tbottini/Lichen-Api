import sharp from 'sharp'

export const IMAGE_WIDTH_SIZE = {
  small: 150,
  medium: 750,
}

export function getResizedImageBuffer(
  path: string | Buffer | Uint8Array,
  width: number
): Promise<Buffer> {
  return sharp(path).resize(width).toBuffer()
}
