# 🔑 Key Vault Secrets - Riepilogo e Pulizia

**Data:** 2026-03-08  
**Key Vault:** `plsm-p-itn-common-kv-01`

---

## ✅ Secrets NECESSARI (già creati)

### **Auth Function - Token Validation**

| Secret Name           | Status    | Uso                                 |
| --------------------- | --------- | ----------------------------------- |
| `auth-msal-client-id` | ✅ Creato | Azure AD App Registration Client ID |
| `auth-msal-tenant-id` | ✅ Creato | Azure AD Tenant ID                  |
| `auth-jwt-secret`     | ✅ Creato | Firma JWT interni per Next.js       |

**Comando per verificare:**

```bash
az keyvault secret list \
  --vault-name plsm-p-itn-common-kv-01 \
  --query "[?starts_with(name, 'auth-')].[name, attributes.created]" \
  -o table
```

**Output attuale:**

```
Column1              Column2
-------------------  -------------------------
auth-jwt-secret      2026-03-08T12:35:30+00:00
auth-msal-client-id  2026-03-08T12:35:30+00:00
auth-msal-tenant-id  2026-03-08T12:35:30+00:00
```

---

## ❌ Secrets NON NECESSARI

### **Secrets che NON servono con Token Validation approach:**

| Secret Name                  | Status        | Motivo                                       |
| ---------------------------- | ------------- | -------------------------------------------- |
| `auth-msal-client-secret`    | ❌ Mai creato | Non serve con Token Validation               |
| `auth-msal-cert-thumbprint`  | ❌ Mai creato | Non serve (Certificate-based auth non usato) |
| `auth-msal-cert-private-key` | ❌ Mai creato | Non serve (Certificate-based auth non usato) |

**Buone notizie:** ✅ **Nessun secret da eliminare!**  
Non abbiamo mai creato questi secrets, quindi il Key Vault è già pulito.

---

## 🔄 Secrets Frontend (da valutare dopo migration)

### **Secrets attualmente usati dal frontend** (potrebbero essere rimossi dopo la migrazione completa):

| Secret Name                           | Status       | Uso Attuale                | Dopo Migration                             |
| ------------------------------------- | ------------ | -------------------------- | ------------------------------------------ |
| `fe-smcr-plsm-p-platformsm-client-id` | ✅ Esistente | MSAL client-side (Next.js) | ⚠️ Da rimuovere quando migrazione completa |
| `fe-smcr-plsm-p-platformsm-tenant-id` | ✅ Esistente | MSAL client-side (Next.js) | ⚠️ Da rimuovere quando migrazione completa |

**Nota:** NON eliminare questi secrets ora! Sono ancora usati dal frontend corrente.  
Potranno essere rimossi solo dopo il completamento della **Phase 3** (Deploy & Test).

**Timeline di rimozione:**

```
Phase 0 (Infrastructure) ✅ COMPLETATA
  ↓
Phase 1 (Auth Function Code) 🚧 IN CORSO
  ↓
Phase 2 (Frontend Migration) 🚧 DA FARE
  ↓
Phase 3 (Deploy & Test) 🚧 DA FARE
  ↓
✅ Rimuovere fe-smcr-plsm-p-platformsm-* secrets
```

---

## 🧹 Comandi di Pulizia (da eseguire DOPO Phase 3)

**⚠️ NON eseguire ora! Solo dopo migrazione completata e testata!**

```bash
# Step 1: Verificare che frontend non usi più MSAL client-side
grep -r "NEXT_PUBLIC_MSAL" apps/sm-fe-smcr/

# Step 2: Se output vuoto, eliminare secrets vecchi
az keyvault secret delete \
  --vault-name plsm-p-itn-common-kv-01 \
  --name fe-smcr-plsm-p-platformsm-client-id

az keyvault secret delete \
  --vault-name plsm-p-itn-common-kv-01 \
  --name fe-smcr-plsm-p-platformsm-tenant-id

# Step 3: Rimuovere referenze in Terraform
# - Rimuovere data sources da infra/resources/prod/data.tf
# - Rimuovere da infra/resources/environments/prod.yaml (già commentati)
# - Rigenerare locals: python3 infra/scripts/generate_locals.py
```

---

## 📊 Riepilogo Stato Attuale

### **Secrets Auth Function**

```
✅ 3/3 secrets necessari creati
❌ 0/0 secrets da eliminare
```

### **Secrets Frontend (legacy)**

```
⚠️ 2 secrets esistenti (da mantenere fino a fine migration)
```

### **Action Items**

- ✅ **Nessuna azione richiesta ora** sui secrets
- ✅ Key Vault è già configurato correttamente
- ⚠️ **Ricordare** di rimuovere `fe-smcr-plsm-p-platformsm-*` dopo Phase 3

---

## 🎯 Summary

**Domanda originale:** _"Devo eliminare delle chiavi nel KV non più necessarie?"_

**Risposta:** ✅ **NO, nessuna chiave da eliminare ora!**

**Motivi:**

1. ✅ I secrets per Token Validation (`auth-*`) sono già configurati correttamente
2. ✅ Non abbiamo mai creato secrets per Client Secret o Certificate approach
3. ⚠️ I secrets frontend legacy (`fe-smcr-plsm-p-platformsm-*`) devono rimanere fino alla fine della migrazione

**Prossima azione:** Procedere con **Phase 1** (implementare il codice dell'Auth Function).

---

**Fine documento** 🎉
