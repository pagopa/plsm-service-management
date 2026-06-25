# YAML Sticky App Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the infra YAML generator so applications can declare slot-sticky app settings with `__sticky`, and mark the FE-SMCR signature function settings as sticky.

**Architecture:** `generate_locals.py` will read an optional `__sticky` list from each `__local` YAML section and emit a Terraform local named `<local>_sticky_app_setting_names`. The local app-service wrapper will expose `sticky_app_setting_names` and pass it to the upstream `pagopa-dx/azure-app-service` module. `app_fe_smcr.tf` will wire `local.yaml_fe_smcr_sticky_app_setting_names` into the FE App Service module.

**Tech Stack:** Python YAML generator, Terraform AzureRM/DX modules, YAML env configuration.

---

### Task 1: Add sticky metadata generation

**Files:**
- Modify: `infra/scripts/generate_locals.py`

- [ ] **Step 1: Add a failing generator expectation**

Manually run the existing generator after adding `__sticky` to YAML (Task 3 will add it permanently):

```yaml
__sticky:
  - SIGNATURE_FN_URL
  - SIGNATURE_FN_KEY
```

Expected before implementation: no `yaml_fe_smcr_sticky_app_setting_names` appears in `infra/resources/prod/locals_yaml.tf`.

- [ ] **Step 2: Update `generate_app_block`**

Add support for:

```python
sticky = app_cfg.get("__sticky", []) or []
```

and emit after slot settings:

```hcl
yaml_fe_smcr_sticky_app_setting_names = [
  "SIGNATURE_FN_URL",
  "SIGNATURE_FN_KEY",
]
```

If `__sticky` is missing or empty, emit:

```hcl
yaml_<name>_sticky_app_setting_names = []
```

- [ ] **Step 3: Regenerate prod locals**

Run:

```bash
python3 infra/scripts/generate_locals.py --env prod
```

Expected: `infra/resources/prod/locals_yaml.tf` contains a `yaml_fe_smcr_sticky_app_setting_names` local.

### Task 2: Expose sticky settings in the app-service wrapper

**Files:**
- Modify: `infra/resources/_modules/app_service/variables.tf`
- Modify: `infra/resources/_modules/app_service/main.tf`

- [ ] **Step 1: Add wrapper variable**

Add:

```hcl
variable "sticky_app_setting_names" {
  type        = list(string)
  default     = []
  description = "List of application setting names that are not swapped between slots."
}
```

- [ ] **Step 2: Pass variable to DX module**

In `module "azure_app_service"` add:

```hcl
sticky_app_setting_names = var.sticky_app_setting_names
```

### Task 3: Mark FE-SMCR signature settings as sticky

**Files:**
- Modify: `infra/resources/environments/prod.yaml`
- Modify: `infra/resources/prod/app_fe_smcr.tf`

- [ ] **Step 1: Add `__sticky` in YAML**

Inside `fe_smcr`, add:

```yaml
  __sticky:
    - SIGNATURE_FN_URL
    - SIGNATURE_FN_KEY
```

Keep the existing shared settings:

```yaml
  SIGNATURE_FN_URL: "https://plsm-p-itn-sig-func-01.azurewebsites.net"
  SIGNATURE_FN_KEY: "kv:fe_smcr_signature_fn_key"
```

- [ ] **Step 2: Wire FE module**

In `infra/resources/prod/app_fe_smcr.tf`, add:

```hcl
sticky_app_setting_names = local.yaml_fe_smcr_sticky_app_setting_names
```

### Task 4: Validate and commit

**Files:**
- Generated: `infra/resources/prod/locals_yaml.tf`
- Generated: `infra/resources/prod/data_kv.tf`

- [ ] **Step 1: Format Terraform**

Run:

```bash
terraform -chdir=infra/resources/prod fmt
```

- [ ] **Step 2: Run pre-commit / plan checks**

Run:

```bash
pre-commit run --files infra/resources/prod/app_fe_smcr.tf infra/resources/prod/locals_yaml.tf infra/resources/prod/data_kv.tf infra/resources/environments/prod.yaml infra/resources/_modules/app_service/main.tf infra/resources/_modules/app_service/variables.tf
```

Expected: hooks pass or only modify generated files that are then committed.

- [ ] **Step 3: Terraform plan**

Run:

```bash
terraform -chdir=infra/resources/prod plan -input=false -lock=false -no-color
```

Expected: FE-SMCR app service `sticky_settings.app_setting_names` includes `SIGNATURE_FN_URL` and `SIGNATURE_FN_KEY`; app settings include the signature URL and Key Vault secret value reference.

- [ ] **Step 4: Commit**

Commit message:

```bash
git add infra/scripts/generate_locals.py infra/resources/_modules/app_service/main.tf infra/resources/_modules/app_service/variables.tf infra/resources/environments/prod.yaml infra/resources/prod/app_fe_smcr.tf infra/resources/prod/locals_yaml.tf infra/resources/prod/data_kv.tf docs/superpowers/plans/2026-06-22-yaml-sticky-app-settings.md
git commit -m "feat(infra): support sticky app settings from YAML"
```
