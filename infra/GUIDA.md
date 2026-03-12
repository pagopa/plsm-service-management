# Guida alla gestione della configurazione Azure

Questa guida spiega come gestire le variabili delle risorse Azure tramite i file YAML
e lo script generatore, senza mai modificare `locals_yaml.tf` a mano.

---

## Struttura dei file

```
infra/
├── scripts/
│   └── generate_locals.py          ← script generatore (unico file da eseguire)
└── resources/
    ├── environments/
    │   ├── common.yaml              ← valori condivisi tra tutti gli ambienti
    │   └── prod.yaml                ← valori specifici per la produzione
    └── prod/
        └── locals_yaml.tf           ← AUTO-GENERATO, non modificare
```

**Regola fondamentale**: edita solo i file YAML, poi esegui lo script.
`locals_yaml.tf` viene riscritto automaticamente.

---

## Come eseguire lo script

```bash
# Dalla root del repository
python3 infra/scripts/generate_locals.py
```

Output atteso:

```
✓ Generato: .../infra/resources/prod/locals_yaml.tf
  Risorse processate (8): common_app_settings, certificates, onboarding, ...
```

**Prerequisiti**: Python 3.9+ e il pacchetto `pyyaml`.

```bash
pip install pyyaml
```

---

## Convenzioni YAML

### Valore normale (non segreto)

```yaml
MY_SETTING: "valore"
MY_PORT: "5432"
MY_FLAG: "true" # I booleani vanno sempre come stringa
```

→ generato: `MY_SETTING = "valore"`

### Segreto da Azure Key Vault

```yaml
MY_SECRET: "kv:nome_risorsa_terraform"
```

→ generato: `MY_SECRET = data.azurerm_key_vault_secret.nome_risorsa_terraform.value`

Il nome dopo `kv:` deve corrispondere al nome della risorsa
`data.azurerm_key_vault_secret.<nome>` definita in Terraform
(i trattini `-` vengono convertiti automaticamente in underscore `_`).

### Valori slot-specifici (production ≠ staging)

```yaml
mia_risorsa:
  __local: yaml_mia_risorsa
  SETTING_CONDIVISO: "uguale per entrambi"
  production:
    ENVIRONMENT: "production"
    APP_URL: "https://prod.example.com"
  staging:
    ENVIRONMENT: "staging"
    APP_URL: "https://staging.example.com"
```

Se `production:` e `staging:` sono identici (o assenti), lo script ottimizza
automaticamente:

```hcl
yaml_mia_risorsa_slot_app_settings = local.yaml_mia_risorsa_app_settings
```

---

## Caso 1 — Aggiungere una variabile a una risorsa esistente

### Variabile con valore diretto

1. Apri il file YAML della risorsa (`common.yaml` o `prod.yaml`)
2. Aggiungi la chiave nella sezione corretta

```yaml
# Esempio: aggiungere LOG_LEVEL a fe_smcr in prod.yaml
fe_smcr:
  __local: yaml_fe_smcr
  # ... settings esistenti ...
  LOG_LEVEL: "info" # ← aggiungi qui
```

3. Esegui lo script:

```bash
python3 infra/scripts/generate_locals.py
```

### Variabile da Key Vault

1. Assicurati che la risorsa `data.azurerm_key_vault_secret` esista già
   (o aggiungila in un file `.tf` appropriato)
2. Aggiungi nel YAML con prefisso `kv:`

```yaml
fe_smcr:
  NUOVO_SEGRETO: "kv:nome_kv_secret_resource"
```

3. Esegui lo script.

### Variabile diversa tra production e staging

```yaml
fe_smcr:
  production:
    FEATURE_FLAG: "enabled"
  staging:
    FEATURE_FLAG: "disabled"
```

---

## Caso 2 — Aggiungere una nuova risorsa Azure (esistente in TF)

Se stai aggiungendo la configurazione YAML a una risorsa Azure **già creata** in
Terraform (`.tf`), segui questi passi:

### Passo 1 — Aggiungi la sezione nel YAML

Scegli `common.yaml` se i valori sono condivisi tra ambienti, `prod.yaml` se
sono specifici per la produzione.

```yaml
# prod.yaml
nuova_risorsa:
  __local: yaml_nuova_risorsa # scegli il nome del local Terraform
  SETTING_1: "valore"
  SETTING_2: "kv:nome_kv_secret"
  production:
    ENV: "production"
  staging:
    ENV: "staging"
```

**Convenzione nomi `__local`**:

- Function App: `yaml_<nome>_func` (es. `yaml_nuova_func`)
- App Service: `yaml_<nome>` (es. `yaml_nuova_risorsa`)

### Passo 2 — Esegui lo script

```bash
python3 infra/scripts/generate_locals.py
```

Lo script scopre automaticamente la nuova sezione grazie al marker `__local`.

### Passo 3 — Collega i local in `locals.tf`

Apri `infra/resources/prod/locals.tf` e aggiungi il collegamento:

```hcl
# 8. Nuova risorsa
nuova_risorsa_app_settings      = local.yaml_nuova_risorsa_app_settings
nuova_risorsa_slot_app_settings = local.yaml_nuova_risorsa_slot_app_settings
```

### Passo 4 — Usa i local nel file `.tf` della risorsa

```hcl
# nuova_risorsa.tf
resource "azurerm_linux_function_app" "nuova_risorsa" {
  app_settings = local.nuova_risorsa_app_settings
  # ...
  dynamic "site_config" { ... }
}
```

