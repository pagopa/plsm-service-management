# Release Please

- Use Conventional Commit PR titles and commit messages, e.g. `fix(sm-auth-fn): correct session renewal`. Scope and `[SMION-123]` are optional.
- `fix`, `perf`, and `deps` trigger a patch; `feat` triggers a minor; `!` or a `BREAKING CHANGE:` footer triggers a major. Other types alone do not trigger a release.
- Components are selected by changed files, not scope. Avoid empty release-triggering commits: they affect all components.
- Leave versions, the release manifest, and generated changelog entries to the bot; do not run `npm version` or `yarn version`.
- Squash-merge into `main`, preserving the PR title. Release Please maintains one aggregated release PR; merging it creates component tags and GitHub Releases, not deployments or migrations.
- Before merging a release PR, verify versions, changelogs, and successful CI on its current commit; bot PR workflows may need approval.
- Do not merge release PRs, manage release tags, publish releases, approve or trigger workflows, deploy, or run migrations without explicit user authorization. Do not bypass protections or change release configuration unless requested.
