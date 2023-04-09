export function getFilenameFromFile(file: ReceivedFile): string | undefined {
  if (file) {
    return file.filename
  }
}

interface ReceivedFile {
  fieldname: string
  originalname: string
  encoding: '7bit'
  mimetype: 'image/jpeg'
  destination: string
  filename: string
  path: string
  size: number
}