---

## Caso 3 — Creare una nuova risorsa Azure da zero

Quando crei una risorsa completamente nuova (Function App, App Service, ecc.),
segui questa checklist completa.

### Passo 1 — Definisci la configurazione nel YAML

```yaml
# prod.yaml
nuova_func:
  __local: yaml_nuova_func
  NODE_ENV: "production"
  WEBSITE_RUN_FROM_PACKAGE: "1"
  API_URL: "https://api.example.com"
  API_KEY: "kv:nuova_func_api_key"
  production:
    DEBUG: "false"
  staging:
    DEBUG: "true"
```

### Passo 2 — Genera i local Terraform

```bash
python3 infra/scripts/generate_locals.py
```

### Passo 3 — Aggiungi il collegamento in `locals.tf`

```hcl
# infra/resources/prod/locals.tf
nuova_func_app_settings      = local.yaml_nuova_func_app_settings
nuova_func_slot_app_settings = local.yaml_nuova_func_slot_app_settings
```

### Passo 4 — Crea il file `.tf` per la risorsa

```hcl
# infra/resources/prod/nuova_func.tf
module "nuova_func" {
  source = "..."

  # Identità risorsa
  prefix          = local.environment.prefix
  env_short       = local.environment.env_short
  location        = local.environment.location
  instance_number = local.instance_number
  resource_group_name = data.azurerm_resource_group.rg.name

  # App settings (da YAML via locals.tf)
  app_settings      = local.nuova_func_app_settings
  slot_app_settings = local.nuova_func_slot_app_settings

  tags = local.tags
}
```

### Passo 5 — Aggiungi i segreti Key Vault necessari

Se la risorsa usa segreti (`kv:` nel YAML), crea la `data source` in Terraform:

```hcl
# infra/resources/prod/storage.tf (o un file dati dedicato)
data "azurerm_key_vault_secret" "nuova_func_api_key" {
  name         = "nuova-func-api-key"   # nome nel Key Vault Azure
  key_vault_id = data.azurerm_key_vault.kv.id
}
```

> Il nome del blocco Terraform (`nuova_func_api_key`) deve corrispondere
> a quello usato dopo `kv:` nel YAML.

---

## Workflow completo riassunto

```
1. Modifica YAML  →  2. Esegui script  →  3. Commit di entrambi
```

```bash
# Esempio workflow
vim infra/resources/environments/prod.yaml    # o common.yaml
python3 infra/scripts/generate_locals.py

git add infra/resources/environments/prod.yaml \
        infra/resources/prod/locals_yaml.tf
git commit -m "feat: aggiungi LOG_LEVEL a fe_smcr"
```

> **Regola di commit**: includi sempre sia il file YAML modificato che
> `locals_yaml.tf` rigenerato nello stesso commit.

---

## Dove mettere le nuove risorse: common.yaml vs prod.yaml?

| Criterio                                        | `common.yaml` | `prod.yaml` / `dev.yaml` |
| ----------------------------------------------- | ------------- | ------------------------ |
| Valori identici in tutti gli ambienti           | ✓             |                          |
| Valori diversi per prod/dev                     |               | ✓                        |
| URL pubblici, endpoint prod                     |               | ✓                        |
| URL API interni (stesso per tutti)              | ✓             |                          |
| Segreti KV (il nome resource TF è uguale)       | ✓             |                          |
| Segreti KV con resource TF diversa per ambiente |               | ✓                        |

In caso di dubbio, usa il file dell'ambiente specifico (`prod.yaml` o `dev.yaml`).

---

## Regola critica: blocchi `production:` e `staging:` nel merge

Lo script carica i YAML in ordine `common.yaml` → `<env>.yaml` e fa un **merge shallow** (primo livello).
I blocchi `production:` e `staging:` sono trattati come un'unica chiave: se `dev.yaml` non li ridefinisce entrambi, quelli di `common.yaml` sopravvivono intatti — portando eventuali URL o valori di produzione nell'ambiente dev.

**Regola**: se in `common.yaml` una risorsa ha `production:` o `staging:`, in `dev.yaml` devi sempre ridefinirli **entrambi**.

```yaml
# common.yaml
auth_func:
  __local: yaml_auth_func
  NODE_ENV: "production"
  production:
    MSAL_REDIRECT_URI: "https://plsm-p-itn-auth-func-01.azurewebsites.net/..."   # prod
  staging:
    MSAL_REDIRECT_URI: "https://plsm-p-itn-auth-func-01-staging.azurewebsites.net/..."

# dev.yaml — CORRETTO: ridefinisce ENTRAMBI i blocchi slot
auth_func:
  __local: yaml_auth_func
  NODE_ENV: "development"
  production:                          # ← obbligatorio, altrimenti eredita l'URL di prod
    MSAL_REDIRECT_URI: "https://plsm-d-itn-auth-func-01.azurewebsites.net/..."
  staging:
    MSAL_REDIRECT_URI: "https://plsm-d-itn-auth-func-01-staging.azurewebsites.net/..."
```

Per escludere completamente una risorsa di `common.yaml` in DEV, usa `__skip: true`:

```yaml
# dev.yaml
certificates:
  __skip: true # certificates-fn non deployata in DEV
```

---

## Come eseguire lo script per ambiente

```bash
python3 infra/scripts/generate_locals.py              # default: prod
python3 infra/scripts/generate_locals.py --env dev    # ambiente dev
python3 infra/scripts/generate_locals.py --env prod --verbose
```
