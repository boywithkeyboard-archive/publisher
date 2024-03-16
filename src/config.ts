import { getBooleanInput, getInput } from '@actions/core'

type Config = {
  token: string
  draft: boolean
  prerelease: boolean
  tag: string | null
}

let CONFIG: Config | undefined

export function config() {
  if (CONFIG) {
    return CONFIG
  }

  CONFIG = {
    token: getInput('token'),
    draft: getBooleanInput('draft'),
    prerelease: getBooleanInput('prerelease'),
    tag: getInput('tag') === '<tag>' ? null : getInput('tag')
  }

  return CONFIG
}
