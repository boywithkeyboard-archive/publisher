<div align='center'>
  <img src='https://raw.githubusercontent.com/devylstudio/taco/dev/.github/taco.svg' width='128px' />
  <br>
  <br>
  <h1>taco</h1>
</div>

<br>

### Usage

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

    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v3

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Publish Release
        uses: devylstudio/taco@v0
        with:
          kind: ${{github.event.inputs.type}}
```

### Customization

| Name | Description | Default | Required |
| --- | --- | --- | --- |
| `kind` | Any of `prepatch`, `patch`, `preminor`, `minor`, `premajor`, or `major`. | | Yes |
| `draft` | Create the release as a draft. | `false` | No |
| `prerelease` | Create the release as a prerelease. | `false` | No |
| `style` | The style of the tag, release and commit, e.g. `?.?.?`, `v?.?.?`, or `V?.?.?`. | `v?.?.?` | No |
| `include_author` | Include the author of the pull request in the release notes. | `false` | No |
| `include_description` | Include the description of the pull request in the release notes. | `false` | No |
| `prerelease_prefix` | Specify the prefix for prereleases, e.g. `rc`. | `canary` | No |
