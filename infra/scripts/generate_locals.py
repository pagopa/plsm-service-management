#!/usr/bin/env python3
"""
generate_locals.py
==================
Genera automaticamente locals_yaml.tf e data_kv.tf dai file YAML di configurazione.

Uso:
    python3 infra/scripts/generate_locals.py
    python3 infra/scripts/generate_locals.py --verbose   # output dettagliato step by step

I file generati sovrascrivono:
  - infra/resources/prod/locals_yaml.tf
  - infra/resources/prod/data_kv.tf
NON modificare questi file manualmente: eseguire questo script.

Convenzioni YAML
----------------
- Chiave __local: <nome>   → segna la sezione come risorsa Azure da processare.
                             Il nome diventa il prefisso del local Terraform:
                             __local: yaml_fe_smcr  →  yaml_fe_smcr_app_settings
                                                        yaml_fe_smcr_slot_app_settings

- "kv:<tf_name>"           → segreto da Azure Key Vault.
                             Il nome del segreto su Azure viene derivato
                             convertendo underscore in trattini:
                             "kv:db_host" → secret name = "db-host"
                                          → data.azurerm_key_vault_secret.db_host.value

- "kv:<tf_name>:<kv_name>" → segreto con nome Azure esplicito (quando non segue
                             la convenzione underscore→trattino):
                             "kv:db_user:postgres-username"
                               → secret name = "postgres-username"
                               → data.azurerm_key_vault_secret.db_user.value

- production: { ... }      → valori specifici per lo slot production.
- staging:    { ... }      → valori specifici per lo slot staging.
- Tutto il resto           → condiviso tra i due slot.

Sezioni speciali (senza __local)
---------------------------------
- environment              → genera local yaml_environment (da <env>.yaml)
- tags                     → genera local yaml_tags         (da <env>.yaml)

Gestione data_kv.tf
--------------------
Lo script genera data_kv.tf con i data block azurerm_key_vault_secret per tutti
i segreti referenziati nei YAML. I segreti già definiti manualmente in data.tf
vengono saltati per evitare duplicati Terraform.
"""

import re
import argparse
import sys

try:
    import yaml
except ImportError:
    print("Errore: il pacchetto 'pyyaml' non è installato.", file=sys.stderr)
    print("Esegui:  pip install pyyaml", file=sys.stderr)
    sys.exit(1)

from pathlib import Path
from datetime import datetime

# ─── Percorsi ────────────────────────────────────────────────────────────────
BASE = Path(__file__).resolve().parent.parent / "resources"
ENV_DIR = BASE / "environments"

# Riferimento al Key Vault per ambiente (usato in data_kv.tf generato)
_KV_REF = {
    "prod": "module.azure_core_infra.common_key_vault.id",
    "dev": "data.azurerm_key_vault.common_kv.id",
}

# Impostati in main() dopo il parsing degli argomenti
OUTPUT = None
DATA_TF = None
DATA_KV_OUT = None
YAML_FILES = None
KV_REF = None

# Sezioni top-level da ignorare (non sono risorse Azure)
_SKIP_SECTIONS = {
    "environment",
    "tags",
    "network",
    "app_insights",
    "common",
    "runtime",
    "health_check",
    "database",
}

# ─── Verbose logging ─────────────────────────────────────────────────────────

VERBOSE = False


def vlog(msg: str = "", indent: int = 0) -> None:
    """Stampa msg solo se VERBOSE è attivo."""
    if VERBOSE:
        prefix = "  " * indent
        print(f"{prefix}{msg}")


def step(n: int, total: int, label: str) -> None:
    """Stampa l'intestazione di uno step se VERBOSE è attivo."""
    if VERBOSE:
        print(f"\n[{n}/{total}] {label}")


# ─── CLI ─────────────────────────────────────────────────────────────────────


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Genera locals_yaml.tf e data_kv.tf dai file YAML di configurazione.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Output dettagliato step by step.",
    )
    parser.add_argument(
        "--env",
        default="prod",
        choices=list(_KV_REF.keys()),
        help="Ambiente target (default: prod).",
    )
    return parser.parse_args()


# ─── Caricamento YAML ────────────────────────────────────────────────────────


def load(filename: str) -> dict:
    path = ENV_DIR / filename
    if not path.exists():
        print(f"ATTENZIONE: {path} non trovato, ignorato.", file=sys.stderr)
        return {}
    with open(path) as f:
        return yaml.safe_load(f) or {}


# ─── Conversione valori → espressioni Terraform ──────────────────────────────


