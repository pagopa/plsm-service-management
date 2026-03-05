# Security & Configuration Guide

Questa guida spiega come gestire in sicurezza le configurazioni e i dati sensibili dell'integrazione Dynamics CRM.

## 🔐 Dati Sensibili

### Dove si trovano

L'applicazione gestisce i seguenti dati sensibili:

1. **URL Dynamics 365** - In variabili d'ambiente
2. **GUID Prodotti CRM** - Hardcoded in `_shared/utils/mappings.ts`
3. **GUID Team CRM** - Hardcoded in `_shared/utils/mappings.ts`
4. **Azure AD Credentials** - In variabili d'ambiente (solo sviluppo locale)

### ⚠️ File Sensibili

#### 🔴 NON committare MAI questi file:

- `.env` - Variabili d'ambiente locali
- `local.settings.json` - Configurazione locale Azure Functions (anche se crittografato)
- File con credenziali reali
- Backup o dump di configurazioni

#### ✅ File sicuri da committare:

- `.env.example` - Template senza valori reali
- `env_sample` - Esempio di configurazione
- File di documentazione con placeholder (es. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## 🛡️ Best Practices

### Sviluppo Locale

1. **Copia il template di configurazione:**

   ```bash
   cp .env.example .env
   ```

2. **Compila con valori reali** (NON committare):

   ```env
   DYNAMICS_BASE_URL=https://dev-<org>.crm4.dynamics.com
   AZURE_TENANT_ID=<your-tenant-id>
   AZURE_CLIENT_ID=<your-client-id>
   ```

3. **Verifica .gitignore** - Assicurati che `.env` e `local.settings.json` siano ignorati:
   ```bash
   git check-ignore .env local.settings.json
   # Deve ritornare: .env e local.settings.json
   ```

### Produzione

1. **Usa Azure Managed Identity** per l'autenticazione - NO client secrets

2. **Configura Application Settings** in Azure Portal:
   - `DYNAMICS_BASE_URL` → URL ambiente PROD
   - `NODE_ENV` → `production`
   - NON configurare `AZURE_CLIENT_SECRET`

3. **Usa Azure Key Vault** (raccomandato) per secret sensibili:
   - Connection strings
   - API keys
   - Certificati

## 📋 Variabili d'Ambiente

### Obbligatorie

| Variabile           | Descrizione           | Esempio                           |
| ------------------- | --------------------- | --------------------------------- |
| `DYNAMICS_BASE_URL` | URL base Dynamics 365 | `https://<org>.crm4.dynamics.com` |
| `NODE_ENV`          | Ambiente esecuzione   | `development` \| `production`     |

### Sviluppo Locale

| Variabile         | Descrizione                | Esempio                                |
| ----------------- | -------------------------- | -------------------------------------- |
| `AZURE_TENANT_ID` | Tenant ID Azure AD         | `00000000-0000-0000-0000-000000000000` |
| `AZURE_CLIENT_ID` | Client ID App Registration | `00000000-0000-0000-0000-000000000000` |

### Opzionali

| Variabile               | Descrizione           | Default                   |
| ----------------------- | --------------------- | ------------------------- |
| `DYNAMICS_URL_CONTACTS` | URL endpoint contatti | Costruito automaticamente |
| `DYNAMICS_SCOPE`        | Scope autenticazione  | Costruito automaticamente |

## 🔍 Verifica Sicurezza

### Prima di committare

1. **Cerca informazioni sensibili:**

   ```bash
   # Cerca URL reali Dynamics
   grep -r "crm4.dynamics.com" --exclude-dir=node_modules .

   # Cerca GUID sospetti (non placeholder)
   grep -rE "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}" \
     --exclude-dir=node_modules --exclude="*.md" .
   ```

2. **Verifica file tracciati:**

   ```bash
   git status
   # Assicurati che .env e local.settings.json NON appaiano
   ```

3. **Controlla history se necessario:**
   ```bash
   git log --all -- .env local.settings.json
   # Deve essere vuoto
   ```

### Se hai committato dati sensibili per errore

1. **NON fare solo un nuovo commit** - I dati restano nella history!

2. **Rimuovi dalla history:**

   ```bash
   # Per file specifici (usa con cautela!)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/sensitive/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Rigenera credenziali** - Le credenziali esposte devono essere revocate e rigenerate:
   - Rigenera Client Secrets in Azure AD
   - Rigenera Function Keys
   - Notifica il team di sicurezza

4. **Force push** (solo se non hai condiviso il branch):
   ```bash
   git push --force --all
   ```

## 🚨 Incident Response

### Se sospetti una compromissione:

1. ✅ **Revoca immediatamente** tutte le credenziali potenzialmente esposte
2. ✅ **Analizza i log** di accesso Azure AD e Dynamics CRM
3. ✅ **Notifica il team** di sicurezza
4. ✅ **Documenta l'incidente** con timestamp e azioni intraprese
5. ✅ **Rigenera tutte le credenziali** coinvolte

## 📚 Riferimenti

- [Azure Key Vault Best Practices](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [Managed Identity Overview](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure Functions Security](https://learn.microsoft.com/en-us/azure/azure-functions/security-concepts)

## ✅ Checklist Pre-Deploy

Prima di ogni deploy in produzione:

- [ ] Nessun file `.env` o `local.settings.json` committato
- [ ] Variabili d'ambiente configurate in Azure Application Settings
- [ ] Managed Identity abilitata e configurata
- [ ] Function Keys rotati (se necessario)
- [ ] Documentazione aggiornata senza dati sensibili
- [ ] Logs verificati per assenza di dati sensibili in output
- [ ] Team informato delle modifiche alla configurazione
