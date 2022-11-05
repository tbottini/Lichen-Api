import { applyMigration, getDatabaseEnv, sh } from './migrate'

const config = require('config')

const commands = [applyMigration()]

console.log(config.database.url)

sh(getDatabaseEnv(config.database.url) + ' ' + commands.join(' && '))