def tf_expr(val) -> str:
    """Converte un valore YAML nell'espressione Terraform corrispondente."""
    if isinstance(val, str) and val.startswith("kv:"):
        # Supporta sia "kv:tf_name" che "kv:tf_name:kv-secret-name"
        tf_name = val[3:].split(":")[0].replace("-", "_")
        return f"data.azurerm_key_vault_secret.{tf_name}.value"
    if isinstance(val, str) and val.startswith("res:"):
        # Espressione Terraform raw (es. riferimento a risorsa, non data source)
        # "res:azurerm_key_vault_secret.db_host.value" → azurerm_key_vault_secret.db_host.value
        return val[4:]
    if isinstance(val, bool):
        return f'"{str(val).lower()}"'
    return f'"{val}"'


def render_map(settings: dict, indent: int = 4) -> str:
    """Serializza un dict Python come mappa HCL Terraform."""
    if not settings:
        return "{}"
    width = max(len(k) for k in settings)
    rows = "\n".join(
        f"{' ' * indent}{k:{width}} = {tf_expr(v)}" for k, v in settings.items()
    )
    return "{\n" + rows + f"\n{' ' * (indent - 2)}}}"


# ─── Parsing della sezione app ────────────────────────────────────────────────


def split_settings(app_cfg: dict) -> tuple[dict, dict, dict]:
    """
    Separa i settings in tre bucket:
        shared       → comuni a entrambi gli slot
        prod_only    → solo slot production
        staging_only → solo slot staging
    Le chiavi che iniziano con __ sono metadata dello script e vengono ignorate.
    I valori dict non-slot (nidificati) vengono ignorati (non sono settings piatti).
    """
    shared, prod_only, staging_only = {}, {}, {}
    for k, v in (app_cfg or {}).items():
        if k.startswith("__"):
            continue  # metadata
        if k == "production":
            prod_only = {
                kk: vv for kk, vv in (v or {}).items() if not kk.startswith("__")
            }
        elif k == "staging":
            staging_only = {
                kk: vv for kk, vv in (v or {}).items() if not kk.startswith("__")
            }
        elif not isinstance(v, dict):
            shared[k] = v  # valore piatto → condiviso
        # dict non-slot → ignorato (es. sub-oggetti di configurazione infrastruttura)
    return shared, prod_only, staging_only


# ─── Generazione blocco Terraform per una risorsa ────────────────────────────


def generate_app_block(app_key: str, app_cfg: dict) -> str:
    """
    Genera il testo HCL per i local Terraform di una risorsa.
    Esempio output:

        yaml_fe_smcr_app_settings = { ... }

        yaml_fe_smcr_slot_app_settings = { ... }   # o reference se identici
    """
    local_name = app_cfg["__local"]
    shared, prod_only, staging_only = split_settings(app_cfg)

    prod = {**shared, **prod_only}
    staging = {**shared, **staging_only}

    slots_identical = prod == staging

    vlog(f"  {app_key}  →  {local_name}", indent=1)
    vlog(
        f"shared={len(shared)} key(s)  |  prod_only={len(prod_only)}  |  staging_only={len(staging_only)}",
        indent=2,
    )
    if slots_identical:
        vlog("slot identici: staging punta a production", indent=2)
    else:
        vlog("slot diversi: generati due blocchi separati", indent=2)

    lines = [
        f"  # {'─' * 60}",
        f"  # {app_key}",
        f"  # {'─' * 60}",
        "",
        f"  {local_name}_app_settings = {render_map(prod)}",
        "",
    ]

    if slots_identical:
        lines.append(
            f"  {local_name}_slot_app_settings = local.{local_name}_app_settings"
        )
    else:
        lines.append(f"  {local_name}_slot_app_settings = {render_map(staging)}")

    return "\n".join(lines)


# ─── Sezioni speciali: environment e tags ────────────────────────────────────


def generate_special_sections(prod_data: dict) -> list[str]:
    """Genera yaml_environment e yaml_tags dalla sezione prod.yaml."""
    lines = []

    env = prod_data.get("environment", {})
    if env:
        env_map = {
            "prefix": env.get("prefix", ""),
            "env_short": env.get("env_short", ""),
            "location": env.get("location", ""),
            "instance_number": env.get("instance_number", ""),
        }
        lines += [
            "  # ────────────────────────────────────────────────────────────────",
            "  # Metadati ambiente",
            "  # ────────────────────────────────────────────────────────────────",
            "",
            f"  yaml_environment = {render_map(env_map)}",
            "",
        ]

    tags = prod_data.get("tags", {})
    if tags:
        lines.append(f"  yaml_tags = {render_map(tags)}")

    return lines


# ─── Raccolta riferimenti KV dai YAML ────────────────────────────────────────


