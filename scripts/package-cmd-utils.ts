const execShPromise = require('exec-sh').promise
const CMD_EXEC = 'npx'

export function npx(command): string {
  return CMD_EXEC + ' ' + command
}

export function installDevDep(dep: string): string {
  return `npm install --save-dev ${dep}`
}

export function checkInstall(): string {
  return 'npm install .'
}

export function sudo(cmd) {
  return 'sudo ' + cmd
}

export function sh(cmd) {
  console.log(cmd)
  return execShPromise(cmd)
}
