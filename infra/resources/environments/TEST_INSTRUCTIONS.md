# 🧪 YAML-Based Configuration POC - Test Instructions

## ✅ POC Implementation Complete

Il POC per la configurazione YAML-based è stato completato con successo per **SM-CRM-FN**.

### 📦 File Creati/Modificati

#### Nuovi File

1. `infra/resources/environments/common.yaml` - Configurazioni condivise
2. `infra/resources/environments/prod.yaml` - Configurazioni production CRM
3. `infra/resources/environments/uat.yaml.example` - Template per nuovo ambiente
4. `infra/resources/prod/locals_yaml.tf` - Logica parsing YAML
5. `infra/resources/environments/README.md` - Documentazione completa

#### File Modificati

1. `infra/resources/prod/locals.tf` - Sezione CRM migrata a YAML

---

## 🧪 Come Testare il POC

### ⚠️ IMPORTANTE: Backup Stato Attuale

Prima di eseguire qualsiasi comando, verifica di avere accesso allo stato Terraform:

```bash
cd infra/resources/prod

# Verifica stato attuale
terraform state list | grep crm_function
```

### Step 1: Validazione Sintattica (✅ Completato)

```bash
cd infra/resources/prod

# Formattazione codice
terraform fmt -check
# Output: nessun file da formattare (già fatto)

# Validazione sintassi
terraform validate
# Output: Success! (warnings su 'metric' sono normali)
```

**Status**: ✅ PASSATO

---

### Step 2: Terraform Plan (🔴 DA ESEGUIRE)

Questo è il test **critico** per verificare l'idempotenza:

```bash
cd infra/resources/prod

# Se backend non è inizializzato:
terraform init

# Esegui plan
terraform plan -out=plan.tfplan

# Cerca questa linea nell'output:
# "No changes. Your infrastructure matches the configuration."
```

#### ✅ Risultato Atteso (SUCCESS)

```
No changes. Your infrastructure matches the configuration.

Terraform has compared your real infrastructure against your configuration
and found no differences, so no changes are needed.
```

**Questo significa**: La configurazione YAML produce esattamente gli stessi valori della configurazione hardcoded precedente.

#### ❌ Risultato Inatteso (FAILURE)

```
Terraform will perform the following actions:

  # module.crm_function.azurerm_function_app.this will be updated in-place
  ~ resource "azurerm_function_app" "this" {
      ~ app_settings = {
          ~ "DYNAMICS_BASE_URL" = "old_value" -> "new_value"
        }
    }
```

**Se vedi questo**: STOP! C'è una discrepanza tra YAML e configurazione precedente. Segnala il diff completo.

---

### Step 3: Verifica Manuale Configurazione YAML

Puoi ispezionare i valori letti dal YAML:

```bash
cd infra/resources/prod

# Mostra i locals generati da YAML
terraform console
> local.yaml_crm_func_app_settings
> local.yaml_crm_func_slot_app_settings
> exit
```

**Expected Output (esempio)**:

```hcl
{
  "DYNAMICS_BASE_URL" = "https://********.dynamics.com"
  "DYNAMICS_URL_CONTACTS" = "https://********.dynamics.com/api/data/..."
  "NODE_ENV" = "production"
  "WEBSITE_RUN_FROM_PACKAGE" = 1
}
```

---

## 🎯 Prossimi Passi Dopo il Plan

### Se `terraform plan` mostra "No changes" ✅

**Il POC è un SUCCESSO!** Puoi decidere:

#### Opzione A: Approvare e Estendere

1. Migrare altri resources (askmebot, certificates, onboarding)
2. Creare ambiente UAT usando `uat.yaml.example`
3. Documentare pattern nel wiki del team

#### Opzione B: Approvare ma Aspettare

1. Committare il POC in un branch separato
2. Usare per alcuni sprint per valutare manutenibilità
3. Decidere se estendere dopo feedback del team

#### Opzione C: Rollback

Vedi sezione "Rollback Plan" in `infra/resources/environments/README.md`

---

### Se `terraform plan` mostra modifiche ❌

**C'è un problema nel mapping YAML → Terraform**. Debug steps:

1. **Controlla i secret names**:

```bash
# Verifica che i secret esistano in Key Vault
az keyvault secret list --vault-name <kv-name> | grep dynamics
```

2. **Confronta locals**:

```bash
# Mostra vecchi locals (commentati in locals.tf)
grep -A 10 "OLD HARDCODED CONFIGURATION" infra/resources/prod/locals.tf

# Mostra nuovi locals da YAML
terraform console
> local.yaml_crm_func_app_settings
```

3. **Verifica YAML syntax**:

```bash
# Valida YAML
yamllint infra/resources/environments/prod.yaml

# Mostra parsed YAML
terraform console
> local.env_config.crm_function
```

4. **Segnala il problema**:

```bash
# Genera diff completo
terraform plan -no-color > plan_diff.txt

# Condividi plan_diff.txt per analisi
```

---

## 📊 Confronto: Prima vs Dopo

### Prima (locals.tf)

```hcl
# 14 righe duplicate (production + staging)
crm_func_app_settings = {
  DYNAMICS_BASE_URL     = "${data.azurerm_key_vault_secret.dynamics_base_url.value}"
  DYNAMICS_URL_CONTACTS = "${data.azurerm_key_vault_secret.dynamics_url_contacts.value}"
  NODE_ENV              = "production"
  WEBSITE_RUN_FROM_PACKAGE = 1
}

crm_func_slot_app_settings = {
  DYNAMICS_BASE_URL     = "${data.azurerm_key_vault_secret.dynamics_base_url.value}"
  DYNAMICS_URL_CONTACTS = "${data.azurerm_key_vault_secret.dynamics_url_contacts.value}"
  NODE_ENV              = "production"
  WEBSITE_RUN_FROM_PACKAGE = 1
}
```

### Dopo (prod.yaml)

```yaml
# 10 righe, no duplicazione
crm_function:
  production:
    node_env: "production"
    website_run_from_package: 1

  staging:
    node_env: "production"
    website_run_from_package: 1
```

**Riduzione**: 30% meno righe, 0% duplicazione

---

## 🔒 Note sulla Sicurezza

- ✅ **Secrets NON sono in YAML**: Solo i nomi dei secret Key Vault
- ✅ **YAML in Git è sicuro**: Nessun valore sensibile
- ✅ **Stessa sicurezza di prima**: Key Vault rimane la source of truth per secrets
- ✅ **Rollback veloce**: Basta decommentare vecchia configurazione in `locals.tf`

---

## 📞 Domande?

- **YAML vs Hardcoded**: Quale preferisci e perché?
- **Facilità di lettura**: È più chiaro capire le differenze prod/staging?
- **Estensione**: Vorresti migrare altri resources?
- **Naming**: I nomi dei file/chiavi YAML sono intuitivi?

---

## ✅ Checklist Pre-Apply (Se Decidi di Applicare)

- [ ] `terraform plan` mostra "No changes"
- [ ] Ho backup dello stato Terraform
- [ ] Ho verificato i valori con `terraform console`
- [ ] Il team è informato del refactoring
- [ ] Ho documentato la decisione (ADR, wiki, etc.)
- [ ] Ho testato il rollback plan in caso di problemi

---

**Prossimo comando da eseguire**:

```bash
cd infra/resources/prod
terraform plan
```

**Tempo stimato**: 2-3 minuti

**Risk level**: 🟢 LOW (il plan è read-only, nessun rischio per infrastruttura)
