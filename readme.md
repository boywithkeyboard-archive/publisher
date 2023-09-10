<div align='center'>
  <h1>taco</h1>
</div>

![Demo](https://raw.githubusercontent.com/boywithkeyboard/taco/dev/.github/demo.png)

> **Warning**\
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
      - uses: actions/checkout@v3

      - name: Publish Release
        uses: boywithkeyboard/taco@v0
        with:
          kind: ${{github.event.inputs.kind}}
```

- `kind`
  Any of `prepatch`, `patch`, `preminor`, `minor`, `premajor`, or `major`.
- `draft` *(defaults to `false`)*
  Create the release as a draft.
- `include_author` *(defaults to `false`)*
  Include the author of the pull request in the release notes.
- `include_description` *(defaults to `false`)*
  Include the description of the pull request in the release notes.
- `prerelease_prefix` *(defaults to `canary`)*
  Specify the prefix for prereleases, e.g. `rc`.
- `mention_contributors` *(defaults to `false`)*
  Mention all contributors in the footer of the release notes.
