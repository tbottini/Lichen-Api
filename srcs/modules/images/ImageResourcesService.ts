import {
  S3Client,
  //   PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
// import fs, { ReadStream } from 'fs'

export class ImageResourcesService {
  s3: S3Client

  BUCKET = 'lichen-aws-bucket'

  constructor() {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS_ACCESS_KEY_ID var env isnt defined')
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY var env isnt defined')
    }

    this.s3 = new S3Client({})
  }

  async getImageUrl(data: { filename: string; contentType?: string }) {
    const command = new GetObjectCommand({
      Bucket: 'lichen-aws-bucket',
      Key: data.filename,
      ResponseContentType: data.contentType ?? 'image/png',
    })
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 })
    return url
  }

  //   async publishObject(data: {
  //     filename: string
  //     body: string | Buffer | ReadStream
  //   }) {
  //     const command = new PutObjectCommand({
  //       Bucket: this.BUCKET,
  //       Key: data.filename,
  //       Body: data.body,
  //     })
  //     const response = await this.s3.send(command)

  //     console.log(response)
  //     return response
  //   }
}

// const imageService = new ImageResourcesService()

// imageService.getImageUrl({ filename: 'test' }).then(console.log)

// const icon = fs.createReadStream('./public/logo.png')
// imageService.publishObject({
//   filename: 'test',
//   body: icon,
// })

// console.log(icon)
