# 🏗️ Infrastructure Change Management Strategy

## Overview

This repository uses a **branch-based strategy** for infrastructure changes to prevent conflicts and ensure safe deployments.

## 🎯 Key Principles

1. **Infrastructure changes** MUST be made in dedicated `infra/*` branches
2. **Feature branches** should contain only application code
3. **Terraform apply** is allowed ONLY from:
   - `main` branch (auto-deploy after merge)
   - `infra/*` branches (manual workflow_dispatch)

## 🔄 Workflow Example

### Scenario: You're working on feature `PIPPO` and need to add a Key Vault secret

```bash
# 1. You're developing on feature/PIPPO
git checkout -b feature/PIPPO
# ... make application changes ...

# 2. You realize you need a new KV secret
# DON'T modify infra in feature/PIPPO!

# 3. Create a dedicated infrastructure branch FROM MAIN
git checkout main
git pull
git checkout -b infra/PIPPO-add-kv-secret

# 4. Make ONLY infrastructure changes
cd infra/resources/prod
# Edit terraform files to add KV secret
vim secrets.tf

# 5. Commit and push
git add infra/
git commit -m "feat(infra): add KV secret for PIPPO feature"
git push -u origin infra/PIPPO-add-kv-secret

# 6. Create PR to main
gh pr create --title "Infrastructure: Add KV secret for PIPPO" \
             --body "Adds Key Vault secret required by feature/PIPPO"

# 7. After PR review and merge to main:
# - Terraform apply runs automatically, OR
# - Manually trigger apply from GitHub Actions UI

# 8. Sync your feature branch with main
git checkout feature/PIPPO
git merge main  # or: git rebase main

# 9. Continue working on feature/PIPPO with the new infrastructure
```

## 🚀 Branch Naming Convention

### ✅ Allowed to Apply Infrastructure

| Branch Pattern | Auto-Apply       | Manual Apply               | Use Case                          |
| -------------- | ---------------- | -------------------------- | --------------------------------- |
| `main`         | ✅ Yes (on push) | ❌ No                      | Production deployment after merge |
| `infra/*`      | ❌ No            | ✅ Yes (workflow_dispatch) | Infrastructure-only changes       |

### ❌ NOT Allowed to Apply Infrastructure

| Branch Pattern | Terraform Plan | Terraform Apply | Use Case                     |
| -------------- | -------------- | --------------- | ---------------------------- |
| `feature/*`    | ✅ Yes (on PR) | ❌ No           | Application code development |
| `fix/*`        | ✅ Yes (on PR) | ❌ No           | Bug fixes                    |
| `hotfix/*`     | ✅ Yes (on PR) | ❌ No           | Urgent production fixes      |
| Any other      | ✅ Yes (on PR) | ❌ No           | General development          |

## 📋 Common Scenarios

### Scenario 1: Add Environment Variable to App Service

```bash
# Bad ❌
git checkout -b feature/add-new-api
# Edit infra and application code together
git commit -m "Add new API with env vars"
# ⚠️ Cannot apply infra from feature branch!

# Good ✅
git checkout main
git checkout -b infra/add-api-env-vars
# Edit only Terraform files
git commit -m "feat(infra): add env vars for new API"
# Merge to main → Apply
# Then merge main into feature/add-new-api
```

### Scenario 2: Multiple Infrastructure Changes

```bash
# Create separate infra branches for different concerns
infra/add-kv-secrets
infra/update-app-settings
infra/add-new-subnet

# Each can be:
# - Reviewed independently
# - Applied in order
# - Rolled back if needed
```

### Scenario 3: Emergency Infrastructure Fix

```bash
# Even for emergencies, use infra/* branch!
git checkout main
git checkout -b infra/hotfix-cors-settings
# Fix the issue
git commit -m "fix(infra): correct CORS settings"
# Fast-track PR review
# Apply immediately after merge
```

## 🔒 Safety Features

### Branch Protection

The workflow automatically checks branch naming:

```yaml
# .github/workflows/infra_apply.yaml
- Only main and infra/* can apply
- All other branches: terraform plan only
```

### Manual Confirmation

Workflow dispatch requires:

- Typing "apply" to confirm
- Selecting target environment (dev/prod)

### Auto-Apply on Main

When infrastructure changes merge to `main`:

- Terraform apply runs automatically
- Ensures production stays in sync with code

## 🎓 Best Practices

### DO ✅

- **Create `infra/*` branches** for ALL infrastructure changes
- **Keep infra branches small** and focused on ONE change
- **Merge infra first**, then sync feature branches
- **Review terraform plan** carefully before merging
- **Document why** you're changing infrastructure

### DON'T ❌

- **Don't mix** infrastructure and application code in the same branch
- **Don't apply** terraform from feature branches manually
- **Don't skip** the plan review step
- **Don't leave** `infra/*` branches open for long periods
- **Don't forget** to sync feature branches after infra merge

## 🔍 Workflow Automation

### On Pull Request (Any Branch)

```
1. Terraform Plan runs automatically
2. Plan output posted to PR comments
3. Branch check indicates if apply is allowed
```

### On Merge to Main (From infra/\* branch)

```
1. Terraform Apply runs automatically
2. Infrastructure deployed to production
3. Deployment status reported
```

### Manual Trigger (workflow_dispatch)

```
1. Only from main or infra/* branches
2. Select target environment (dev/prod)
3. Type "apply" to confirm
4. Apply runs with approval
```

## 📊 Monitoring

Check workflow runs:

```bash
# List recent infrastructure deployments
gh run list --workflow=infra_apply.yaml

# View specific deployment
gh run view <run-id>

# Watch live deployment
gh run watch
```

## 🆘 Troubleshooting

### "Branch not allowed to apply"

**Problem:** You tried to apply from a feature branch.

**Solution:**

```bash
# Create infra branch
git checkout main
git checkout -b infra/your-change
# Move infra files, commit, merge
```

### "State lock conflict"

**Problem:** Another apply is running.

**Solution:** Wait for the other apply to finish, or check Azure storage for stale locks.

### "Plan shows unexpected deletions"

**Problem:** Your branch is out of sync with main.

**Solution:**

```bash
git checkout your-branch
git merge main
# Review and resolve conflicts
```

## 🔗 Related Documentation

- [Terraform Apply Workflow](../.github/workflows/infra_apply.yaml)
- [Terraform Plan Workflow](../.github/workflows/infra_plan.yaml)
- [Branch Check Workflow](../.github/workflows/infra_check_branch.yaml)

## 📞 Support

For questions or issues:

1. Check this guide first
2. Review recent PRs with `infra/*` branches
3. Ask in team chat
4. Create an issue in the repository

---

**Last Updated:** 2026-03-10
**Maintained By:** DevOps Team
