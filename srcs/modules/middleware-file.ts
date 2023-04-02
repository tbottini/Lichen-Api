const { v4: uuidv4 } = require('uuid')
import { ImageResourcesService } from './images/ImageResourcesService'
import { logger } from './logger'
const multer = require('multer')
const multerS3 = require('multer-s3')

const imageResources = new ImageResourcesService()

/**
 * @param type is the type of file who'll be received image/pdf
 * @returns
 */
function fileMiddleware(type = 'image', _dir = 'public', _subdir = 'images') {
  const upload = multer({
    storage: multerS3({
      s3: imageResources.s3,
      bucket: imageResources.BUCKET,
      key: (_req, file, cb) => {
        console.log('test key')
        cb(null, uuidv4() + '.' + file.mimetype.split('/')[1])
      },
    }),
    fileFilter: (_req, file, cb) => {
      const typeFile = file.mimetype.split('/')[0]

      logger.info('filetype', typeFile)
      if (typeFile != type) cb(null, false)

      cb(null, file.originalname + '-')
    },
  })

  return upload.single('file')
}

module.exports = fileMiddleware
