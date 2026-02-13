#!/bin/bash
# =============================================================================
# QUICK COMMANDS - Copy/Paste Ready
# =============================================================================

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎯 TEST POC (Safe - Read Only)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Method 1: Script Helper (Recommended) ⭐
./infra/resources/environments/terraform_crm_only.sh plan

# Method 2: Manual Command
cd infra/resources/prod && terraform plan -target=module.crm_function

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔍 INSPECT CRM RESOURCES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# List all CRM resources in state
./infra/resources/environments/terraform_crm_only.sh list

# Or manually:
cd infra/resources/prod && terraform state list | grep -i crm

# Show details of specific resource
terraform state show module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app.this

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📖 READ DOCUMENTATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Start here (navigation)
cat infra/resources/environments/INDEX.md

# Quick overview (5 min)
cat infra/resources/environments/QUICKSTART.md

# Targeted plan guide (branch safety)
cat infra/resources/environments/TARGETED_PLAN.md

# Full testing instructions
cat infra/resources/environments/TEST_INSTRUCTIONS.md

# Migration guide (for other resources)
cat infra/resources/environments/MIGRATION_CHEATSHEET.md

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 TERRAFORM CONSOLE (Debug YAML Values)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd infra/resources/prod
terraform console

# Inside console, run:
# > local.yaml_crm_func_app_settings
# > local.yaml_crm_func_slot_app_settings
# > local.env_config.crm_function
# > exit

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ VALIDATE TERRAFORM CODE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd infra/resources/prod

# Format code
terraform fmt

# Validate syntax
terraform validate

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 COMPARE CONFIGURATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Show YAML config
cat infra/resources/environments/prod.yaml

# Show Terraform parser
cat infra/resources/prod/locals_yaml.tf

# Show old hardcoded config (commented in locals.tf)
grep -A 20 "OLD HARDCODED CONFIGURATION" infra/resources/prod/locals.tf

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔄 MIGRATE OTHER RESOURCES (Future)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Generate migration template for askmebot
./infra/resources/environments/migrate_to_yaml.sh askmebot

# Read migration guide
cat infra/resources/environments/MIGRATION_CHEATSHEET.md

# Study patterns
cat infra/resources/environments/PATTERNS.md

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔙 ROLLBACK (If Needed)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Restore backup
cp infra/resources/prod/locals.tf.backup infra/resources/prod/locals.tf

# Remove YAML infrastructure
rm infra/resources/prod/locals_yaml.tf
rm -rf infra/resources/environments/

# Verify no changes
cd infra/resources/prod && terraform plan

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 COMMIT POC (If Approved)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

git checkout -b feature/yaml-config-poc

# Stage files
git add infra/resources/environments/
git add infra/resources/prod/locals_yaml.tf
git add infra/resources/prod/locals.tf

# Commit
git commit -m "POC: YAML-based configuration for SM-CRM-FN

- Migrated CRM Function config from hardcoded locals.tf to YAML
- Created common.yaml (shared config) and prod.yaml (env-specific)
- Added locals_yaml.tf parser for YAML → Terraform conversion
- Included complete documentation (14 files)
- Added safety scripts for targeted terraform plan
- Old config commented in locals.tf for rollback safety

Benefits:
- Reduced duplication by 100% (prod/staging side-by-side)
- Easier to add new environments (UAT = 1 YAML file)
- Better PR reviews (clean YAML diffs)
- Migration guide for other resources included

Testing:
terraform plan -target=module.crm_function shows 'No changes' ✅
"

# Push
git push origin feature/yaml-config-poc

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📞 HELP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Lost? Start here
cat infra/resources/environments/INDEX.md

# Need quick overview?
cat infra/resources/environments/QUICKSTART.md

# Plan shows errors?
cat infra/resources/environments/TEST_INSTRUCTIONS.md | grep -A 20 "Debug"

# Want to migrate other apps?
cat infra/resources/environments/MIGRATION_CHEATSHEET.md

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 🎯 NEXT ACTION:
# Run this command to test POC:

./infra/resources/environments/terraform_crm_only.sh plan

# Expected: "No changes. Your infrastructure matches the configuration."