def _iter_kv_values(app_cfg: dict):
    """Itera su tutti i valori kv: di una sezione app (shared + production + staging)."""
    for k, v in (app_cfg or {}).items():
        if k.startswith("__"):
            continue
        if k in ("production", "staging"):
            for vv in (v or {}).values():
                if isinstance(vv, str) and vv.startswith("kv:"):
                    yield vv
        elif isinstance(v, str) and v.startswith("kv:"):
            yield v


def collect_kv_refs(seen: dict[str, dict]) -> dict[str, str]:
    """
    Raccoglie tutti i riferimenti kv: unici da tutte le sezioni app.
    Restituisce: { tf_resource_name → kv_secret_name }

    Sintassi supportata:
      "kv:db_host"                  → tf_name=db_host,   kv_name=db-host
      "kv:db_user:postgres-username" → tf_name=db_user,   kv_name=postgres-username
    """
    refs: dict[str, str] = {}
    for app_key, app_cfg in seen.items():
        app_refs: list[tuple[str, str]] = []
        for raw in _iter_kv_values(app_cfg):
            parts = raw[3:].split(":", 1)
            tf_name = parts[0].replace("-", "_")
            kv_name = parts[1] if len(parts) > 1 else tf_name.replace("_", "-")
            if tf_name not in refs:
                app_refs.append((tf_name, kv_name))
            refs[tf_name] = kv_name
        if VERBOSE and app_refs:
            vlog(f"{app_key}  ({len(app_refs)} riferimenti kv:)", indent=1)
            for tf_name, kv_name in app_refs:
                explicit = (
                    " [nome esplicito]"
                    if f":{kv_name}" in f"kv:{tf_name.replace('_', '-')}:{kv_name}"
                    and tf_name.replace("_", "-") != kv_name
                    else ""
                )
                vlog(f'{tf_name}  →  "{kv_name}"{explicit}', indent=2)
    return refs


# ─── Lettura data.tf esistente ───────────────────────────────────────────────


def load_existing_kv_resource_names(path: Path) -> set[str]:
    """
    Legge i nomi dei data block azurerm_key_vault_secret già presenti in data.tf.
    Usato per evitare di generare duplicati in data_kv.tf.
    """
    if not path.exists():
        return set()
    content = path.read_text()
    return set(re.findall(r'data\s+"azurerm_key_vault_secret"\s+"(\w+)"', content))


# ─── Generazione data_kv.tf ──────────────────────────────────────────────────


def generate_data_kv_file(
    kv_refs: dict[str, str],
    already_in_data_tf: set[str],
    timestamp: str,
) -> tuple[str, list[str]]:
    """
    Genera il contenuto di data_kv.tf.
    Restituisce (contenuto_file, lista_nomi_skippati).
    """
    skipped = sorted(k for k in kv_refs if k in already_in_data_tf)
    to_generate = {k: v for k, v in kv_refs.items() if k not in already_in_data_tf}

    if VERBOSE:
        for tf_name in sorted(kv_refs):
            if tf_name in already_in_data_tf:
                vlog(f"SKIP  {tf_name}  (già in data.tf)", indent=1)
            else:
                vlog(f'NEW   {tf_name}  →  "{kv_refs[tf_name]}"', indent=1)

    lines = [
        "# =============================================================================",
        "# AUTO-GENERATED — NON modificare manualmente.",
        f"# Generato il: {timestamp}",
        f"# Per aggiornare: python3 infra/scripts/generate_locals.py --env {ENV_NAME}",
        "# =============================================================================",
        "",
    ]

    if not to_generate:
        lines += [
            "# Nessun segreto KV da generare: tutti già definiti in data.tf.",
            "",
        ]
        return "\n".join(lines), skipped

    for tf_name, kv_name in sorted(to_generate.items()):
        lines += [
            f'data "azurerm_key_vault_secret" "{tf_name}" {{',
            f'  name         = "{kv_name}"',
            f"  key_vault_id = {KV_REF}",
            "}",
            "",
        ]

    return "\n".join(lines), skipped


# ─── Main ─────────────────────────────────────────────────────────────────────


