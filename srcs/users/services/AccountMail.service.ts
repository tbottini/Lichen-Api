import { MailSender } from '../../modules/email/MailSender'
import { MjmlTemplateRepository } from '../../modules/email/MjmlTemplateRepository'

const ASSET_FOLDER = './assets/email/'

export class AccountMailer {
  private readonly mailService: MailSender
  private readonly mailRepository: MjmlTemplateRepository

  constructor() {
    this.mailService = new MailSender()
    this.mailRepository = new MjmlTemplateRepository(ASSET_FOLDER)
    this.mailRepository.registerTemplate('reinit', 'reinit')
  }

  mailTest() {
    // return new MjmlFile('testMail')
  }

  resetPassword(receiverEmail: string, params: ResetPasswordParams) {
    const resetMail = this.mailRepository
      .getTemplate('reinit')
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

interface ResetPasswordParams {
  token: string
  id: number
  firstname: string | null
  lastname: string | null
  email: string | null
}
