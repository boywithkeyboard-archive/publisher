<div align='center'>
  <h1>publisher</h1>
</div>

![Demo](https://raw.githubusercontent.com/boywithkeyboard/publisher/dev/.github/demo.png)

## Usage

> [!IMPORTANT]\
> You need to follow [Semantic Versioning](https://semver.org) and
> [Conventional Commits](https://www.conventionalcommits.org) if you want to use
> this tool.

```yml
name: publish

on:
  workflow_dispatch:
    inputs:
      kind:
        description: 'Kind of release'
        default: 'minor'
        type: choice
        options:
        - prepatch
        - patch
        - preminor
        - minor
        - premajor
        - major
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Publish release
        uses: boywithkeyboard/publisher@v2
        with:
          kind: ${{github.event.inputs.kind}}
```

- `kind`

  Any of `prepatch`, `patch`, `preminor`, `minor`, `premajor`, or `major`.
- `draft` _(defaults to `false`)_

  Create the release as a draft.
- `include_author` _(defaults to `false`)_

  Include the author of the pull request in the release notes.
- `include_description` _(defaults to `false`)_

  Include the description of the pull request in the release notes.
- `prerelease_prefix` _(defaults to `canary`)_

  Specify the prefix for prereleases, e.g. `rc`.
- `mention_contributors` _(defaults to `false`)_

  Mention all contributors in the footer of the release notes.
