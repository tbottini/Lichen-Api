import { applyMigration, getDatabaseEnv, sh, sudo } from './shell-helpers'

const config = require('config')

console.log(process.env.NODE_ENV, config)

const commands = [applyMigration()]

console.log(config.database.url)

sh(sudo(getDatabaseEnv(config.database.url) + ' ' + commands.join(' && ')))
