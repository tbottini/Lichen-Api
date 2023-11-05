import { MjmlTemplateRepository } from './MjmlTemplateRepository'

describe('mjml template repository tests', () => {
  let repo: MjmlTemplateRepository

  beforeEach(() => {
    repo = new MjmlTemplateRepository({
      readMjml: _ => {
        return `
  
          <mjml>
          <mj-head>
            <mj-font
              name="FontAwesome"
              href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
            />
          </mj-head>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-image
                  width="150px"
                  src="https://api.reseau-lichen.fr/logo.png"
                ></mj-image>
              </mj-column>
            </mj-section>
            <mj-text font-size="20px" color="black" line-height="27px" font-family="Livvic, Raleway, Arial" font-weight="200">       $hello $world !
          </mj-text>
            $hello $world !
          </mj-body>
        </mjml>
        
    `
      },
    })
    repo.registerTemplate('test', 'test')
  })

  it('should generate a mail from a template', () => {
    const body = repo
      .getTemplate('test')
      .set('hello', 'token_to_found_1')
      .set('world', 'token_to_found_2')
      .generate()

    console.log(body)

    expect(body.includes('token_to_found_1 token_to_found_2')).toBeTruthy()
  })

  it('doit retourner un template sans les variable de template défini si jamais le template à déjà été utilisé (testé à cause de problème de cache)', () => {
    const body = repo
      .getTemplate('test')
      .set('hello', 'token_to_found_1')
      .set('world', 'token_to_found_2')
      .generate()
    expect(body.includes('token_to_found_1 token_to_found_2')).toBeTruthy()

    const body2 = repo
      .getTemplate('test')
      .set('hello', 'token_to_found_3')
      .set('world', 'token_to_found_4')
      .generate()
    expect(body2.includes('token_to_found_3 token_to_found_4')).toBeTruthy()
  })
})
