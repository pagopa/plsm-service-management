# YAML-Based Infrastructure Configuration - POC

## Overview

This is a Proof of Concept (POC) for migrating Terraform configuration from hardcoded `locals.tf` to YAML-based external configuration files.

**Status**: ✅ POC Complete - Ready for Testing
**Scope**: SM-CRM-FN (Dynamics CRM Azure Function)
**Goal**: Validate approach before rolling out to other resources

## What Changed

### Before (Hardcoded in locals.tf)

```hcl
locals {
  crm_func_app_settings = {
    DYNAMICS_BASE_URL     = "${data.azurerm_key_vault_secret.dynamics_base_url.value}"
    DYNAMICS_URL_CONTACTS = "${data.azurerm_key_vault_secret.dynamics_url_contacts.value}"
    NODE_ENV              = "production"
    WEBSITE_RUN_FROM_PACKAGE = 1
  }

  crm_func_slot_app_settings = {
    # ... duplicated configuration ...
  }
}
```

### After (YAML-Driven)

```yaml
# infra/resources/environments/prod.yaml
crm_function:
  production:
    node_env: "production"
    website_run_from_package: 1

  staging:
    node_env: "production"
    website_run_from_package: 1
```

Configuration is loaded in `locals_yaml.tf` and referenced in `locals.tf`:

```hcl
locals {
  crm_func_app_settings = local.yaml_crm_func_app_settings
}
```

## File Structure

```
infra/
└── resources/
    ├── environments/           # NEW: YAML configuration files
    │   ├── common.yaml         # Shared across all environments
    │   └── prod.yaml           # Production-specific config
    └── prod/
        ├── locals.tf           # MODIFIED: Now references YAML
        ├── locals_yaml.tf      # NEW: YAML parsing logic
        └── crm.tf              # UNCHANGED: Uses locals as before
```

## Benefits

### 1. **Reduced Duplication**

- Production and staging slot configs are side-by-side in YAML
- Common settings defined once in `common.yaml`
- **Before**: 14 lines duplicated
- **After**: 7 lines per slot (50% reduction)

### 2. **Easier to Add New Environments**

```bash
# Add UAT environment
cp environments/prod.yaml environments/uat.yaml
vim environments/uat.yaml  # Edit 3-4 values
terraform workspace new uat
terraform plan
```

**Before**: ~2-3 hours (copy 10+ files, modify 500+ lines)
**After**: ~30 minutes (create 1 YAML file, ~30 lines)

### 3. **Better PR Reviews**

- Configuration changes are visible in clean YAML diffs
- No need to parse Terraform syntax to understand config changes
- Clear separation between infrastructure code and configuration

### 4. **Type Safety**

- YAML schema can be validated before `terraform plan`
- Typos in config keys are caught early
- IDE autocomplete support (with YAML schema)

## How to Test

### Step 1: Validate Syntax

```bash
cd infra/resources/prod
terraform fmt -check
terraform validate
```

**Expected**: ✅ No errors (warnings about deprecated `metric` are OK)

### Step 2: Run Terraform Plan (Idempotency Test)

```bash
# Initialize backend (if not already done)
terraform init

# Run plan - should show NO CHANGES
terraform plan
```

**Expected**: `No changes. Your infrastructure matches the configuration.`

If you see changes to `crm_function` app settings, **STOP** and report the diff. This means the YAML configuration doesn't match the current state.

### Step 3: Verify in Azure Portal (Optional)

After confirming idempotency, you can double-check the Function App settings:

1. Go to Azure Portal → Function Apps → `plsm-p-itn-crm-fn-01`
2. Navigate to Configuration → Application settings
3. Verify these keys exist with correct values:
   - `DYNAMICS_BASE_URL`
   - `DYNAMICS_URL_CONTACTS`
   - `NODE_ENV`
   - `WEBSITE_RUN_FROM_PACKAGE`

## Migration Guide (For Other Resources)

If this POC is successful, here's how to migrate other resources:

### 1. Identify the Resource

Example: `askmebot_func_app_settings` (currently 26 lines in `locals.tf`)

### 2. Add to prod.yaml

```yaml
askmebot_function:
  production:
    servicename: "Ask Me Bot"
    node_env: "production"
    smtp_host: "smtp.gmail.com"
    # ... other settings

  staging:
    # ... staging-specific overrides
```

### 3. Add to locals_yaml.tf

```hcl
locals {
  yaml_askmebot_func_app_settings = {
    SERVICENAME = local.env_config.askmebot_function.production.servicename
    NODE_ENV    = local.env_config.askmebot_function.production.node_env
    # ... map YAML to Terraform variables
  }
}
```

### 4. Update locals.tf

```hcl
locals {
  # OLD (comment out)
  # askmebot_func_app_settings = { ... }

  # NEW
  askmebot_func_app_settings = local.yaml_askmebot_func_app_settings
}
```

### 5. Test

```bash
terraform plan  # Should show no changes
```

## Rollback Plan

If the POC fails or you decide not to proceed:

1. Uncomment the old configuration in `locals.tf`:

```bash
# Revert locals.tf to use hardcoded values
git diff HEAD~1 infra/resources/prod/locals.tf
# Manually uncomment the "OLD HARDCODED CONFIGURATION" section
```

2. Remove YAML files:

```bash
rm -rf infra/resources/environments/
rm infra/resources/prod/locals_yaml.tf
```

3. Run `terraform plan` to verify no changes

## Questions & Feedback

### Q: Does this require `terraform apply` for every config change?

**A**: Yes, but that's intentional and good practice. Terraform tracks changes and ensures state consistency. The time savings come from easier editing and reduced errors, not from skipping the apply step.

### Q: What about secrets?

**A**: Secrets remain in Azure Key Vault. YAML only contains the **name** of the secret (e.g., `dynamics_base_url_secret: "fa-crm-dynamics-base-url"`), not the value itself.

### Q: Can I validate YAML before plan?

**A**: Yes! Use a YAML linter:

```bash
# Install yamllint
brew install yamllint

# Validate
yamllint infra/resources/environments/
```

### Q: What if I need environment-specific logic?

**A**: Keep complex logic in Terraform. YAML is for **data**, not **code**. Use Terraform conditionals for environment-specific behavior.

---

## Next Steps

1. ✅ **You are here**: Review POC implementation
2. ⏳ **Run `terraform plan`**: Verify idempotency (no changes)
3. ⏳ **Decision**: Approve or reject approach
4. If approved:
   - Migrate 1-2 more resources (e.g., askmebot, certificates)
   - Document patterns in team wiki
   - Create YAML schema for validation
5. If rejected:
   - Document reasons
   - Execute rollback plan
   - Keep current hardcoded approach

---

**POC Author**: OpenCode AI
**Date**: 2026-02-11
**Terraform Version**: 4.57.0
**Azure Provider**: hashicorp/azurerm ~>4
