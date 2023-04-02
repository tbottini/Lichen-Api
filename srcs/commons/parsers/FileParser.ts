export function getFilenameFromFile(file: ReceivedFile): string | undefined {
  if (file) {
    return file.key
  }
}

interface ReceivedFile {
  fieldname: string
  originalname: string
  encoding: '7bit'
  mimetype: 'image/jpeg'
  destination: string
  key: string
  path: string
  size: number
}
