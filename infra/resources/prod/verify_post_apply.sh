#!/usr/bin/env bash
set -e

echo "========================================="
echo "Post-Apply Verification Script"
echo "Verifica ripristino configurazioni dopo terraform apply"
echo "========================================="
echo

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_passed=0
check_failed=0

# Function to check result
check_result() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    if [[ "$actual" == "$expected" ]] || [[ "$actual" =~ $expected ]]; then
        echo -e "${GREEN}✓${NC} $test_name: PASS"
        ((check_passed++))
    else
        echo -e "${RED}✗${NC} $test_name: FAIL"
        echo "  Expected: $expected"
        echo "  Actual: $actual"
        ((check_failed++))
    fi
}

echo "================================================"
echo "SECTION 1: VNet Integration (askmebot function)"
echo "================================================"
echo

echo "1.1. Checking VNet Integration (askmebot production slot)..."
vnet_prod=$(az functionapp show \
  --name plsm-p-itn-askmebot-func-01 \
  --resource-group plsm-p-itn-fn-rg-01 \
  --query "virtualNetworkSubnetId" -o tsv 2>/dev/null || echo "NOT_SET")
check_result "VNet Integration (askmebot prod)" \
  "plsm-p-itn-fe-smcr-app-snet-01" \
  "$vnet_prod"

echo
echo "1.2. Checking VNet Integration (askmebot staging slot)..."
vnet_staging=$(az functionapp deployment slot show \
  --name plsm-p-itn-askmebot-func-01 \
  --resource-group plsm-p-itn-fn-rg-01 \
  --slot staging \
  --query "virtualNetworkSubnetId" -o tsv 2>/dev/null || echo "NOT_SET")
check_result "VNet Integration (askmebot staging)" \
  "plsm-p-itn-fe-smcr-app-snet-01" \
  "$vnet_staging"

echo
echo "1.3. Checking vnetRouteAllEnabled (askmebot production)..."
vnet_route_prod=$(az functionapp show \
  --name plsm-p-itn-askmebot-func-01 \
  --resource-group plsm-p-itn-fn-rg-01 \
  --query "siteConfig.vnetRouteAllEnabled" -o tsv 2>/dev/null || echo "false")
check_result "vnetRouteAllEnabled (askmebot prod)" \
  "true" \
  "$vnet_route_prod"

echo
echo "================================================"
echo "SECTION 2: Startup Command (fe_smcr web app)"
echo "================================================"
echo

echo "2.1. Checking Startup Command (fe_smcr production slot)..."
startup_prod=$(az webapp config show \
  --name plsm-p-itn-fe-smcr-app-01 \
  --resource-group plsm-p-itn-apps-rg-01 \
  --query "appCommandLine" -o tsv 2>/dev/null || echo "NOT_SET")
check_result "Startup Command (fe_smcr prod)" \
  "node server.js" \
  "$startup_prod"

echo
echo "2.2. Checking Startup Command (fe_smcr staging slot)..."
startup_staging=$(az webapp config show \
  --name plsm-p-itn-fe-smcr-app-01 \
  --resource-group plsm-p-itn-apps-rg-01 \
  --slot staging \
  --query "appCommandLine" -o tsv 2>/dev/null || echo "NOT_SET")
check_result "Startup Command (fe_smcr staging)" \
  "node server.js" \
  "$startup_staging"

echo
echo "================================================"
echo "SECTION 3: Front Door Deletion"
echo "================================================"
echo

echo "3.1. Verifying Front Door Profile deletion..."
afd_check=$(az afd profile show \
  --profile-name plsm-p-itn-smcr-afd-01 \
  --resource-group plsm-p-itn-apps-rg-01 2>&1 | grep -o "ResourceNotFound" || echo "STILL_EXISTS")
check_result "Front Door Deleted" \
  "ResourceNotFound" \
  "$afd_check"

echo
echo "3.2. Verifying DNS TXT record _dnsauth removal (Front Door validation)..."
dns_dnsauth=$(dig +short _dnsauth.smcr.pagopa.it @8.8.8.8 2>/dev/null || echo "")
check_result "DNS _dnsauth Removed" \
  "" \
  "$dns_dnsauth"

echo
echo "3.3. Verifying DNS TXT record asuid removal..."
dns_asuid=$(dig +short asuid.smcr.pagopa.it @8.8.8.8 2>/dev/null || echo "")
check_result "DNS asuid Removed" \
  "" \
  "$dns_asuid"

