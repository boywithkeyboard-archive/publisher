import { getBooleanInput, getInput, setFailed, setOutput } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import indentString from 'indent-string'
import semver from 'semver'

async function action() {
  const config = {
    token: getInput('token'),
    kind: getInput('kind', { required: true }),
    draft: getBooleanInput('draft'),
    includeAuthor: getBooleanInput('include_author'),
    includeDescription: getBooleanInput('include_description'),
    prereleasePrefix: getInput('prerelease_prefix'),
    mentionContributors: getBooleanInput('mention_contributors'),
  }

  const { rest } = getOctokit(config.token)

  // const fetchChangelog = async () => {
  //   try {
  //     const { data } = await rest.repos.getContent({
  //       ...context.repo,
  //       path: 'changelog.md',
  //     })

  //     // @ts-ignore:
  //     return [data.sha, await readFile('changelog.md', { encoding: 'utf-8' })]
  //   } catch (err) {
  //     return [null, '']
  //   }
  // }

  const getLatestRelease = async () => {
    try {
      const data = await rest.repos.listReleases({
        ...context.repo,
      })

      data.data[0].tag_name

      return {
        data: data.data[0],
        status: data.status,
      }
    } catch (err) {
      return {
        status: 404,
      }
    }
  }

  const { data: latestRelease, status } = await getLatestRelease()

  let currentVersion = latestRelease?.tag_name ?? 'v0.0.0'
  let nextVersion = 'v'

  if (config.kind === 'prepatch') {
    nextVersion += semver.prerelease(currentVersion)
      ? semver.inc(
        currentVersion,
        'prerelease',
        undefined,
        config.prereleasePrefix,
      )
      : semver.inc(
        currentVersion,
        'prepatch',
        undefined,
        config.prereleasePrefix,
      )
  } else if (config.kind === 'patch') {
    nextVersion += semver.inc(currentVersion, 'patch')
  } else if (config.kind === 'preminor') {
    nextVersion += semver.prerelease(currentVersion)
      ? semver.inc(
        currentVersion,
        'prerelease',
        undefined,
        config.prereleasePrefix,
      )
      : semver.inc(
        currentVersion,
        'preminor',
        undefined,
        config.prereleasePrefix,
      )
  } else if (config.kind === 'minor') {
    nextVersion += semver.inc(currentVersion, 'minor')
  } else if (config.kind === 'premajor') {
    nextVersion += semver.prerelease(currentVersion)
      ? semver.inc(
        currentVersion,
        'prerelease',
        undefined,
        config.prereleasePrefix,
      )
      : semver.inc(
        currentVersion,
        'premajor',
        undefined,
        config.prereleasePrefix,
      )
  } else if (config.kind === 'major') {
    nextVersion += semver.inc(currentVersion, 'major')
  } else {
    throw new Error('Invalid kind.')
  }

  console.info(
    `Latest release: ${latestRelease?.tag_name} (published at ${latestRelease?.created_at})`,
  )

  let { data } = await rest.pulls.list({
    ...context.repo,
    per_page: 100,
    sort: 'updated',
    state: 'closed',
    direction: 'desc',
  })

  data = [
    ...data,
    ...(await rest.pulls.list({
      ...context.repo,
      per_page: 100,
      sort: 'updated',
      state: 'closed',
      direction: 'desc',
      page: 2,
    })).data,
  ]

  const year = new Date().getUTCFullYear(),
    month = new Date().getUTCMonth() + 1,
    day = new Date().getUTCDate()

  // let changelogBody =
  //     `## [${tag}](https://github.com/${context.repo.owner}/${context.repo.repo}/releases/tag/${tag})\n`,
  let releaseBody = `### ${nextVersion} / ${year}.${
    month < 10 ? `0${month}` : month
  }.${day < 10 ? `0${day}` : day}\n`

  data.sort((a, b) => {
    const x = a.title.toLowerCase(),
      y = b.title.toLowerCase()

    if (x < y) {
      return -1
    }

    if (x > y) {
      return 1
    }

    return 0
  })

  const contributors = new Set<string>()

  for (const { user, merged_at, number, body, merge_commit_sha } of data) {
    if (
      merged_at === null || user?.type === 'Bot' || merge_commit_sha === null ||
      status !== 200
    ) {
      continue
    }

    if (
      latestRelease && new Date(latestRelease.created_at).getTime() >=
        new Date(merged_at).getTime()
    ) {
      continue
    }

    const c = await rest.repos.getCommit({
      ...context.repo,
      ref: merge_commit_sha,
    })

    if (c.status !== 200) {
      continue
    }

    if (
      latestRelease && c.data.commit.committer?.date &&
      new Date(c.data.commit.committer?.date).getTime() <=
        new Date(latestRelease.created_at).getTime()
    ) {
      continue
    }

    const linkifyReferences = (commit: string) => {
      const issueRegex =
        /(?<!\w)(?:(?<organization>[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)\/(?<repository>[\w.-]{1,100}))?(?<!(?:\/\.{1,2}))#(?<issueNumber>[1-9]\d{0,9})\b/g

      const matches = commit.match(issueRegex)

      if (!matches) {
        return commit
      }

      for (const m of matches) {
        commit = commit.replace(
          `(${m})`,
          `([${m}](https://github.com/${context.repo.owner}/${context.repo.repo}/pull/${
            m.slice(1)
          }))`,
        )
      }

      return commit
    }

    const i = c.data.commit.message.indexOf(')\n\n')
    const title = c.data.commit.message.substring(0, i > 0 ? i + 1 : undefined)

    const comments = (await rest.issues.listComments({
      ...context.repo,
      issue_number: number,
    })).data

    if (
      comments.length > 0 &&
      comments.some((c) =>
        c.body !== undefined && c.body === '?log ignore' &&
        (c.author_association === 'COLLABORATOR' ||
          c.author_association === 'MEMBER' || c.author_association === 'OWNER')
      )
    ) {
      continue
    }

    // changelogBody += `\n* ${linkifyReferences(title)}`

    releaseBody += `\n* ${linkifyReferences(title)}`

    if (config.includeAuthor && user?.login) {
      // changelogBody += user?.login
      //   ? ` by [@${user?.login}](https://github.com/${user?.login})`
      //   : ''

      contributors.add(`, @${user.login}`)
      releaseBody += ` by @${user.login}`
    }

    if (config.includeDescription && body !== null && body.length > 0) {
      // changelogBody += `\n\n${indentString(body, 2)}\n`
      releaseBody += `\n\n${indentString(body, 2)}\n`
    }
  }

  if (config.mentionContributors) {
    const arr = [...contributors.values()]

    arr[0] = arr[0].replace(', ', '')
    arr[arr.length - 1] = arr.length > 2
      ? arr[arr.length - 1].replace(', ', ', & ')
      : arr[arr.length - 1].replace(', ', ' & ')

    releaseBody += `\n\n###### Contributed by ${arr.join('')}`
  }

  const { data: release } = await rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: nextVersion,
    name: nextVersion,
    body: releaseBody,
    draft: config.draft,
    prerelease: config.kind.startsWith('pre'),
    target_commitish: context.sha,
  })

  // const [sha, content] = await fetchChangelog()

  // await rest.repos.createOrUpdateFileContents({
  //   ...context.repo,
  //   path: 'changelog.md',
  //   content: Buffer.from(
  //     `${changelogBody}${content === '' ? '\n' : `\n\n${content}`}`,
  //   ).toString('base64'),
  //   message: getInput('commit_message').replace('{tag}', tag),
  //   ...(sha !== null && { sha }),
  // })

  setOutput('release_id', release.id)
  setOutput('tag_name', nextVersion)
  setOutput('created_at', release.created_at)
  // setOutput('release_body', releaseBody)
  // setOutput('changelog_body', changelogBody)
}

try {
  action()
} catch (err) {
  setFailed(
    err instanceof Error ? err.message : 'Something unexpected happened.',
  )
}
