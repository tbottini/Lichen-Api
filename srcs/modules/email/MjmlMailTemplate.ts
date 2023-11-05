const mjml = require('mjml')

export class MjmlMailTemplate {
  body: string

  constructor(body: string) {
    this.body = body
  }

  set(varName: string, value: string | undefined): this {
    this.body = this.body.replace('$' + varName, value || '')
    return this
  }

  generate(): string {
    return mjml(this.body).html
  }

  getRawHtml() {
    return this.body
  }

  duplicate() {
    return new MjmlMailTemplate(this.body)
  }
}
