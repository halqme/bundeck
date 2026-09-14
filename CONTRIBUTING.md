# Contributing to Bundeck

Contributions to Bundeck are welcome.

## Development environment

- Bun 1.4.0 or later
- TypeScript

```bash
bun install
bun run check
bun test
bun run build
bun run verify:package
```

## Development workflow

1. Share the purpose and approach for substantial changes in an issue.
2. Add or update tests for the change.
3. When changing Markdown syntax, the public API, or configuration, update the documentation and examples as well.
4. Include a summary of the changes and the verification commands you ran in the pull request description.

## Code and tests

- When changing the public API, review `docs/API.md` and the generated declaration files.
- When changing browser runtimes, verify both view and presenter modes in a real browser when possible.

## Commits

Use a concise message that explains the change. Do not include unrelated formatting changes or generated files in a pull request.

## Releases

Releases are created from `main`; there is no release branch.

1. Update `package.json` and `CHANGELOG.md` in a pull request.
2. Merge the release preparation into `main` and wait for CI to pass.
3. Create an annotated `vX.Y.Z` tag on the intended `main` commit and push the tag.
4. The release workflow verifies that the tag matches `package.json`, verifies that the tagged commit is contained in `main`, reruns checks and tests, builds the package, verifies the npm contents, and publishes it.

Create the tag only after the pull request has been merged. A tag on a topic branch does not identify the released commit when the pull request is squash-merged or otherwise rewritten during merge.

See `docs/development.md` for the maintainer release procedure.
