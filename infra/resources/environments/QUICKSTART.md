# 🎯 Quick Reference - YAML Configuration POC

## TL;DR - Cosa È Stato Fatto

Migrazione configurazione **SM-CRM-FN** da hardcoded Terraform (`locals.tf`) a YAML-based (`prod.yaml`).

**Obiettivo**: Ridurre duplicazione e semplificare gestione multi-environment.

---

## 📁 File da Controllare

### 1. Configurazione YAML (Sorgente Dati)

```bash
infra/resources/environments/
├── common.yaml              # App Insights, runtime, health check
├── prod.yaml                # CRM Function prod + staging settings
└── uat.yaml.example         # Template nuovo ambiente
```

### 2. Terraform Code (Parsing YAML)

```bash
infra/resources/prod/
├── locals_yaml.tf           # NEW: Legge YAML e crea locals
└── locals.tf                # MODIFIED: Usa local.yaml_* invece di hardcode
```

### 3. Documentazione

```bash
infra/resources/environments/
├── README.md                # Guida completa, migration guide, rollback
└── TEST_INSTRUCTIONS.md     # Step-by-step test del POC
```

---

## ⚡ Next Steps (Tu)

### Passo 1: Review Codice (5 min)

Leggi questi file in ordine:

1. `infra/resources/environments/prod.yaml` - Configurazione CRM in YAML
2. `infra/resources/prod/locals_yaml.tf` - Come YAML viene parsato
3. `infra/resources/prod/locals.tf` (linee 247-285) - Vecchio vs Nuovo

**Domanda**: La struttura YAML ti sembra chiara? Preferisci questa o hardcoded?

---

### Passo 2: Terraform Plan (3 min)

```bash
cd infra/resources/prod
terraform init  # Se necessario
terraform plan
```

**Cosa Cercare**:

- ✅ SUCCESS: "No changes. Your infrastructure matches the configuration."
- ❌ FAILURE: Mostra modifiche a `module.crm_function`

---

### Passo 3: Decisione (1 min)

Dopo il plan, decidi:

| Decisione                   | Azione                                                  |
| --------------------------- | ------------------------------------------------------- |
| ✅ **Mi piace, procediamo** | Commit su branch, poi merge a main                      |
| 🤔 **Serve più tempo**      | Tieni branch separato, test per 1-2 sprint              |
| ❌ **Rollback**             | Segui istruzioni in `README.md` sezione "Rollback Plan" |

---

## 💡 Vantaggi YAML (Reminder)

| Aspetto            | Prima (Hardcoded)                  | Dopo (YAML)                |
| ------------------ | ---------------------------------- | -------------------------- |
| **Duplicazione**   | 14 righe prod + 14 staging         | 7 righe prod + 7 staging   |
| **Aggiungere UAT** | ~2 ore (copia 10+ file)            | ~30 min (1 file YAML)      |
| **Leggibilità PR** | Diff con sintassi Terraform        | Diff YAML pulito           |
| **Maintenance**    | 5 min trovare setting in 263 righe | 30 sec in YAML strutturato |

---

## 🚨 Cosa NON È Cambiato

- ✅ Key Vault secrets (DYNAMICS_BASE_URL, etc.) - immutati
- ✅ `crm.tf` - usa locals come prima
- ✅ `data.tf` - definizioni secret Key Vault immutate
- ✅ Codice TypeScript app CRM - zero modifiche
- ✅ CI/CD pipeline - zero modifiche

**Risk Level**: 🟢 BASSO (solo refactoring configuration)

---

## 🔍 Debug (Se Plan Fallisce)

### Scenario: Plan mostra modifiche a DYNAMICS_BASE_URL

**Causa probabile**: Secret name in YAML non corrisponde a quello in Key Vault

**Fix**:

```bash
# Check secret names in Key Vault
az keyvault secret list --vault-name <nome-kv> | grep dynamics

# Verifica YAML
cat infra/resources/environments/prod.yaml | grep secret

# Deve matchare i nomi in data.tf
grep dynamics infra/resources/prod/data.tf
```

### Scenario: Errore "yamldecode: invalid YAML"

**Causa probabile**: Sintassi YAML errata (indentazione, etc.)

**Fix**:

```bash
# Valida YAML
python3 -c "import yaml; yaml.safe_load(open('infra/resources/environments/prod.yaml'))"

# Oppure usa yamllint (se installato)
brew install yamllint
yamllint infra/resources/environments/
```

---

## 📞 Domande Frequenti

### Q: Devo fare apply dopo il plan?

**A**: NO, non subito. Il plan serve solo a verificare idempotenza. Se mostra "No changes", puoi:

- Committare su branch e fare PR
- Aspettare review del team
- Eventualmente apply in futuro (ma non urgente)

### Q: Posso testare in locale senza apply?

**A**: SÌ! Usa `terraform console`:

```bash
terraform console
> local.yaml_crm_func_app_settings
> local.yaml_environment
> exit
```

### Q: Se non mi piace, come torno indietro?

**A**: Vedi `infra/resources/environments/README.md` sezione "Rollback Plan". In sintesi:

1. Decommenta vecchia config in `locals.tf`
2. Rimuovi `locals_yaml.tf` e directory `environments/`
3. `terraform plan` per verificare no changes

### Q: Quanto tempo per migrare altri resources?

**A**: Dipende dalla complessità:

- **Simple** (es. certificates): ~1 ora
- **Medium** (es. askmebot): ~2 ore
- **Complex** (es. fe_smcr): ~3-4 ore

---

## ✅ Checklist Validazione POC

Prima di decidere, verifica:

- [ ] Ho letto `prod.yaml` e capisco la struttura
- [ ] Ho letto `locals_yaml.tf` e capisco come funziona
- [ ] Ho eseguito `terraform plan` con successo
- [ ] Plan mostra "No changes" (idempotenza OK)
- [ ] Ho verificato con `terraform console` i locals generati
- [ ] Ho letto la documentazione (`README.md`, `TEST_INSTRUCTIONS.md`)
- [ ] Ho capito come fare rollback se necessario
- [ ] Ho una preferenza chiara: Approvare / Aspettare / Rollback

---

## 📊 Metriche POC

**Linee di codice**:

- YAML: ~60 righe (common.yaml + prod.yaml)
- Terraform: ~60 righe (locals_yaml.tf)
- Documentazione: ~400 righe (README + TEST_INSTRUCTIONS)
- **Total**: ~520 righe

**Tempo implementazione**: ~2 ore

**Tempo manutenzione stimato** (dopo POC):

- Modifica setting CRM: da 5 min → 30 sec
- Aggiungere nuovo env: da 2 ore → 30 min
- Review PR config: da 10 min → 2 min

**ROI**: 🟢 Positivo dopo 3-4 modifiche

---

## 🎬 Prossimo Comando

```bash
cd infra/resources/prod
terraform plan | tee plan_output.txt
```

Poi condividi `plan_output.txt` o dimmi:

- ✅ "No changes" → Approvo / Non approvo
- ❌ "Ci sono modifiche" → Invia diff per debug

---

**Ultima modifica**: 2026-02-11
**Autore**: OpenCode AI
**Status**: 🟡 POC Complete - Awaiting terraform plan
