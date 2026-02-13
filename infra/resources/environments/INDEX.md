# 📚 YAML Configuration Documentation - Index

## Quick Navigation

Benvenuto nella documentazione completa del POC YAML-based configuration per infrastruttura Terraform.

---

## 🚀 Getting Started (Prima Volta)

**Start here if**: È la tua prima volta con questo POC

1. **QUICKSTART.md** (5 min read)
   - Overview veloce del POC
   - Come testare con terraform plan
   - Decisione: approvare/rollback

2. **TEST_INSTRUCTIONS.md** (10 min read)
   - Step-by-step testing procedure
   - Checklist validazione
   - Debug guide

3. **README.md** (15 min read)
   - Guida completa all'approccio YAML
   - Benefits e best practices
   - Migration guide per altri resources
   - Rollback plan

---

## 🔄 Replicating POC (Migrazione Altri Resources)

**Start here if**: Vuoi migrare askmebot, certificates, onboarding, etc.

1. **MIGRATION_CHEATSHEET.md** (Quick reference)
   - Step-by-step checklist (15 min per resource)
   - Esempi pratici per askmebot
   - Troubleshooting comune

2. **PATTERNS.md** (Pattern library)
   - 5 pattern riutilizzabili (Simple, Medium, Complex, Conditional, DRY)
   - Naming conventions
   - Best practices

3. **migrate_to_yaml.sh** (Script helper)
   - Automatizza generazione template
   - Usage: `./migrate_to_yaml.sh <resource_name>`

---

## 📖 Documentation by Use Case

### Use Case 1: "Voglio capire cosa è stato fatto"

→ **QUICKSTART.md** (sezione "What Changed")  
→ **COMPARISON.md** (Before/After visual)

### Use Case 2: "Voglio testare il POC"

→ **TARGETED_PLAN.md** (targeted plan con -target)  
→ **TEST_INSTRUCTIONS.md** (step-by-step)  
→ **QUICKSTART.md** (sezione "Next Steps")

### Use Case 2b: "Ho modifiche DNS non mergiate nel branch"

→ **TARGETED_PLAN.md** (come fare plan solo CRM)  
→ **terraform_crm_only.sh** (script helper)

### Use Case 3: "Voglio migrare askmebot"

→ **MIGRATION_CHEATSHEET.md** (complete guide)  
→ **PATTERNS.md** (Pattern 2: Medium Complexity)  
→ **prod.yaml** (CRM example as reference)

### Use Case 4: "Voglio capire i benefici"

→ **COMPARISON.md** (metrics + examples)  
→ **README.md** (sezione "Benefits")

### Use Case 5: "Qualcosa è andato storto"

→ **TEST_INSTRUCTIONS.md** (sezione "Debug")  
→ **MIGRATION_CHEATSHEET.md** (sezione "Troubleshooting")  
→ **README.md** (sezione "Rollback Plan")

### Use Case 6: "Voglio aggiungere ambiente UAT"

→ **README.md** (sezione "How to Test" → Add UAT)  
→ **uat.yaml.example** (template ready-to-use)

---

## 📁 File Structure Reference

```
infra/resources/environments/
├── 📘 INDEX.md                      ← You are here
│
├── 🚀 Getting Started
│   ├── QUICKSTART.md                Quick overview (5 min)
│   ├── TEST_INSTRUCTIONS.md         Testing guide (10 min)
│   ├── TARGETED_PLAN.md             Safety guide for -target flag ⭐ NEW
│   └── README.md                    Complete guide (15 min)
│
├── 🔄 Migration & Patterns
│   ├── MIGRATION_CHEATSHEET.md      Step-by-step migration (15 min/resource)
│   ├── PATTERNS.md                  Reusable templates & patterns
│   └── migrate_to_yaml.sh           Helper script
│
├── 📊 Reference & Comparison
│   └── COMPARISON.md                Before/After visual guide
│
├── 📝 Configuration Files
│   ├── common.yaml                  Shared config (all environments)
│   ├── prod.yaml                    Production config (CRM Function)
│   └── uat.yaml.example             UAT template
│
└── 🔧 Terraform Code
    └── ../prod/locals_yaml.tf       YAML parser logic
```

---

## 📚 Documentation Files Summary

| File                        | Purpose                 | Read Time | When to Use                    |
| --------------------------- | ----------------------- | --------- | ------------------------------ |
| **TARGETED_PLAN.md**        | Safety guide (-target)  | 5 min     | Branch with partial changes    |
| **QUICKSTART.md**           | Quick overview & test   | 5 min     | First time, need quick context |
| **TEST_INSTRUCTIONS.md**    | Step-by-step testing    | 10 min    | Running terraform plan         |
| **README.md**               | Complete reference      | 15 min    | Need full understanding        |
| **MIGRATION_CHEATSHEET.md** | Migrate other resources | 5 min     | Replicating POC                |
| **PATTERNS.md**             | Templates library       | 10 min    | Need example patterns          |
| **COMPARISON.md**           | Before/After examples   | 10 min    | Understanding benefits         |
| **migrate_to_yaml.sh**      | Automation script       | 1 min     | Generate templates             |

