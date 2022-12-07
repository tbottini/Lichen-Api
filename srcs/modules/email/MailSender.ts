import { MjmlMailTemplate } from './MjmlMailTemplate'
import { MailjetMailSender, MailAttachments } from './MailjetMailSenderProvider'
import { logger } from '../logger'

const DEFAULT_MAIL = 'no-reply@reseau-lichen.fr'

export class MailSender {
  sender: MailjetMailSender

  constructor() {
    logger.info('Mail Sender (Mailjet) Instantiate')

    if (process.env.MAILJET_APIKEY_PUBLIC == null) {
      throw new Error('MailjetSender - MAILJET_APIKEY_PUBLIC is undefined')
    }
    if (process.env.MAILJET_APIKEY_PRIVATE == null) {
      throw new Error('MailjetSender - MAILJET_APIKEY_PRIVATE is undefined')
    }

    this.sender = new MailjetMailSender(
      process.env.MAILJET_APIKEY_PUBLIC,
      process.env.MAILJET_APIKEY_PRIVATE
    )
  }

  async send(
    subject: string,
    to: string,
    content: string,
    attachments: MailAttachments[],
    from: string = DEFAULT_MAIL
  ) {
    if (!to || !from || !subject) {
      throw new Error('Mail data missing')
    }
    if (process.env.NODE_ENV === 'production') {
      await this.sender.send(to, from, subject, content, attachments)
    } else {
      console.log('[FAKE] try to send mail ', subject, 'to', to)
      await this.sender.send(
        'thomasbottini@protonmail.com',
        from,
        `[TEST] ${subject}`,
        content,
        attachments
      )
    }
  }

  async sendFromTemplate(
    template: MjmlMailTemplate,
    subject: string,
    to: string
  ): Promise<void> {
    return this.send(subject, to, template.generate(), [])
  }
}
