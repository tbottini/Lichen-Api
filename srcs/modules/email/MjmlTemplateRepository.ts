import fs from 'fs'
import { logger } from '../logger'
import { MjmlMailTemplate } from './MjmlMailTemplate'

export function createProductionMjmlTemplateRepository(assetFolder: string) {
  return new MjmlTemplateRepository(new MjmlTemplateFileReader(assetFolder))
}

export class MjmlTemplateRepository {
  private readonly defaultWrapper!: MjmlMailTemplate

  templates: Record<string, MjmlMailTemplate> = {}

  constructor(private readonly fileReader: MjmlTemplateLoader) {
    this.defaultWrapper = this.generateDefaultWrapper({})
  }

  generateDefaultWrapper({
    linkFacebook,
    linkInstagram,
    linkYoutube,
    linkSoundcloud,
    linkTwitter,
  }: WrapperOptions): MjmlMailTemplate {
    // logger.info('MjmlFile - Basic Template was generate')
    return new MjmlMailTemplate(this.readMjml('basic'))
      .set('link-facebook', linkFacebook)
      .set('link-instagram', linkInstagram)
      .set('link-youtube', linkYoutube)
      .set('link-soundcloud', linkSoundcloud)
      .set('link-twitter', linkTwitter)
  }

  registerTemplate(templateName: string, templateFilename: string) {
    const rawTemplate = this.readMjml(templateFilename)
    this.templates[templateName] = this.defaultWrapper
      .duplicate()
      .set('email-body', rawTemplate)
  }

  getTemplate(templateName: string): MjmlMailTemplate {
    if (!this.templates[templateName]) {
      throw new Error(`Template with name : ${templateName} doesn't exists`)
    }
    return this.templates[templateName].duplicate()
  }

  private readMjml(templateFilename: string) {
    return this.fileReader.readMjml(templateFilename)
  }
}

type WrapperOptions = Partial<{
  linkFacebook: string
  linkInstagram: string
  linkYoutube: string
  linkSoundcloud: string
  linkTwitter: string
}>

export interface MjmlTemplateLoader {
  readMjml(templateFilename: string): string
}

class MjmlTemplateFileReader implements MjmlTemplateLoader {
  constructor(private readonly assetFolder: string) {}

  readMjml(templateFilename: string) {
    if (this.assetFolder == null) {
      throw new Error(`No folder was provide for mjml file ${templateFilename}`)
    }
    return fs
      .readFileSync(this.assetFolder + templateFilename + '.mjml')
      .toString()
  }
}