---

## 🎯 Recommended Reading Path

### Path 1: First Time User (20 min)

1. QUICKSTART.md (5 min) - Get context
2. TEST_INSTRUCTIONS.md (10 min) - Run terraform plan
3. COMPARISON.md (5 min) - Understand benefits
4. **Decision**: Approve / Wait / Rollback

### Path 2: Migrating Other Resources (30 min)

1. MIGRATION_CHEATSHEET.md (10 min) - Understand process
2. PATTERNS.md (15 min) - Find matching pattern
3. prod.yaml (5 min) - Study CRM example
4. **Action**: Migrate 1 resource following checklist

### Path 3: Troubleshooting (10 min)

1. TEST_INSTRUCTIONS.md → Debug section (5 min)
2. MIGRATION_CHEATSHEET.md → Troubleshooting (5 min)
3. **Action**: Fix issue, re-run terraform plan

---

## 🔍 Quick Search

**Find by keyword**:

- **terraform plan** → TARGETED_PLAN.md, TEST_INSTRUCTIONS.md, QUICKSTART.md
- **-target flag** → TARGETED_PLAN.md
- **branch safety** → TARGETED_PLAN.md
- **DNS conflicts** → TARGETED_PLAN.md
- **migration** → MIGRATION_CHEATSHEET.md, README.md
- **rollback** → README.md (Rollback Plan section)
- **askmebot** → MIGRATION_CHEATSHEET.md (example)
- **patterns** → PATTERNS.md
- **before/after** → COMPARISON.md
- **secrets** → PATTERNS.md (Naming Conventions)
- **staging slot** → prod.yaml, PATTERNS.md
- **benefits** → COMPARISON.md, README.md
- **UAT** → README.md, uat.yaml.example

---

## 🆘 Quick Help

### "Non so da dove iniziare"

→ Start with **QUICKSTART.md**

### "terraform plan mostra errori"

→ Go to **TEST_INSTRUCTIONS.md** → Debug section

### "Voglio migrare askmebot ma non so come"

→ Follow **MIGRATION_CHEATSHEET.md** step-by-step

### "Voglio capire perché YAML è meglio"

→ Read **COMPARISON.md** (visual examples)

### "Devo fare rollback"

→ Go to **README.md** → Rollback Plan section

### "Non trovo un pattern per il mio resource"

→ Check **PATTERNS.md** → Pattern 1-5

---

## 📊 POC Status Overview

| Component                | Status      | File                    |
| ------------------------ | ----------- | ----------------------- |
| **CRM Function**         | ✅ Migrated | prod.yaml (lines 20-50) |
| **Askmebot**             | ⏳ Pending  | -                       |
| **Certificates**         | ⏳ Pending  | -                       |
| **Onboarding**           | ⏳ Pending  | -                       |
| **Portale Fatturazione** | ⏳ Pending  | -                       |
| **Frontend SMCR**        | ⏳ Pending  | -                       |
| **Backend SMCR**         | ⏳ Pending  | -                       |

**Next**: Decide if POC is successful → Migrate other resources

---

## 🎓 Learning Resources

### For Team Onboarding

1. QUICKSTART.md → Overview (5 min)
2. COMPARISON.md → See benefits (10 min)
3. prod.yaml → Study example (5 min)
4. **Result**: Understand YAML approach

### For Infrastructure Engineers

1. README.md → Full guide (15 min)
2. PATTERNS.md → Learn patterns (15 min)
3. MIGRATION_CHEATSHEET.md → Practical guide (10 min)
4. **Result**: Can migrate resources independently

### For Code Reviewers

1. COMPARISON.md → Understand changes (10 min)
2. prod.yaml + locals_yaml.tf → Review implementation (5 min)
3. **Result**: Can review YAML-based PRs

---

## 📞 Contact & Feedback

**Questions about**:

- POC implementation → See README.md
- Migration steps → See MIGRATION_CHEATSHEET.md
- Terraform errors → See TEST_INSTRUCTIONS.md → Debug

**Feedback**:

- Document issues in GitHub
- Suggest improvements in PR comments
- Update this documentation if you find gaps

---

## ✅ Quick Validation Checklist

Before making decisions, ensure you've:

- [ ] Read QUICKSTART.md
- [ ] Executed `terraform plan` (see TEST_INSTRUCTIONS.md)
- [ ] Plan showed "No changes" (idempotency verified)
- [ ] Understood benefits from COMPARISON.md
- [ ] Reviewed CRM example in prod.yaml
- [ ] Know how to rollback (README.md)

---

**Last Updated**: 2026-02-11  
**POC Status**: ✅ Complete - Awaiting terraform plan validation  
**Documentation Version**: 1.0

---

## 🎉 Quick Win

**5-Minute Test**:

```bash
# 1. Read overview
cat infra/resources/environments/QUICKSTART.md | head -50

# 2. Test POC
cd infra/resources/prod && terraform plan

# 3. If "No changes" → Success! 🎉
```

**Next Step**: Choose your path from "Recommended Reading Path" above.
