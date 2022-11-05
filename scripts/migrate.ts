const execShPromise = require('exec-sh').promise
const config = require('config')

console.log(process.env.NODE_ENV, config)

const CMD_EXEC = 'npx'

export function npx(command) {
  return CMD_EXEC + ' ' + command
}

export function installDevDep(dep) {
  return `npm install --save-dev ${dep}`
}

export function sudo(cmd) {
  return 'sudo ' + cmd
}

export function sh(cmd) {
  console.log(cmd)
  return execShPromise(cmd)
}

async function prismaMigrate(databaseUrl) {
  await execShPromise(
    'sudo DATABASE_URL=' +
      databaseUrl +
      [applyMigration(), generatePrismaClient()].join(' && ')
  )
}

export function applyMigration() {
  return npx('prisma migrate dev')
}

export function generatePrismaClient() {
  // sudo(installDevDep('prisma@latest'))
  return [
    npx('prisma generate'),
    sudo(installDevDep('@prisma/client@latest')),
  ].join(' && ')
}

export function getDatabaseEnv(databaseUrl: string) {
  return 'DATABASE_URL="' + databaseUrl + '"'
}

const commands = [applyMigration()]

console.log(config.database.url)

sh(sudo(getDatabaseEnv(config.database.url) + ' ' + commands.join(' && ')))
