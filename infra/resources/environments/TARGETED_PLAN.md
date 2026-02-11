# 🎯 Targeted Terraform Plan - Safety Guide

## Problem: "terraform plan" Affects Unrelated Resources

Quando lavori su un branch separato con modifiche parziali (es. DNS non ancora mergiato), un `terraform plan` normale mostra modifiche/eliminazioni di risorse che non vuoi toccare.

---

## ✅ Solution: Targeted Plan (Solo CRM Function)

### Metodo 1: Script Helper (Raccomandato)

```bash
# Plan SOLO CRM Function (safe)
./infra/resources/environments/terraform_crm_only.sh plan

# List CRM resources
./infra/resources/environments/terraform_crm_only.sh list

# Apply SOLO CRM Function (prompt conferma)
./infra/resources/environments/terraform_crm_only.sh apply
```

**Vantaggi**:

- ✅ Safety: Solo risorse CRM toccate
- ✅ Conferma: Prompt prima di apply
- ✅ Lista: Vedi quali risorse sono target

---

### Metodo 2: Comando Manuale

```bash
cd infra/resources/prod

# Plan solo CRM Function module
terraform plan -target=module.crm_function

# Plan con target multipli (più sicuro)
terraform plan \
  -target=module.crm_function \
  -target=azurerm_role_assignment.cd_identity_website_contrib_crm_fa \
  -target=dx_available_subnet_cidr.crm_fa_subnet_cidr
```

---

## 🔍 Come Trovare i Target Corretti

### Vedere tutte le risorse CRM nello state:

```bash
cd infra/resources/prod
terraform state list | grep -i crm
```

**Output example**:

```
azurerm_role_assignment.cd_identity_website_contrib_crm_fa
dx_available_subnet_cidr.crm_fa_subnet_cidr
module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app.this
module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app_slot.this[0]
... (20+ resources)
```

### Vedere dettagli di una risorsa specifica:

```bash
terraform state show module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app.this
```

---

## 🎯 Target Granularity Levels

### Level 1: Tutto il Module (Raccomandato per POC)

```bash
terraform plan -target=module.crm_function
```

**Include**: Function App, Staging Slot, Storage, Private Endpoints, Monitoring, Role Assignments

---

### Level 2: Solo Function App (Senza Slot)

```bash
terraform plan -target=module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app.this
```

**Include**: Solo la function app production slot

---

### Level 3: Solo Staging Slot

```bash
terraform plan -target=module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app_slot.this[0]
```

**Include**: Solo lo staging slot

---

### Level 4: Multiple Targets (Fine-grained)

```bash
terraform plan \
  -target=module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app.this \
  -target=module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app_slot.this[0]
```

**Include**: Production + Staging slot (senza storage, monitoring, etc.)

---

## ⚠️ Important Warnings

### 1. Targeted Plan Non È Completo

```bash
# Questo plan NON verifica:
# - Dipendenze esterne (DNS, network, etc.)
# - Risorse non targetate
# - Drift su risorse non incluse

terraform plan -target=module.crm_function
```

**Use case**: Testing YAML config changes (POC validation)
**NOT for**: Production deployments (usa plan completo)

---

### 2. Apply con Target È Rischioso

```bash
# ⚠️ WARNING: Questo bypassa il check di dipendenze
terraform apply -target=module.crm_function
```

**Quando è OK**:

- ✅ POC testing (no production impact)
- ✅ Rollback emergency (targeted fix)
- ✅ Development branch (can be recreated)

**Quando NON è OK**:

- ❌ Production deployments (richiede full plan)
- ❌ Inter-resource dependencies (es. DNS → Function)
- ❌ Unsure about side effects

---

### 3. Plan Output Interpretation

#### ✅ Expected (Success)

```
No changes. Your infrastructure matches the configuration.
```

**Meaning**: YAML config produce gli stessi valori della config hardcoded precedente.
**Action**: POC è idempotente ✅ Puoi procedere.

---

#### ⚠️ Unexpected (Warning)

```
Terraform will perform the following actions:

  # module.crm_function...azurerm_linux_function_app.this will be updated in-place
  ~ resource "azurerm_linux_function_app" "this" {
      ~ app_settings = {
          ~ "NODE_ENV" = "prod" -> "production"
        }
    }
```

**Meaning**: C'è una differenza tra YAML e stato attuale.
**Action**:

1. Verifica se il cambiamento è intenzionale
2. Se no, correggi YAML o locals_yaml.tf
3. Re-run plan fino a "No changes"

---

#### ❌ Critical (Failure)

