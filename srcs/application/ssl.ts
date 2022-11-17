import path from 'path'

export function addSslToApp(
  app: (req, res) => void,
  configDirectory: string,
  appPackgage: { name: string; version: number }
) {
  console.log(__dirname)
  require('greenlock-express')
    .init({
      packageRoot: path.resolve(__dirname, '../../'),
      configDir: './greenlock.d',
      maintainerEmail: 'thomasbottini@protonmail.com',
      cluster: false,
      packageAgent: appPackgage.name + '/' + appPackgage.version,
    })
    .serve(function (req, res) {
      app(req, res)
    })
}
