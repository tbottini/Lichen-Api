import {
  S3Client,
  //   PutObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
const config = require('config')

export class ImageResourcesService {
  BUCKET = 'lichen-aws-bucket'

  constructor() {
    // todo handled with config

    process.env.AWS_ACCESS_KEY_ID = config.s3.accessKeyId
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS_ACCESS_KEY_ID var env isnt defined')
    }

    process.env.AWS_SECRET_ACCESS_KEY = config.s3.secretAccessKey
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY var env isnt defined')
    }

    process.env.AWS_REGION = config.s3.region
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_SECRET_ACCESS_KEY var env isnt defined')
    }
  }

  async getImageUrl(data: { filename: string; contentType?: string }) {
    const client = new S3Client({})

    const command = new GetObjectCommand({
      Bucket: 'lichen-aws-bucket',
      Key: data.filename,
      ResponseContentType: data.contentType ?? 'image/png',
    })
    const url = await getSignedUrl(client, command, { expiresIn: 3600 })

    client.destroy()

    return url
  }

  async publishObject(data: { filename: string; body: string | Buffer }) {
    const client = new S3Client({})
    console.info(`publish object ${data.filename} to s3 bucket...`)
    const command = new PutObjectCommand({
      Bucket: this.BUCKET,
      Key: data.filename,
      Body: data.body,
    })
    const response = await client.send(command)

    client.destroy()

    return response
  }
}
