#!/bin/bash
# =============================================================================
# YAML Configuration Migration Script
# =============================================================================
# This script helps migrate other resources from hardcoded locals.tf to YAML
#
# Usage:
#   ./migrate_to_yaml.sh <resource_name>
#
# Example:
#   ./migrate_to_yaml.sh askmebot
#
# =============================================================================

set -e

RESOURCE_NAME="$1"

if [ -z "$RESOURCE_NAME" ]; then
  echo "❌ Error: Resource name required"
  echo ""
  echo "Usage: $0 <resource_name>"
  echo ""
  echo "Available resources to migrate:"
  echo "  - askmebot       (Ask Me Bot Function)"
  echo "  - certificates   (Certificates Function)"
  echo "  - onboarding     (Onboarding Function)"
  echo "  - pf             (Portale Fatturazione Function)"
  echo "  - fe_smcr        (Frontend SMCR App Service)"
  echo ""
  exit 1
fi

echo "🚀 Starting YAML migration for: $RESOURCE_NAME"
echo ""

# Variables
YAML_FILE="infra/resources/environments/prod.yaml"
LOCALS_YAML="infra/resources/prod/locals_yaml.tf"
LOCALS_TF="infra/resources/prod/locals.tf"

# Step 1: Backup
echo "📦 Step 1: Creating backup..."
cp "$LOCALS_TF" "$LOCALS_TF.backup"
echo "   ✅ Backup created: $LOCALS_TF.backup"
echo ""

# Step 2: Instructions
echo "📝 Step 2: Manual steps required"
echo ""
echo "1️⃣  Extract configuration from locals.tf"
echo "    Search for: ${RESOURCE_NAME}_func_app_settings"
echo "    Location: $LOCALS_TF"
echo ""
echo "2️⃣  Add YAML section to prod.yaml"
echo "    File: $YAML_FILE"
echo ""
echo "    Example structure:"
echo "    ---"
echo "    ${RESOURCE_NAME}_function:"
echo "      app_name: \"$RESOURCE_NAME\""
echo "      instance_number: \"01\""
echo "      production:"
echo "        # Add production slot settings here"
echo "      staging:"
echo "        # Add staging slot settings here"
echo "    ---"
echo ""
echo "3️⃣  Add YAML parser to locals_yaml.tf"
echo "    File: $LOCALS_YAML"
echo ""
echo "    Example code:"
echo "    ---"
echo "    locals {"
echo "      yaml_${RESOURCE_NAME}_func_app_settings = {"
echo "        # Map YAML → Terraform variables"
echo "        SETTING_NAME = local.env_config.${RESOURCE_NAME}_function.production.setting_name"
echo "      }"
echo "    }"
echo "    ---"
echo ""
echo "4️⃣  Update locals.tf reference"
echo "    File: $LOCALS_TF"
echo ""
echo "    Replace:"
echo "    ${RESOURCE_NAME}_func_app_settings = { ... }"
echo ""
echo "    With:"
echo "    ${RESOURCE_NAME}_func_app_settings = local.yaml_${RESOURCE_NAME}_func_app_settings"
echo ""
echo "5️⃣  Test with terraform plan"
echo "    cd infra/resources/prod"
echo "    terraform plan"
echo ""
echo "    Expected: 'No changes. Your infrastructure matches the configuration.'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 For detailed guide, see:"
echo "   infra/resources/environments/README.md (Section: Migration Guide)"
echo ""
echo "📞 Need help? Check the CRM Function example in:"
echo "   - infra/resources/environments/prod.yaml (lines 20-50)"
echo "   - infra/resources/prod/locals_yaml.tf (lines 20-60)"
echo ""
echo "🔙 Rollback: If you need to revert:"
echo "   mv $LOCALS_TF.backup $LOCALS_TF"
echo ""

exit 0
