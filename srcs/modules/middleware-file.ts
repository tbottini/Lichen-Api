const { v4: uuidv4 } = require('uuid')
import { ImageResourcesService } from './images/ImageResourcesService'
import { logger } from './logger'
const multer = require('multer')
import sharp from 'sharp'
import fs from 'fs'
import { IMAGE_WIDTH_SIZE, getResizedImageBuffer } from './file_size_enum'

function fileMiddleware(type = 'image', _dir = 'public', _subdir = 'images') {
  const uploadOriginalSize = multer({
    storage: multer.diskStorage({
      destination: '/tmp', // store in local filesystem
      filename: (_req, file, getKey) => {
        getKey(null, uuidv4() + '.' + file.mimetype.split('/')[1])
      },
    }),
    fileFilter: (_req, file, cb) => {
      const typeFile = file.mimetype.split('/')[0]

      logger.info('filetype', typeFile)
      if (typeFile != type) cb(null, false)

      cb(null, file.originalname + '-')
    },
  })

  return [uploadOriginalSize.single('file'), middlewareImagePublisher]
}

async function middlewareImagePublisher(req, res, next) {
  if (!req.file) {
    next()
    return
  }

  if (process.env.NODE_ENV === 'test') {
    next()
    return
  }

  const file = {
    filename: req.file.filename,
    path: req.file.path,
  }
  await publishMultiImage(file)
  fs.rmSync(file.path)
  next()
}

async function publishMultiImage(file: File) {
  await pushResizedImageFromLocalFile(file, IMAGE_WIDTH_SIZE.small, 'small')
  await pushResizedImageFromLocalFile(file, IMAGE_WIDTH_SIZE.medium, 'medium')
  await imageResources.publishObject({
    filename: file.filename,
    body: await sharp(file.path).toBuffer(),
  })
}

async function pushResizedImageFromLocalFile(
  file: File,
  width: number,
  size: 'small' | 'medium'
): Promise<void> {
  const buffer = await getResizedImageBuffer(file.path, width)
  await imageResources.publishObject({
    filename: file.filename + '_' + size,
    body: buffer,
  })
}

const imageResources = new ImageResourcesService()

module.exports = fileMiddleware

type File = { path: string; filename: string }
