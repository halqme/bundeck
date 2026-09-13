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

The release workflow publishes the package when a commit is pushed to the `release` branch. To release changes from `main`, merge or push the intended `main` commit to `release` after updating the version and changelog.
