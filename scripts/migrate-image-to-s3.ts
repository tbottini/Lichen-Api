import fs from 'fs'
import { ImageResourcesService } from '../srcs/modules/images/ImageResourcesService'
const config = require('config')

console.log(config, process.env.NODE_ENV)

const imageService = new ImageResourcesService()

async function migrateImageToS3() {
  const directory = fs.readdirSync('./public/images/')

  for (const file of directory) {
    const fileBody = fs.readFileSync('./public/images/' + file)

    await imageService.publishObject({
      filename: file,
      body: fileBody,
    })
  }
}

migrateImageToS3()
