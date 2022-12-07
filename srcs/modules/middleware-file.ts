const { v4: uuidv4 } = require('uuid')
import { logger } from './logger'
const multer = require('multer')

/**
 *
 * @param type is the type of file who'll be received image/pdf
 * @returns
 */
function fileMiddleware(type = 'image', dir = 'public', subdir = 'images') {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, `${dir}/${subdir}/`)
      },
      filename: (req, file, cb) => {
        cb(null, uuidv4() + '.' + file.mimetype.split('/')[1])
      },
    }),
    fileFilter: (req, file, cb) => {
      const typeFile = file.mimetype.split('/')[0]

      logger.info('filetype', typeFile)
      if (typeFile != type) cb(null, false)

      cb(null, file.originalname + '-')
    },
  })

  return upload.single('file')
}

module.exports = fileMiddleware
