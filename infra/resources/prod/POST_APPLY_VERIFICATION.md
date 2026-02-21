# Post-Apply Verification Guide

## Contesto

Dopo un `terraform apply` che include modifiche ai moduli DX (pagopa-dx), alcuni settaggi possono essere rimossi e poi riapplicati dalle risorse `azapi_update_resource`.

Questo script verifica che tutte le configurazioni critiche siano state correttamente ripristinate.

## Prerequisiti

1. **Azure CLI** installato e autenticato
2. **dig** command disponibile (per verifiche DNS)
3. Permessi di lettura su:
   - Resource Group: `plsm-p-itn-apps-rg-01`
   - Resource Group: `plsm-p-itn-fn-rg-01`
   - Resource Group: `plsm-p-itn-common-rg-01`
   - Resource Group: `plsm-p-itn-network-rg-01`

## Uso

```bash
# Dalla directory infra/resources/prod/
chmod +x verify_post_apply.sh
./verify_post_apply.sh
```

## Cosa Verifica

### 1. VNet Integration (askmebot function)

- ✅ Production slot ha `virtualNetworkSubnetId` configurato
- ✅ Staging slot ha `virtualNetworkSubnetId` configurato
- ✅ `vnetRouteAllEnabled = true`

**Gestito da**: `azapi_update_resource.askmebot_vnet_integration` in `askmebot.tf`

### 2. Startup Command (fe_smcr web app)

- ✅ Production slot ha `appCommandLine = "node server.js"`
- ✅ Staging slot ha `appCommandLine = "node server.js"`

**Gestito da**: `azapi_update_resource.fe_smcr_startup_command` in `app_fe_smcr.tf`

### 3. Front Door Deletion

- ✅ Front Door Profile `plsm-p-itn-smcr-afd-01` eliminato
- ✅ DNS TXT record `_dnsauth.smcr.pagopa.it` eliminato
- ✅ DNS TXT record `asuid.smcr.pagopa.it` eliminato

### 4. Custom Domain & Managed Certificate

- ✅ Custom hostname `smcr.pagopa.it` configurato
- ✅ Managed certificate associato e attivo
- ✅ SSL binding configurato

**Gestito da**: `app_fe_smcr_custom_hostname.tf`

### 5. DNS Configuration

- ✅ Public DNS A record punta a `4.232.99.4` (validazione managed cert)
- ✅ Private DNS Zone `smcr.pagopa.it` esiste
- ✅ Private DNS Zone collegata a VNet `plsm-p-itn-common-vnet-01`

**Gestito da**: `dns_smcr.tf` e `private_dns_smcr.tf`

### 6. Access Restrictions

- ✅ Front Door access restriction rimossa da production slot
- ✅ Front Door access restriction rimossa da staging slot

## Output di Esempio

```
================================================
SECTION 1: VNet Integration (askmebot function)
================================================

1.1. Checking VNet Integration (askmebot production slot)...
✓ VNet Integration (askmebot prod): PASS

[... altre verifiche ...]

================================================
Summary:
================================================
Passed: 15
Failed: 0
================================================

✅ All checks passed successfully!

The following configurations have been verified:
  • VNet Integration for askmebot function (production + staging)
  • Startup command for fe_smcr app (production + staging)
  • Front Door resources deleted
  • Custom domain smcr.pagopa.it configured with managed certificate
  • DNS records properly configured (public + private)
  • Access restrictions removed

The VPN-only access pattern is working correctly! 🎉
```

## Troubleshooting

### Check Failed: VNet Integration

Se `virtualNetworkSubnetId` risulta `NOT_SET`:

```bash
# Verifica lo stato della risorsa azapi
terraform state show azapi_update_resource.askmebot_vnet_integration

# Re-applica solo la risorsa azapi
terraform apply -target=azapi_update_resource.askmebot_vnet_integration
```

### Check Failed: Startup Command

Se `appCommandLine` risulta `NOT_SET`:

```bash
# Verifica lo stato della risorsa azapi
terraform state show azapi_update_resource.fe_smcr_startup_command

# Re-applica solo la risorsa azapi
terraform apply -target=azapi_update_resource.fe_smcr_startup_command
```

### Check Failed: Front Door Still Exists

Se il Front Door non è stato eliminato:

```bash
# Verifica lo stato in Terraform
terraform state list | grep frontdoor

# Elimina manualmente le risorse Front Door
terraform destroy -target=azurerm_cdn_frontdoor_profile.smcr
```

### Check Failed: Custom Domain Not Configured

Se il custom hostname non è configurato:

```bash
# Verifica lo stato delle risorse custom hostname
terraform state show azurerm_app_service_custom_hostname_binding.smcr_pagopa_it

# Re-applica le risorse custom hostname
terraform apply -target=azurerm_app_service_custom_hostname_binding.smcr_pagopa_it
```

## Timing

**Quando eseguire**:

- Subito dopo `terraform apply` completo
- Dopo aver applicato modifiche ai moduli DX
- Dopo deployment via CI/CD che modifica configurazioni app

**Durata**: ~30-60 secondi

## Exit Codes

- `0`: Tutti i check passati
- `1`: Uno o più check falliti

## Note

- Le verifiche DNS pubbliche usano Google DNS (`8.8.8.8`)
- Alcune verifiche potrebbero richiedere qualche secondo per la propagazione DNS
- Lo script **non modifica** nessuna configurazione, è solo read-only
