import { setOutput } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { existsSync, readFileSync } from 'node:fs'
import { config } from './config'

export async function action() {
  const { rest } = getOctokit(config().token)

  let tag = config().tag

  if (!tag) {
    if (/^refs\/tags\/[^\/]+$/.test(context.ref) === false) {
      throw new Error('Invalid context ref: ' + context.ref)
    }

    tag = context.ref.replace('refs/tags/', '')
  }

  let changelogPath: string | undefined

  if (existsSync('./changelog.md')) {
    changelogPath = './changelog.md'
  } else if (existsSync('./CHANGELOG.md')) {
    changelogPath = './CHANGELOG.md'
  }

  if (!changelogPath) {
    throw new Error('No changelog found.')
  }

  let changelog = readFileSync('./changelog.md', { encoding: 'utf-8' })

  let startIndex = changelog.indexOf(`## [${tag}]`)

  if (startIndex < 0) {
    changelog = ''
  } else {
    startIndex = startIndex + `## [${tag}](https://github.com/${context.repo.owner}/${context.repo.repo}/releases/tag/${tag})\n\n`.length

    changelog = changelog.substring(startIndex)

    const endIndex = changelog.indexOf('\n\n## [')

    changelog = changelog.substring(0, endIndex < 0 ? undefined : endIndex)
  }

  const { data } = await rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: tag,
    name: tag,
    body: changelog,
    draft: config().draft,
    prerelease: config().prerelease
  })

  setOutput('release_id', data.id)
  setOutput('tag_name', data.tag_name)
  setOutput('created_at', data.created_at)
}
