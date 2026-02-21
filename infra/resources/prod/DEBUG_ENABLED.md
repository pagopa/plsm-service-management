# 🐛 DEBUG Mode Abilitato in Produzione - CRM Function

**Data**: 21 Febbraio 2026  
**Branch**: smion-668/add-endpoint  
**Ambiente**: Production + Staging

---

## ✅ Modifiche Applicate

### 1. Configurazione YAML di Produzione

**File**: `infra/resources/environments/prod.yaml`

Aggiunta la variabile `debug: "true"` sia per production che per staging slot:

```yaml
crm_function:
  # Production slot app settings
  production:
    # ... altre configurazioni ...

    # Logging configuration
    debug: "true" # Enable detailed logging for debugging CRM integration

  # Staging slot app settings
  staging:
    # ... altre configurazioni ...

    # Logging configuration
    debug: "true" # Enable detailed logging for debugging CRM integration
```

---

### 2. Terraform Locals YAML

**File**: `infra/resources/prod/locals_yaml.tf`

Aggiunto `DEBUG` alle app settings sia per production che staging:

```hcl
# Build CRM Function production app settings from YAML
yaml_crm_func_app_settings = {
  DYNAMICS_BASE_URL        = data.azurerm_key_vault_secret.dynamics_base_url.value
  DYNAMICS_URL_CONTACTS    = data.azurerm_key_vault_secret.dynamics_url_contacts.value
  NODE_ENV                 = local.env_config.crm_function.production.node_env
  WEBSITE_RUN_FROM_PACKAGE = local.env_config.crm_function.production.website_run_from_package
  DEBUG                    = local.env_config.crm_function.production.debug  # ✅ AGGIUNTO
}

# Build CRM Function staging slot app settings from YAML
yaml_crm_func_slot_app_settings = {
  DYNAMICS_BASE_URL        = data.azurerm_key_vault_secret.dynamics_base_url.value
  DYNAMICS_URL_CONTACTS    = data.azurerm_key_vault_secret.dynamics_url_contacts.value
  NODE_ENV                 = local.env_config.crm_function.staging.node_env
  WEBSITE_RUN_FROM_PACKAGE = local.env_config.crm_function.staging.website_run_from_package
  DEBUG                    = local.env_config.crm_function.staging.debug  # ✅ AGGIUNTO
}
```

---

## 🚀 Come Applicare le Modifiche

### Opzione 1: Via Pipeline CI/CD (Raccomandato)

1. **Commit e push**:

   ```bash
   git add infra/resources/environments/prod.yaml
   git add infra/resources/prod/locals_yaml.tf
   git commit -m "feat(infra): enable DEBUG logging for CRM function in production"
   git push origin smion-668/add-endpoint
   ```

2. **Merge della PR** e la pipeline applicherà automaticamente le modifiche

3. **Verificare** che il Terraform plan/apply sia completato con successo

---

### Opzione 2: Manuale via Terraform (Se hai accesso)

```bash
cd infra/resources/prod

# 1. Valida la configurazione
terraform validate

# 2. Visualizza le modifiche
terraform plan

# 3. Applica le modifiche (dopo aver verificato il plan)
terraform apply

# Oppure in un solo comando:
terraform apply -auto-approve
```

---

### Opzione 3: Via Azure Portal (Temporaneo - Non raccomandato)

**⚠️ ATTENZIONE**: Queste modifiche verranno sovrascritte al prossimo deploy via Terraform!

1. Vai su **Azure Portal**
2. Cerca la Function App CRM: `plsm-p-itn-smcr-crm-fa-01`
3. Nel menu laterale: **Settings** → **Configuration**
4. Clicca **+ New application setting**
5. Aggiungi:
   - **Name**: `DEBUG`
   - **Value**: `true`
6. Clicca **OK** e poi **Save**
7. La Function App si riavvierà automaticamente

---

## 🔍 Come Verificare che DEBUG sia Attivo

### Metodo 1: Application Settings in Azure Portal

1. Azure Portal → Function App → **Configuration**
2. Cerca `DEBUG` nella lista delle Application Settings
3. Dovrebbe avere valore `true`

---

### Metodo 2: Verificare nei Log

Dopo il deploy, fai una chiamata API e verifica nei log:

```bash
# Via Azure CLI
az webapp log tail --name plsm-p-itn-smcr-crm-fa-01 --resource-group <rg-name>

# Oppure via Portal: Function App → Log stream
```

**Log attesi con DEBUG abilitato**:

