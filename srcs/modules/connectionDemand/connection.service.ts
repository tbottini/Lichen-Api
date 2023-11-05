import { prisma } from '../../commons/prisma/prisma'
import { MailSenderAdapter } from '../email/MailSender'
import {
  MjmlTemplateRepository,
  createProductionMjmlTemplateRepository,
} from '../email/MjmlTemplateRepository'

const ASSET_FOLDER = './assets/email/'

export class ConnectionService {
  private readonly mailService: MailSenderAdapter
  private readonly mailRepository: MjmlTemplateRepository

  constructor() {
    this.mailService = new MailSenderAdapter()
    this.mailRepository = createProductionMjmlTemplateRepository(ASSET_FOLDER)
    this.mailRepository.registerTemplate('connectionDemand', 'connectionDemand')
  }

  async sendConnectionRequestTo(demand: ConnectionRequest) {
    if (await this.exists(demand.fromEmail, demand.to)) {
      throw new Error('demand already exists')
    }

    const demandCreated = await prisma.connection.create({
      data: {
        toEmail: demand.to,
        fromEmail: demand.fromEmail,
        requestContent: demand.requestContent,
      },
    })

    console.log(demand)

    const demandMail = this.mailRepository
      .getTemplate('connectionDemand')
      .set('toName', demand.toName)
      .set('requestContent', demand.requestContent)
      .set('fromEmail', demand.fromEmail)
      .set('fromName', demand.fromName)

    await this.mailService.sendFromTemplate(
      demandMail,
      `Lichen - Demande de contact de ${demand.fromName}`,
      demand.to
    )

    return demandCreated
  }

  private async exists(from: string, to: string) {
    return !!(await this.getDemand(from, to))
  }

  private getDemand(from: string, to: string) {
    return prisma.connection.findFirst({
      where: {
        fromEmail: from,
        toEmail: to,
      },
    })
  }
}

interface ConnectionRequest {
  fromName: string
  fromEmail: string
  to: string
  toName: string
  requestContent: string
}
