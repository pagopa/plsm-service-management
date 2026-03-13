# 🏗️ Infrastructure Workflow - Visual Guide

## Branch Strategy Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         MAIN BRANCH                          │
│                     (Protected, Prod)                        │
│  ✅ Auto-apply on push  │  ✅ Manual workflow_dispatch      │
└──────────────┬──────────────────────────────┬────────────────┘
               │                              │
               │                              │
    ┌──────────▼──────────┐      ┌───────────▼────────────┐
    │  infra/* branches   │      │  feature/* branches     │
    │   (Infra only)      │      │   (App code only)       │
    │                     │      │                         │
    │  ✅ Can apply       │      │  ❌ Cannot apply        │
    │  ✅ Plan on PR      │      │  ✅ Plan on PR          │
    └─────────────────────┘      └─────────────────────────┘
```

## Workflow Example: Feature PIPPO Needs KV Secret

```
Timeline →

1. Start feature development
   ┌──────────────────────┐
   │  feature/PIPPO       │
   │  (app code only)     │
   └──────────────────────┘

2. Realize: need KV secret! ⚠️

3. Create infra branch FROM main
   ┌──────────────────────┐
   │       main           │
   └──────────┬───────────┘
              │
              ├──→ infra/PIPPO-add-kv-secret
              │    (KV secret only)
              │
   ┌──────────▼───────────┐
   │  PR to main          │
   │  Review + Plan       │
   └──────────┬───────────┘
              │
4. Merge & Apply           │
   ┌──────────▼───────────┐
   │  main (updated)      │
   │  🚀 Auto-apply       │
   └──────────┬───────────┘
              │
5. Sync feature branch     │
   ┌──────────▼───────────┐
   │  feature/PIPPO       │
   │  merge main          │
   │  ← now has KV secret │
   └──────────────────────┘
              │
6. Continue development    │
              ▼
```

## Decision Tree: Should I Use infra/\* Branch?

```
┌─────────────────────────────────┐
│ I need to make a change...      │
└─────────────┬───────────────────┘
              │
              ▼
        ┌─────────┐
        │  What   │
        │ changed?│
        └────┬────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────┐
│Terraform │  │App Code  │
│  files?  │  │  files?  │
└────┬─────┘  └────┬─────┘
     │             │
     ▼             ▼
  ┌─────────┐  ┌──────────┐
  │  YES    │  │   NO     │
  └────┬────┘  └────┬─────┘
       │            │
       ▼            ▼
┌────────────┐  ┌──────────────┐
│Use infra/* │  │Use feature/* │
│  branch    │  │   branch     │
└────────────┘  └──────────────┘
```

## File Organization

```
plsm-service-management/
│
├── infra/                    ← Infrastructure code
│   ├── resources/
│   │   ├── prod/            ← Production Terraform
│   │   ├── dev/             ← Development Terraform
│   │   └── _modules/        ← Shared modules
│   └── docs/
│
├── apps/                     ← Application code
│   ├── sm-auth-fn/
│   └── sm-api/
│
└── .github/
    └── workflows/
        ├── infra_plan.yaml   ← Plan on every PR
        ├── infra_apply.yaml  ← Apply from main/infra/*
        └── infra_check_branch.yaml ← Check branch naming
```

## PR Flow Comparison

### ✅ Correct: infra/\* Branch

```
Developer:
  git checkout main
  git checkout -b infra/add-kv-secret
  # Edit infra/resources/prod/secrets.tf
  git commit -m "feat(infra): add KV secret"
  git push
  gh pr create

GitHub Actions:
  ✅ Terraform plan (automatic)
  📝 Plan posted to PR comments
  👀 Team reviews
  ✅ Approved & merged

  🚀 Terraform apply (automatic on merge to main)
  ✅ Secret created in Azure

Developer:
  git checkout feature/PIPPO
  git merge main
  # Continue development with new secret
```

### ❌ Incorrect: Feature Branch with Infra

```
Developer:
  git checkout -b feature/PIPPO
  # Edit both app code AND infra
  git commit -m "Add feature with infra"
  git push
  gh pr create

GitHub Actions:
  ✅ Terraform plan (automatic)
  ❌ Cannot apply from feature branch
  ⚠️  Warning: infra changes on non-infra branch

Result:
  - Infra changes NOT applied
  - App expects resources that don't exist
  - Deployment fails
  - Manual intervention needed
```

## Branch Permissions Matrix

| Branch Type | Terraform Plan | Terraform Apply | Auto-Apply | Manual Apply | Typical Changes |
| ----------- | -------------- | --------------- | ---------- | ------------ | --------------- |
| `main`      | ✅ On PR       | ✅ Yes          | ✅ Yes     | ✅ Yes       | Merged code     |
| `infra/*`   | ✅ On PR       | ✅ Yes          | ❌ No      | ✅ Yes       | Infra only      |
| `feature/*` | ✅ On PR       | ❌ No           | ❌ No      | ❌ No        | App code        |
| `fix/*`     | ✅ On PR       | ❌ No           | ❌ No      | ❌ No        | Bug fixes       |
| `hotfix/*`  | ✅ On PR       | ❌ No           | ❌ No      | ❌ No        | Urgent fixes    |

## Common Scenarios

### Scenario 1: Add Key Vault Secret

```bash
# ✅ Correct approach
git checkout main
git checkout -b infra/add-api-key-secret
vim infra/resources/prod/secrets.tf  # Add secret
git commit -m "feat(infra): add API key secret"
gh pr create --template infra_change.md
# Wait for merge → auto-apply
git checkout feature/new-api
git merge main  # Get the new secret
```

### Scenario 2: Update App Service Config

```bash
# ✅ Correct approach
git checkout main
git checkout -b infra/update-app-settings
vim infra/resources/prod/app_service.tf  # Update settings
git commit -m "feat(infra): add CORS and timeout settings"
gh pr create --template infra_change.md
```

### Scenario 3: Multiple Infra Changes

```bash
# ✅ Create separate branches for each concern
git checkout -b infra/add-function-app
# ... work on function app ...
git push

git checkout main
git checkout -b infra/add-kv-secrets
# ... work on secrets ...
git push

# Merge them in order:
# 1. infra/add-function-app (creates the function)
# 2. infra/add-kv-secrets (adds secrets for function)
```

## Troubleshooting

### "My PR shows unexpected deletions in terraform plan"

**Cause:** Your branch is out of sync with main (other infra was merged).

**Solution:**

```bash
git checkout your-infra-branch
git merge main
git push
# Review the new plan
```

### "I accidentally made infra changes in feature branch"

**Solution:**

```bash
# 1. Create proper infra branch
git checkout main
git checkout -b infra/fix-from-feature

# 2. Cherry-pick only infra commits
git cherry-pick <commit-hash-with-infra-changes>

# 3. Remove infra changes from feature branch
git checkout feature/your-branch
git revert <commit-hash-with-infra-changes>
# OR manually remove infra files
git checkout HEAD -- infra/
git commit -m "remove infra changes (moved to infra/* branch)"
```

### "Apply failed, how do I rollback?"

**Solution:**

```bash
# Find the commit before the failed change
git log --oneline

# Revert the merge
git revert <merge-commit-hash>
git push

# This will trigger auto-apply with the previous state
```

## Quick Reference

### Create Infra Branch (Automated)

```bash
./scripts/create-infra-branch.sh
```

### Create Infra Branch (Manual)

```bash
git checkout main && git pull
git checkout -b infra/your-change-name
# Make changes
git add infra/
git commit -m "feat(infra): your change"
git push -u origin infra/your-change-name
gh pr create --template infra_change.md
```

### Sync Feature Branch After Infra Merge

```bash
git checkout feature/your-branch
git merge main
git push
```

### Check Which Branch Can Apply

```bash
# View workflow file
cat .github/workflows/infra_apply.yaml

# Check your current branch
git branch --show-current
```

## Benefits of This Strategy

| Benefit                   | Description                                       |
| ------------------------- | ------------------------------------------------- |
| 🔒 **Safety**             | Only approved branches can modify infrastructure  |
| 📝 **Traceability**       | Every infra change has its own PR and audit trail |
| 🔄 **Isolation**          | Feature branches don't interfere with each other  |
| 🚀 **Speed**              | Auto-apply on merge = faster deployments          |
| 🧹 **Clean History**      | Clear separation between infra and app changes    |
| 👥 **Team Collaboration** | Easier to review and understand changes           |

---

**Questions?** See [INFRASTRUCTURE_WORKFLOW.md](./INFRASTRUCTURE_WORKFLOW.md) for detailed guide.
