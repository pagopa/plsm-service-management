# Configurazione degli Ambienti

Questo documento descrive come funziona il sistema di configurazione degli **app settings** per le Azure Functions e le App Service del progetto `plsm-service-management`.

## 📋 Indice

- [Introduzione](#introduzione)
- [Struttura dei file di configurazione](#struttura-dei-file-di-configurazione)
- [Gerarchia di override](#gerarchia-di-override)
- [Esempio pratico](#esempio-pratico)
- [Script generate_locals.py](#script-generate_localspy)
- [File locals_yaml.tf](#file-locals_yamltf)
- [Come aggiungere/modificare una variabile](#come-aggiungermodificare-una-variabile)
- [Come aggiungere un nuovo ambiente](#come-aggiungere-un-nuovo-ambiente)

---

## Introduzione

### Perché un sistema basato su YAML?

Prima dell'introduzione del sistema YAML-based, tutte le configurazioni degli app settings erano definite direttamente in file Terraform (HCL). Questo approccio presentava diversi problemi:

1. **Duplicazione del codice**: ogni modifica richiedeva la modifica di più file `.tf`
2. **Difficoltà di manutenzione**: trovare e aggiornare un singolo valore richiedeva conoscenza approfondita della struttura Terraform
3. **Barriera tecnica**: i colleghi non tecnici non potevano contribuire facilmente alle configurazioni
4. **Review complesse**: le PR contenevano mix di modifiche infrastrutturali e modifiche di configurazione

Il sistema attuale basato su YAML risolve questi problemi offrendo:

- ✅ **Single source of truth**: tutte le configurazioni in un unico posto
- ✅ **Separazione netta**: infrastruttura (Terraform) vs configurazione (YAML)
- ✅ **Self-service**: chiunque può modificare un YAML e creare una PR
- ✅ **Review più semplici**: le modifiche di configurazione sono immediatamente visibili

---

## Struttura dei file di configurazione

I file di configurazione si trovano nella cartella:

```
infra/resources/environments/
├── common.yaml          # Configurazioni condivise da tutti gli ambienti
├── dev.yaml             # Override specifici per l'ambiente DEV
├── prod.yaml            # Override specifici per l'ambiente PROD
└── uat.yaml.example     # Template di esempio per un eventuale ambiente UAT
```

### File `common.yaml`

Contiene le configurazioni **condivise** da tutti gli ambienti. Ogni sezione rappresenta una risorsa Azure (Function App o App Service).

**Convenzioni chiave:**

- **`__local: <nome>`** — marca una sezione come risorsa Azure da processare. Il nome diventa il prefisso del local Terraform generato.

  ```yaml
  certificates:
    __local: yaml_certificates_func # → genera yaml_certificates_func_app_settings
  ```

- **`kv:<tf_name>`** — riferimento a un segreto di Azure Key Vault. Il nome del segreto su Azure viene derivato convertendo underscore in trattini.

  ```yaml
  DB_HOST:
    "kv:db_host" # → data.azurerm_key_vault_secret.db_host.value
    # → nome segreto su Azure: "db-host"
  ```

- **`kv:<tf_name>:<kv_name>`** — riferimento esplicito quando il nome del segreto su Azure non segue la convenzione.

  ```yaml
  DB_USER: "kv:db_user:postgres-username" # → nome segreto: "postgres-username"
  ```

- **`production:` / `staging:`** — blocchi slot-specifici per deployment slot di Azure.
  ```yaml
  certificates:
    __local: yaml_certificates_func
    DB_HOST: "kv:db_host" # condiviso tra production e staging
    production:
      NODE_ENV: "production" # solo per lo slot production
    staging:
      NODE_ENV: "development" # solo per lo slot staging
  ```

### File `dev.yaml` e `prod.yaml`

Contengono override e integrazioni specifiche per ciascun ambiente:

- **Aggiungono** nuove sezioni non presenti in `common.yaml`
- **Arricchiscono** sezioni esistenti con nuovi settings
- **Sovrascrivono** valori già definiti in `common.yaml`
- **Escludono** risorse non deployate nell'ambiente tramite `__skip: true`

---

## Gerarchia di override

Il sistema applica i valori con questa priorità (dal più basso al più alto):

```
common.yaml → dev.yaml / prod.yaml → production/staging slot
```

### Esempio di merge

**`common.yaml`:**

```yaml
auth_func:
  __local: yaml_auth_func
  JWT_EXPIRY_SECONDS: "3600"
  JWT_ISSUER: "plsm-auth-service"
  JWT_AUDIENCE: "plsm-fe-smcr"
  NODE_ENV: "production"
```

**`prod.yaml`:**

```yaml
auth_func:
  __local: yaml_auth_func
  production:
    MSAL_REDIRECT_URI: "https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback"
  staging:
    MSAL_REDIRECT_URI: "https://plsm-p-itn-auth-func-01-staging.azurewebsites.net/api/v1/auth/callback"
    JWT_ISSUER: "plsm-auth-service-staging"
```

**Risultato finale:**

- **Slot production**: tutti i valori di `common.yaml` + `MSAL_REDIRECT_URI` da `prod.yaml`
- **Slot staging**: tutti i valori di `common.yaml` + `MSAL_REDIRECT_URI` + `JWT_ISSUER` sovrascritto da `prod.yaml`

---

## Esempio pratico

Vediamo un esempio completo di configurazione per la **Auth Function**.

### In `common.yaml`:

```yaml
auth_func:
  __local: yaml_auth_func
  # Segreti da Key Vault
  MSAL_CLIENT_ID: "kv:auth_msal_client_id"
  MSAL_TENANT_ID: "kv:auth_msal_tenant_id"
  JWT_SECRET: "kv:auth_jwt_secret"
  # Configurazione JWT
  JWT_EXPIRY_SECONDS: "3600"
  JWT_ISSUER: "plsm-auth-service"
  JWT_AUDIENCE: "plsm-fe-smcr"
  # Node.js configuration
  NODE_ENV: "production"
  WEBSITE_RUN_FROM_PACKAGE: "1"
  # Slot-specifici
  production:
    MSAL_REDIRECT_URI: "https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback"
  staging:
    MSAL_REDIRECT_URI: "https://plsm-p-itn-auth-func-01-staging.azurewebsites.net/api/v1/auth/callback"
    JWT_ISSUER: "plsm-auth-service-staging"
    JWT_AUDIENCE: "plsm-fe-smcr-staging"
```

### Output generato in `locals_yaml.tf`:

```hcl
# ────────────────────────────────────────────────────────────
# auth_func
# ────────────────────────────────────────────────────────────

yaml_auth_func_app_settings = {
  MSAL_CLIENT_ID           = data.azurerm_key_vault_secret.auth_msal_client_id.value
  MSAL_TENANT_ID           = data.azurerm_key_vault_secret.auth_msal_tenant_id.value
  JWT_SECRET               = data.azurerm_key_vault_secret.auth_jwt_secret.value
  JWT_EXPIRY_SECONDS       = "3600"
  JWT_ISSUER               = "plsm-auth-service"
  JWT_AUDIENCE             = "plsm-fe-smcr"
  NODE_ENV                 = "production"
  WEBSITE_RUN_FROM_PACKAGE = "1"
  MSAL_REDIRECT_URI        = "https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback"
}

yaml_auth_func_slot_app_settings = {
  MSAL_CLIENT_ID           = data.azurerm_key_vault_secret.auth_msal_client_id.value
  MSAL_TENANT_ID           = data.azurerm_key_vault_secret.auth_msal_tenant_id.value
  JWT_SECRET               = data.azurerm_key_vault_secret.auth_jwt_secret.value
  JWT_EXPIRY_SECONDS       = "3600"
  JWT_ISSUER               = "plsm-auth-service-staging"
  JWT_AUDIENCE             = "plsm-fe-smcr-staging"
  NODE_ENV                 = "production"
  WEBSITE_RUN_FROM_PACKAGE = "1"
  MSAL_REDIRECT_URI        = "https://plsm-p-itn-auth-func-01-staging.azurewebsites.net/api/v1/auth/callback"
}
```

### Utilizzo in Terraform:

```hcl
# In locals.tf
auth_func_app_settings      = local.yaml_auth_func_app_settings
auth_slot_func_app_settings = local.yaml_auth_func_slot_app_settings

# In function_auth.tf
module "auth_function" {
  source = "../_modules/function_app"

  app_settings      = merge(local.common_app_settings, local.auth_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.auth_slot_func_app_settings)

  # ... altre configurazioni
}
```

---

## Script `generate_locals.py`

### Cosa fa

Lo script Python `infra/scripts/generate_locals.py` automatizza la generazione di due file Terraform:

1. **`locals_yaml.tf`** — contiene i local Terraform con gli app settings per ogni risorsa
2. **`data_kv.tf`** — contiene i data block `azurerm_key_vault_secret` per i segreti referenziati

### Quando va eseguito

Lo script va eseguito **ogni volta che si modifica** uno dei file YAML di configurazione:

```bash
# Per l'ambiente di produzione (default)
python3 infra/scripts/generate_locals.py

# Per l'ambiente di sviluppo
python3 infra/scripts/generate_locals.py --env dev

# Con output dettagliato (utile per debugging)
python3 infra/scripts/generate_locals.py --verbose
```

### Output dello script

```
Ambiente: prod  |  KV ref: module.azure_core_infra.common_key_vault.id

[1/5] Caricamento YAML
[2/5] Scoperta risorse con __local
[3/5] Generazione locals_yaml.tf
[4/5] Raccolta riferimenti Key Vault dai YAML
[5/5] Lettura data.tf + generazione data_kv.tf

✓ Generato: infra/resources/prod/locals_yaml.tf
  Risorse processate (8): common_app_settings, certificates, onboarding, askmebot, auth_func, portale_fatturazione, backend_smcr, fe_smcr, crm_function
✓ Generato: infra/resources/prod/data_kv.tf
  Segreti KV nel YAML: 45  |  generati: 2  |  già in data.tf (skippati): 43
```

### Come funziona (tecnico)

1. **Carica i YAML** — legge `common.yaml` e `<env>.yaml` dalla cartella `environments/`
2. **Scopre le risorse** — identifica le sezioni con `__local` e le marca per la generazione
3. **Fa il merge** — combina i valori di `common.yaml` con gli override di `<env>.yaml`
4. **Separa gli slot** — divide i settings in `production` e `staging` (o condivisi)
5. **Genera HCL** — serializza i dizionari Python come mappe Terraform
6. **Raccoglie i segreti KV** — identifica tutti i riferimenti `kv:*` e genera i data block

---

## File `locals_yaml.tf`

### Cosa contiene

Il file `locals_yaml.tf` è **auto-generato** e contiene:

- Blocchi `local` con i settings per ogni risorsa Azure
- Suffissi `_app_settings` per lo slot production
- Suffissi `_slot_app_settings` per lo slot staging

### ⚠️ NON modificare manualmente

L'header del file è chiaro:

```hcl
# =============================================================================
# AUTO-GENERATED — NON modificare manualmente.
# Generato il: 2026-03-10 11:13
# Per aggiornare: python3 infra/scripts/generate_locals.py --env prod
# =============================================================================
```

Ogni modifica fatta a mano verrà **sovrascritta** alla prossima esecuzione dello script.

### Ottimizzazione: reference vs duplicazione

Quando i settings per `production` e `staging` sono identici, lo script ottimizza creando un reference invece di duplicare:

```hcl
yaml_certificates_func_app_settings = {
  DB_HOST = data.azurerm_key_vault_secret.db_host.value
  # ...
}

yaml_certificates_func_slot_app_settings = local.yaml_certificates_func_app_settings
```

Questo riduce la dimensione del file e rende più chiari i casi in cui gli slot sono identici.

---

## Come aggiungere/modificare una variabile

### 1. Modifica il file YAML appropriato

**Se il valore è condiviso tra ambienti:**
Aggiungi/modifica in `infra/resources/environments/common.yaml`

**Se il valore è specifico per un ambiente:**
Aggiungi/modifica in `infra/resources/environments/<env>.yaml`

### 2. Scegli la sintassi corretta

```yaml
# Valore letterale (stringa, numero, booleano)
NODE_ENV: "production"
PORT: "8080"
ENABLE_DEBUG: "true"

# Segreto da Key Vault (convenzione nome automatica)
DB_HOST: "kv:db_host"  # → secret name: "db-host"

# Segreto da Key Vault (nome esplicito)
DB_USER: "kv:db_user:postgres-username"  # → secret name: "postgres-username"

# Risorsa Terraform (solo per dev, quando le risorse sono nello stesso state)
DB_HOST: "res:azurerm_key_vault_secret.db_host.value"
```

### 3. Esegui lo script di generazione

```bash
# Per produzione
python3 infra/scripts/generate_locals.py

# Per sviluppo
python3 infra/scripts/generate_locals.py --env dev
```

### 4. Verifica i file generati

Controlla che `locals_yaml.tf` e `data_kv.tf` contengano le modifiche attese:

```bash
git diff infra/resources/prod/locals_yaml.tf
git diff infra/resources/prod/data_kv.tf
```

### 5. Se aggiungi un nuovo segreto KV

Assicurati che il segreto esista su Azure Key Vault:

```bash
# Lista i segreti esistenti
az keyvault secret list --vault-name <key-vault-name> --query "[].name" -o table

# Aggiungi un nuovo segreto
az keyvault secret set \
  --vault-name <key-vault-name> \
  --name "my-new-secret" \
  --value "my-secret-value"
```

### 6. Commit e PR

```bash
git add infra/resources/environments/*.yaml
git add infra/resources/prod/locals_yaml.tf
git add infra/resources/prod/data_kv.tf
git commit -m "feat(infra): add NEW_SETTING to auth_func"
```

---

## Come aggiungere un nuovo ambiente

### Scenario: creare un ambiente UAT

#### 1. Crea il file YAML

Copia il file di esempio:

```bash
cp infra/resources/environments/uat.yaml.example \
   infra/resources/environments/uat.yaml
```

#### 2. Personalizza le configurazioni

Modifica `uat.yaml` con i valori specifici per UAT:

```yaml
environment:
  name: "uat"
  prefix: "plsm"
  env_short: "u"
  location: "italynorth"
  instance_number: "01"

tags:
  Environment: "UAT"
  # ... altri tag

# Definisci le risorse (puoi riusare common.yaml come base)
fe_smcr:
  __local: yaml_fe_smcr
  # Override specifici per UAT
  production:
    NEXT_PUBLIC_APP_URL: "https://plsm-u-itn-fe-smcr-app-01.azurewebsites.net"
  staging:
    NEXT_PUBLIC_APP_URL: "https://plsm-u-itn-fe-smcr-app-01-staging.azurewebsites.net"
```

#### 3. Aggiorna lo script Python (se necessario)

Se UAT usa un Key Vault diverso, aggiungi la reference in `generate_locals.py`:

```python
_KV_REF = {
    "prod": "module.azure_core_infra.common_key_vault.id",
    "dev":  "data.azurerm_key_vault.common_kv.id",
    "uat":  "data.azurerm_key_vault.uat_kv.id",  # Aggiungi questa riga
}
```

#### 4. Crea la cartella Terraform per UAT

```bash
mkdir -p infra/resources/uat
```

Copia i file base da `prod/` e adattali per UAT:

```bash
cp infra/resources/prod/*.tf infra/resources/uat/
# Modifica i file copiati per riflettere l'ambiente UAT
```

#### 5. Genera i file per UAT

```bash
python3 infra/scripts/generate_locals.py --env uat
```

Questo creerà:

- `infra/resources/uat/locals_yaml.tf`
- `infra/resources/uat/data_kv.tf`

#### 6. Inizializza Terraform per UAT

```bash
cd infra/resources/uat
terraform init
terraform plan
```

#### 7. Configura CI/CD

Aggiungi l'ambiente UAT al workflow GitHub Actions:

```yaml
# .github/workflows/infra_deploy.yml
jobs:
  deploy-uat:
    runs-on: ubuntu-latest
    environment: uat
    steps:
      - name: Generate locals
        run: python3 infra/scripts/generate_locals.py --env uat

      - name: Terraform apply
        run: |
          cd infra/resources/uat
          terraform apply -auto-approve
```

---

## ✅ Best Practices

1. **Non modificare mai** `locals_yaml.tf` o `data_kv.tf` manualmente
2. **Esegui sempre** lo script dopo aver modificato i YAML
3. **Verifica con `--verbose`** se hai dubbi su come viene processato un valore
4. **Usa nomi descrittivi** per i segreti Key Vault
5. **Documenta** i valori non ovvi con commenti nei YAML
6. **Testa** le modifiche prima in DEV, poi in PROD
7. **Separa** i valori sensibili (segreti) dai valori pubblici (URL, porte)

---

## 🔍 Troubleshooting

### Lo script segnala "nessuna sezione con \_\_local trovata"

**Causa:** hai dimenticato di aggiungere `__local: <nome>` alla sezione.

**Soluzione:**

```yaml
my_app:
  __local: yaml_my_app # Aggiungi questa riga
  SETTING: "value"
```

### Terraform plan mostra un cambio anche se non ho modificato nulla

**Causa:** il file `locals_yaml.tf` è out-of-sync con i YAML.

**Soluzione:**

```bash
python3 infra/scripts/generate_locals.py --env prod
git diff  # Verifica che non ci siano differenze inattese
```

### Il segreto Key Vault non viene trovato

**Causa:** il segreto non esiste su Azure o il nome è sbagliato.

**Soluzione:**

```bash
# Verifica che il segreto esista
az keyvault secret show \
  --vault-name <vault-name> \
  --name "my-secret-name"
```

### Lo script genera data block duplicati

**Causa:** hai definito lo stesso segreto sia in `data.tf` che nei YAML.

**Soluzione:** lo script skippa automaticamente i segreti già in `data.tf`. Se il problema persiste, verifica che i nomi Terraform corrispondano esattamente.

---

## 📚 Riferimenti

- [Script generate_locals.py](../../../infra/scripts/generate_locals.py)
- [File YAML comuni](../../../infra/resources/environments/common.yaml)
- [File YAML produzione](../../../infra/resources/environments/prod.yaml)
- [File YAML sviluppo](../../../infra/resources/environments/dev.yaml)
- [Esempio UAT](../../../infra/resources/environments/uat.yaml.example)
