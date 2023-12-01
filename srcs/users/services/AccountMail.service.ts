import { MailSenderAdapter } from '../../modules/email/MailSender'
import {
  MjmlTemplateRepository,
  createProductionMjmlTemplateRepository,
} from '../../modules/email/MjmlTemplateRepository'
const config = require('config')

const ASSET_FOLDER = './assets/email/'

export interface IAccountMailer {
  resetPassword(receiverEmail: string, params: ResetPasswordParams): void
}

export class AccountMailer implements IAccountMailer {
  private readonly mailService: MailSenderAdapter
  private readonly mailRepository: MjmlTemplateRepository

  constructor() {
    this.mailService = new MailSenderAdapter()
    this.mailRepository = createProductionMjmlTemplateRepository(ASSET_FOLDER)
    this.mailRepository.registerTemplate('reinit', 'reinit')
  }

  resetPassword(receiverEmail: string, params: ResetPasswordParams): void {
    const resetMail = this.mailRepository
      .getTemplate('reinit')
      .set('hostname', config.webapp.hostname)
      .set('token', params.token)
      .set('id', params.id.toString())
      .set('firstname', params.firstname || '')
      .set('lastname', params.lastname || '')
      .set('email', params.email || '')

    this.mailService.sendFromTemplate(
      resetMail,
      'Lichen - Réinitialisation de votre mot de passe',
      receiverEmail
    )
  }
}

export interface ResetPasswordParams {
  token: string
  id: number
  firstname: string | null
  lastname: string | null
  email: string | null
}
