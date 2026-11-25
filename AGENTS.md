# Agent Instructions

## Commits

- Follow Conventional Commits: `type(scope): description`. Scope and `[SMION-123]` are optional; use the component name as scope when relevant.
- Choose the type that matches the change: `feat`, `fix`, `perf`, `deps`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`, or `revert`.
- Write a concise, imperative description, e.g. `fix(sm-auth-fn): correct session renewal` or `docs: clarify setup instructions`. Keep each commit focused on one logical change.
- Mark breaking changes with `!` before the colon and explain them in the commit body. Use the same Conventional Commit format for PR titles.

## Release Please

- `fix`, `perf`, and `deps` trigger a patch; `feat` triggers a minor; `!` or a `BREAKING CHANGE:` footer triggers a major. Other types alone do not trigger a release.
- Components are selected by changed files, not scope. Avoid empty release-triggering commits: they affect all components.
- Leave versions, the release manifest, and generated changelog entries to the bot; do not run `npm version` or `yarn version`.
- Squash-merge into `main`, preserving the PR title. Release Please maintains one aggregated release PR; merging it creates component tags and GitHub Releases, not deployments or migrations.
- Before merging a release PR, verify versions, changelogs, and successful CI on its current commit; bot PR workflows may need approval.
- Do not merge release PRs, manage release tags, publish releases, approve or trigger workflows, deploy, or run migrations without explicit user authorization. Do not bypass protections or change release configuration unless requested.