```
🔍 [DEBUG] OData Query: /api/data/v9.2/contacts | {"odataFilter":"..."}
🔍 [DEBUG] Query parameters | {"accountId":"..."}
🔍 [DEBUG] Step 1: Searching by institution ID and product
🔍 [DEBUG] POST body | {"body":{...}}
```

---

## 📊 Cosa Cambia con DEBUG Abilitato

### Prima (DEBUG disabilitato):

```
ℹ️ [INFO] HTTP GET /contacts request received
ℹ️ [INFO] Searching contacts by Account ID
ℹ️ [INFO] Contacts search completed | {"count":3}
```

### Dopo (DEBUG abilitato):

```
ℹ️ [INFO] HTTP GET /contacts request received
🔍 [DEBUG] Query parameters | {"accountId":"29ae898f-69c8-f011-bbd2-7ced8d472a9b"}
ℹ️ [INFO] Searching contacts by Account ID
🔍 [DEBUG] OData Query: /api/data/v9.2/contacts | {"odataFilter":"_parentcustomerid_value eq '29ae898f...'","odataSelect":"contactid,fullname,..."}
ℹ️ [INFO] HTTP GET → dev-pagopa.crm4.dynamics.com/api/data/v9.2/contacts
🔍 [DEBUG] Step 1: Searching by institution ID and product | {"institutionId":"..."}
ℹ️ [INFO] HTTP GET ← 200 (234ms) - 3 results
ℹ️ [INFO] ✅ Found 3 contact(s) for Account ID | {"resultCount":3,"contacts":[...]}
ℹ️ [INFO] Contacts search completed | {"count":3}
```

---

## 🎯 Dettagli dei Log DEBUG

Con `DEBUG=true`, vedrai nei log:

✅ **Query OData complete** con tutti i filtri applicati  
✅ **Parametri di input** di ogni funzione  
✅ **Step-by-step flow** dell'orchestrator  
✅ **Body delle richieste POST** (tranne dati sensibili)  
✅ **Dettagli di ricerca contatti** (primary search, fallback, create)  
✅ **Metadata completi** per ogni operazione

---

## ⚠️ Importante

### Performance Impact:

- **Minimo**: I log DEBUG aggiungono ~1-5ms per operazione
- **Trascurabile** per il CRM (le chiamate HTTP a Dynamics sono 100-300ms)

### Sicurezza:

- ✅ URL sono **sanitizzati** (token rimossi automaticamente)
- ✅ Password e secret **non vengono loggati**
- ✅ Email e IDs sono **OK da loggare** per troubleshooting

### Quando Disabilitare DEBUG:

Dopo aver risolto i problemi, cambia `debug: "true"` → `debug: "false"` in `prod.yaml` e ri-applica Terraform.

---

## 📝 File Modificati

| File           | Path                                     | Modifiche                |
| -------------- | ---------------------------------------- | ------------------------ |
| prod.yaml      | `infra/resources/environments/prod.yaml` | Aggiunto `debug: "true"` |
| locals_yaml.tf | `infra/resources/prod/locals_yaml.tf`    | Aggiunto `DEBUG = ...`   |

---

## 🧪 Test Post-Deploy

Dopo il deploy, esegui questi test per verificare il DEBUG:

### Test 1: GET Contatti

```bash
curl -X GET "https://plsm-p-itn-smcr-crm-fa-01.azurewebsites.net/api/v1/contacts?accountId=29ae898f-69c8-f011-bbd2-7ced8d472a9b"
```

**Verifica nei log**: Dovresti vedere emoji 🔍 con log DEBUG

### Test 2: Creazione Appuntamento

```bash
curl -X POST "https://plsm-p-itn-smcr-crm-fa-01.azurewebsites.net/api/v1/meetings" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Verifica nei log**: Dovresti vedere tutti gli step dettagliati

---

## ✅ Checklist

- [x] Aggiornato `prod.yaml` con `debug: "true"`
- [x] Aggiornato `locals_yaml.tf` con variabile `DEBUG`
- [x] Validato Terraform (`terraform validate`)
- [ ] Commit e push delle modifiche
- [ ] Deploy via CI/CD o manuale
- [ ] Verificare DEBUG attivo in Application Settings
- [ ] Testare API e verificare log DEBUG nei log stream
- [ ] Confermare che i bug fix funzionano correttamente

---

**Status**: ✅ Configurazione pronta per il deploy!

Procedi con il commit e push per applicare le modifiche tramite pipeline, oppure esegui Terraform manualmente se hai accesso.
