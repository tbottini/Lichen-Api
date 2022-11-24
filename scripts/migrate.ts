import { sh } from './package-cmd-utils'
import { applyMigrations } from './prisma-cmd-utils'

const config = require('config')

console.log(config, process.env.NODE_ENV)

console.log(config.database.url)

sh(applyMigrations(config.database.url))
