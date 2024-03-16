### Usage

1. Make sure you have a `changelog.md` or `CHANGELOG.md` file in the root directory of your repository that is similar to this one:

    ```
    ## [v1.1.0](https://github.com/user/repository/releases/tag/v1.1.0)

    Some release notes.

    ## [v1.0.0](https://github.com/user/repository/releases/tag/v1.0.0)

    Some more release notes.
    ```

2. Create a new workflow file with the following content:

    ```yml
    name: publish

    on:
      push:
        tags:
          - v*

    jobs:
      publish:
        runs-on: ubuntu-latest

        steps:
          - uses: actions/checkout@v4

          - name: Publish Release
            uses: boywithkeyboard/publisher@v3
    ```

3. To trigger the workflow, simply push a new tag.

### Configuration

- `tag` _(`context.ref` by default)_

  The tag name for the new release.

- `draft` _(`false` by default)_

  Create the new release as a draft.

- `prerelease` _(`false` by default)_

  Create the new release as a pre-release.

- `token` _(`$GITHUB_TOKEN` by default)_

  The access token to use for creating the new release.
