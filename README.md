# Monorepo for Service Management

## 🏗️ Infrastructure Changes

**IMPORTANT:** Infrastructure changes MUST be made in dedicated `infra/*` branches.

### Quick Start

```bash
# Need to change infrastructure?
git checkout main
git checkout -b infra/your-change-name

# Make changes, commit, create PR
# After merge to main, terraform apply runs automatically
```

📖 **Full Guide:** [docs/INFRASTRUCTURE_WORKFLOW.md](docs/INFRASTRUCTURE_WORKFLOW.md)

## Documentation

- Infrastructure docs: `infra/docs/architecture/smcr-vpn-only-access.md`
- Infrastructure workflow: `docs/INFRASTRUCTURE_WORKFLOW.md`