def main():
    global VERBOSE, OUTPUT, DATA_TF, DATA_KV_OUT, YAML_FILES, KV_REF, ENV_NAME
    args = parse_args()
    VERBOSE = args.verbose
    ENV_NAME = args.env

    OUTPUT = BASE / ENV_NAME / "locals_yaml.tf"
    DATA_TF = BASE / ENV_NAME / "data.tf"
    DATA_KV_OUT = BASE / ENV_NAME / "data_kv.tf"
    YAML_FILES = ["common.yaml", f"{ENV_NAME}.yaml"]
    KV_REF = _KV_REF[ENV_NAME]

    print(f"Ambiente: {ENV_NAME}  |  KV ref: {KV_REF}")

    TOTAL_STEPS = 5

    # ── Step 1: Caricamento YAML ─────────────────────────────────────────────
    step(1, TOTAL_STEPS, "Caricamento YAML")
    data: dict[str, dict] = {}
    for filename in YAML_FILES:
        source_name = filename.replace(".yaml", "")
        data[source_name] = load(filename)
        sections = [k for k in data[source_name] if k not in _SKIP_SECTIONS]
        vlog(
            f"{filename}  ({len(data[source_name])} sezioni totali, {len(sections)} risorse candidate)",
            indent=1,
        )

    # ── Step 2: Scoperta risorse con __local ─────────────────────────────────
    step(2, TOTAL_STEPS, "Scoperta risorse con __local")
    seen: dict[str, dict] = {}
    for source_name in ["common", ENV_NAME]:
        for app_key, app_cfg in data[source_name].items():
            if app_key in _SKIP_SECTIONS:
                continue
            if not isinstance(app_cfg, dict):
                continue
            if app_cfg.get("__skip", False):
                vlog(f"SKIP  {app_key}  (__skip: true)", indent=1)
                seen.pop(app_key, None)  # rimuovi se già aggiunto da common.yaml
                continue
            if "__local" not in app_cfg:
                vlog(f"SKIP  {app_key}  (nessun __local, ignorata)", indent=1)
                continue
            if app_key in seen:
                seen[app_key] = {**seen[app_key], **app_cfg}
                vlog(
                    f"MERGE {app_key}  →  {app_cfg['__local']}  (prod.yaml arricchisce common.yaml)",
                    indent=1,
                )
            else:
                seen[app_key] = app_cfg
                vlog(
                    f"OK    {app_key}  →  {app_cfg['__local']}  (da {source_name}.yaml)",
                    indent=1,
                )

    if not seen:
        print(
            "ERRORE: nessuna sezione con __local trovata nei file YAML.",
            file=sys.stderr,
        )
        sys.exit(1)

    vlog(f"\nTotale risorse da processare: {len(seen)}", indent=0)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    # ── Step 3: Generazione locals_yaml.tf ──────────────────────────────────
    step(3, TOTAL_STEPS, "Generazione locals_yaml.tf")
    out = [
        "# =============================================================================",
        "# AUTO-GENERATED — NON modificare manualmente.",
        f"# Generato il: {timestamp}",
        f"# Per aggiornare: python3 infra/scripts/generate_locals.py --env {ENV_NAME}",
        "# =============================================================================",
        "",
        "locals {",
    ]

    for app_key, app_cfg in seen.items():
        out.append("")
        out.append(generate_app_block(app_key, app_cfg))

    special = generate_special_sections(data.get(ENV_NAME, {}))
    if special:
        out.append("")
        out.extend(
            f"  {line}" if line and not line.startswith("  ") else line
            for line in special
        )
        vlog("sezioni speciali: yaml_environment + yaml_tags", indent=1)

    out.append("}\n")

    OUTPUT.write_text("\n".join(out))
    vlog(f"scritto: {OUTPUT}", indent=1)

    # ── Step 4: Raccolta riferimenti Key Vault ───────────────────────────────
    step(4, TOTAL_STEPS, "Raccolta riferimenti Key Vault dai YAML")
    kv_refs = collect_kv_refs(seen)
    vlog(f"\nTotale riferimenti kv: unici trovati: {len(kv_refs)}", indent=0)

    step(5, TOTAL_STEPS, f"Lettura data.tf + generazione data_kv.tf")
    already_in_data = load_existing_kv_resource_names(DATA_TF)
    vlog(
        f"data.tf: {len(already_in_data)} data block azurerm_key_vault_secret esistenti",
        indent=1,
    )
    vlog()

    content, skipped = generate_data_kv_file(kv_refs, already_in_data, timestamp)

    DATA_KV_OUT.write_text(content)
    vlog(f"\nscritto: {DATA_KV_OUT}", indent=1)

    # ── Riepilogo finale ─────────────────────────────────────────────────────
    new_count = len(kv_refs) - len(skipped)
    print(f"\n✓ Generato: {OUTPUT}")
    print(f"  Risorse processate ({len(seen)}): {', '.join(seen.keys())}")
    print(f"✓ Generato: {DATA_KV_OUT}")
    print(
        f"  Segreti KV nel YAML: {len(kv_refs)}  |  generati: {new_count}  |  già in data.tf (skippati): {len(skipped)}"
    )
    if skipped and not VERBOSE:
        print(f"  Skippati: {', '.join(skipped)}")


if __name__ == "__main__":
    main()
