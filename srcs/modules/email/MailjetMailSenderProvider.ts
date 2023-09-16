import Mailjet, { SendEmailV3_1 } from 'node-mailjet'
const fs = require('fs')

export class MailjetMailSender {
  sender?: Mailjet

  constructor(publicKey: string, privateKey: string) {
    if (process.env.NODE_ENV == 'production') {
      this.sender = new Mailjet({ apiKey: publicKey, apiSecret: privateKey })
    }
  }

  async send(
    to: string,
    from: string,
    subject: string,
    message: string,
    attachments: MailAttachments[]
  ) {
    if (!this.sender) {
      return
    }

    const mailAttachments: SendEmailV3_1.IAttachment[] | undefined =
      attachments?.map(attachment => {
        return {
          ContentType: attachment.contentType,
          Filename: attachment.filename,
          ContentID: attachment.cid,
          Base64Content: fs.readFileSync(attachment.path, {
            encoding: 'base64',
          }),
        }
      })

    const data = {
      Messages: [
        {
          From: {
            Email: from,
            Name: 'Lichen',
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
          HTMLPart: message,
          Attachments: mailAttachments,
        },
      ],
    }

    const result = await this.sender
      .post('send', { version: 'v3.1' })
      .request(data)

    return result
  }
}

export interface MailAttachments {
  contentType: string
  filename: string
  cid: string
  path: string
}