```
Terraform will perform the following actions:

  # module.crm_function...azurerm_linux_function_app.this will be replaced
  -/+ resource "azurerm_linux_function_app" "this" {
        ...
      }
```

**Meaning**: Terraform vuole DISTRUGGERE e RICREARE la function!
**Action**:

1. ❌ **STOP! Non applicare!**
2. Analizza il diff: cosa è cambiato?
3. Molto probabilmente: errore critico in YAML config
4. Richiedi assistenza o fai rollback

---

## 🛡️ Safety Checklist

Prima di eseguire `terraform plan -target=...`:

- [ ] Sei su un branch separato (non main/master)
- [ ] Hai fatto backup di `locals.tf` e state file
- [ ] Sai quali risorse sono nel target (`terraform state list | grep crm`)
- [ ] Hai letto l'output del plan completamente
- [ ] Capisci ogni modifica proposta da Terraform
- [ ] Non ci sono modifiche inattese (replace, destroy)

Prima di eseguire `terraform apply -target=...`:

- [ ] Plan mostra SOLO modifiche attese
- [ ] Nessuna risorsa viene distrutta o rimpiazzata
- [ ] Hai doppio-checked app_settings critici (DYNAMICS_BASE_URL, etc.)
- [ ] Hai notificato il team (se production)
- [ ] Hai un piano di rollback pronto

---

## 📋 Common Scenarios

### Scenario 1: Testing YAML POC (This Case)

**Goal**: Verificare che YAML config = hardcoded config

```bash
# Safe: Targeted plan
./infra/resources/environments/terraform_crm_only.sh plan

# Expected: "No changes"
# If changes appear: Debug YAML → locals_yaml.tf mapping
```

---

### Scenario 2: Branch con Modifiche Parziali

**Problem**: DNS resources non ancora mergiati, plan normale li vuole eliminare

```bash
# BAD: Full plan shows DNS deletions
terraform plan  # ❌ Shows changes to DNS, etc.

# GOOD: Targeted plan ignores DNS
terraform plan -target=module.crm_function  # ✅ Only CRM
```

---

### Scenario 3: Modifica Solo App Settings

**Goal**: Cambiare FEATURE_FLAG_NEW_API senza toccare altro

```bash
# 1. Edit YAML
vim infra/resources/environments/prod.yaml
# Add: feature_flag_new_api: true

# 2. Update locals_yaml.tf
vim infra/resources/prod/locals_yaml.tf
# Add mapping

# 3. Targeted plan
terraform plan \
  -target=module.crm_function.module.azurerm_linux_function_app.azurerm_linux_function_app.this

# 4. Verify only app_settings changed
# Expected diff:
#   + FEATURE_FLAG_NEW_API = true
```

---

## 🔧 Troubleshooting

### "Error: Resource not found in state"

```
Error: Resource targeting is requesting targeting "module.crm_function"
which has no resources in the state.
```

**Cause**: Module name typo o resource non esiste in state
**Fix**:

```bash
terraform state list | grep -i crm  # Find correct name
```

---

### "Plan shows DNS deletions despite -target"

```
Plan: 0 to add, 1 to change, 5 to destroy.  # DNS being destroyed?!
```

**Cause**: State drift su risorse con dipendenze
**Fix**:

```bash
# Refresh state without modifying
terraform refresh

# Re-run targeted plan
terraform plan -target=module.crm_function
```

---

### "Apply failed: dependency error"

```
Error: Cannot apply changes to module.crm_function because it depends
on module.dns which is not targeted.
```

**Cause**: Target troppo granulare, mancano dipendenze
**Fix**: Includi dipendenze nel target

```bash
terraform plan \
  -target=module.crm_function \
  -target=module.dns  # Add dependency
```

---

## 📖 References

- Terraform Docs: https://www.terraform.io/docs/cli/commands/plan.html#resource-targeting
- When to use -target: https://www.terraform.io/docs/cli/commands/plan.html#resource-targeting-is-for-exceptional-situations

---

## ✅ Quick Commands Cheat Sheet

```bash
# List CRM resources
terraform state list | grep -i crm

# Targeted plan (safe)
terraform plan -target=module.crm_function

# Targeted plan with output file
terraform plan -target=module.crm_function -out=crm-plan.tfplan

# Apply from plan file (safer than direct apply)
terraform apply crm-plan.tfplan

# Show what would be applied
terraform show crm-plan.tfplan

# Targeted apply (interactive)
terraform apply -target=module.crm_function

# Use helper script (recommended)
./infra/resources/environments/terraform_crm_only.sh plan
```

---

**Summary**: Use `-target` per testing POC in branches con modifiche parziali. Per production, sempre usa full plan.
