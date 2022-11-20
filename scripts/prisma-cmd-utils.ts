import { npx, checkInstall } from './package-cmd-utils'

export function applyMigrations(databaseUrl: string): string {
  return (
    getDatabaseEnv(databaseUrl) +
    ' ' +
    [applyMigration(), generatePrismaClient()].join(' && ')
  )
}

export function applyMigration(): string {
  return npx('prisma migrate dev')
}

export function generatePrismaClient(): string {
  return checkInstall()
}

export function getDatabaseEnv(databaseUrl: string): string {
  return 'DATABASE_URL="' + databaseUrl + '"'
}
