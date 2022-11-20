import { sh, sudo } from './package-cmd-utils'
import { applyMigrations } from './prisma-cmd-utils'

const config = require('config')

console.log(config, process.env.NODE_ENV)

console.log(config.database.url)

sh(sudo(applyMigrations(config.database.url)))
