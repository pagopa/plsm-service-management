#!/bin/bash
# =============================================================================
# Terraform Plan/Apply with CRM Target - Safety Script
# =============================================================================
# This script runs terraform plan/apply ONLY for CRM Function resources
# Use this to avoid affecting other resources (DNS, etc.) in your branch
#
# Usage:
#   ./terraform_crm_only.sh plan      # Dry-run (safe)
#   ./terraform_crm_only.sh apply     # Apply changes (careful!)
#   ./terraform_crm_only.sh list      # List CRM resources
# =============================================================================

set -e

COMMAND="${1:-plan}"
WORKDIR="/Users/lorenzo.franceschini/dev/pagopa/plsm-service-management/infra/resources/prod"

cd "$WORKDIR"

case "$COMMAND" in
  plan)
    echo "🔍 Running Terraform Plan (CRM Function only)..."
    echo ""
    echo "Target: module.crm_function"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    terraform plan \
      -target=module.crm_function \
      -target=azurerm_role_assignment.cd_identity_website_contrib_crm_fa \
      -target=dx_available_subnet_cidr.crm_fa_subnet_cidr
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Plan completed for CRM Function only"
    echo ""
    echo "Expected result: 'No changes' if YAML config matches current state"
    echo ""
    echo "⚠️  Other resources (DNS, etc.) were NOT planned - they are safe!"
    echo ""
    ;;
  
  apply)
    echo "⚠️  WARNING: You are about to APPLY changes to CRM Function!"
    echo ""
    echo "Target: module.crm_function"
    echo ""
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
      echo "❌ Aborted."
      exit 1
    fi
    
    echo ""
    echo "🚀 Applying Terraform changes (CRM Function only)..."
    echo ""
    
    terraform apply \
      -target=module.crm_function \
      -target=azurerm_role_assignment.cd_identity_website_contrib_crm_fa \
      -target=dx_available_subnet_cidr.crm_fa_subnet_cidr
    
    echo ""
    echo "✅ Apply completed for CRM Function only"
    echo ""
    ;;
  
  list)
    echo "📋 CRM Function Resources in Terraform State:"
    echo ""
    terraform state list | grep -i crm
    echo ""
    echo "Total CRM resources: $(terraform state list | grep -i crm | wc -l | xargs)"
    echo ""
    ;;
  
  *)
    echo "❌ Unknown command: $COMMAND"
    echo ""
    echo "Usage:"
    echo "  $0 plan      # Run terraform plan (safe, read-only)"
    echo "  $0 apply     # Run terraform apply (will prompt for confirmation)"
    echo "  $0 list      # List all CRM resources in state"
    echo ""
    exit 1
    ;;
esac
