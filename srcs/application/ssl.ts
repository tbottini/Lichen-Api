export function addSslToApp(
  app: (req, res) => void,
  configDirectory: string,
  appPackgage: { name: string; version: number }
) {
  require('greenlock-express')
    .init({
      packageRoot: __dirname + '/../',
      configDir: configDirectory,
      maintainerEmail: 'thomasbottini@protonmail.com',
      cluster: false,
      packageAgent: appPackgage.name + '/' + appPackgage.version,
    })
    .serve(function (req, res) {
      app(req, res)
    })
}
