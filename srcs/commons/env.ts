require('dotenv').config({ path: getEnvFile() })

function getEnvFile(): string {
  switch (process.env.NODE_ENV) {
    case 'production':
      return '.env'
    case 'test':
      return '.env.test'
    case 'development':
      return '.env.dev'
    default:
      throw new Error(
        "env variable NODE_ENV isn't not valid value : production / dev / test"
      )
  }
}
