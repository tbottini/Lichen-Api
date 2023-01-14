require('dotenv').config({ path: getEnvFile() })

function getEnvFile(): string {
  switch (process.env.NODE_ENV) {
    case 'production':
      return '.env'
    case 'test':
      return '.env.test'
    case 'development':
      return '.env.dev'
    case 'staging':
      return '.env.staging'
    default:
      throw new Error(
        `env variable ${process.env.NODE_ENV} for NODE_ENV isn't a valid value : production / dev / staging / test`
      )
  }
}