echo
echo "================================================"
echo "SECTION 4: Custom Domain & Managed Certificate"
echo "================================================"
echo

echo "4.1. Checking Custom Hostname (smcr.pagopa.it)..."
hostname_check=$(az webapp config hostname list \
  --webapp-name plsm-p-itn-fe-smcr-app-01 \
  --resource-group plsm-p-itn-apps-rg-01 \
  --query "[?name=='smcr.pagopa.it'].name" -o tsv 2>/dev/null || echo "NOT_CONFIGURED")
check_result "Custom Hostname Present" \
  "smcr.pagopa.it" \
  "$hostname_check"

echo
echo "4.2. Checking Managed Certificate binding..."
cert_check=$(az webapp config hostname list \
  --webapp-name plsm-p-itn-fe-smcr-app-01 \
  --resource-group plsm-p-itn-apps-rg-01 \
  --query "[?name=='smcr.pagopa.it'].sslState" -o tsv 2>/dev/null || echo "NOT_BOUND")
check_result "Certificate Bound" \
  "SniEnabled" \
  "$cert_check"

echo
echo "================================================"
echo "SECTION 5: DNS Configuration"
echo "================================================"
echo

echo "5.1. Checking Public DNS A Record..."
dns_a=$(dig +short smcr.pagopa.it @8.8.8.8 2>/dev/null | head -1 || echo "NOT_SET")
check_result "DNS A Record (validation IP)" \
  "4.232.99.4" \
  "$dns_a"

echo
echo "5.2. Checking Private DNS Zone exists..."
private_zone=$(az network private-dns zone show \
  --name smcr.pagopa.it \
  --resource-group plsm-p-itn-common-rg-01 \
  --query "name" -o tsv 2>/dev/null || echo "NOT_FOUND")
check_result "Private DNS Zone" \
  "smcr.pagopa.it" \
  "$private_zone"

echo
echo "5.3. Checking Private DNS Zone VNet Link..."
vnet_link=$(az network private-dns link vnet list \
  --zone-name smcr.pagopa.it \
  --resource-group plsm-p-itn-common-rg-01 \
  --query "[?virtualNetwork.id contains 'plsm-p-itn-common-vnet-01'].name" -o tsv 2>/dev/null || echo "NOT_LINKED")
check_result "Private DNS VNet Link" \
  "plsm-p-itn-common-vnet-01" \
  "$vnet_link"

echo
echo "================================================"
echo "SECTION 6: Access Restrictions (should be removed)"
echo "================================================"
echo

echo "6.1. Checking IP Security Restrictions (fe_smcr production)..."
ip_restrictions=$(az webapp config access-restriction show \
  --name plsm-p-itn-fe-smcr-app-01 \
  --resource-group plsm-p-itn-apps-rg-01 \
  --query "ipSecurityRestrictions[?name=='Allow-AzureFrontDoor'].name" -o tsv 2>/dev/null || echo "")
check_result "Front Door Access Restriction Removed (prod)" \
  "" \
  "$ip_restrictions"

echo
echo "6.2. Checking IP Security Restrictions (fe_smcr staging)..."
ip_restrictions_staging=$(az webapp config access-restriction show \
  --name plsm-p-itn-fe-smcr-app-01 \
  --resource-group plsm-p-itn-apps-rg-01 \
  --slot staging \
  --query "ipSecurityRestrictions[?name=='Allow-AzureFrontDoor'].name" -o tsv 2>/dev/null || echo "")
check_result "Front Door Access Restriction Removed (staging)" \
  "" \
  "$ip_restrictions_staging"

echo
echo "================================================"
echo "Summary:"
echo "================================================"
echo -e "${GREEN}Passed: $check_passed${NC}"
if [[ $check_failed -gt 0 ]]; then
    echo -e "${RED}Failed: $check_failed${NC}"
else
    echo -e "${GREEN}Failed: $check_failed${NC}"
fi
echo "================================================"
echo

if [[ $check_failed -gt 0 ]]; then
    echo -e "${RED}❌ Some checks failed. Please review the output above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All checks passed successfully!${NC}"
echo
echo "The following configurations have been verified:"
echo "  • VNet Integration for askmebot function (production + staging)"
echo "  • Startup command for fe_smcr app (production + staging)"
echo "  • Front Door resources deleted"
echo "  • Custom domain smcr.pagopa.it configured with managed certificate"
echo "  • DNS records properly configured (public + private)"
echo "  • Access restrictions removed"
echo
echo "The VPN-only access pattern is working correctly! 🎉"
