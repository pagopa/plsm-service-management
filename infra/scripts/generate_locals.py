#!/usr/bin/env python3
"""
generate_locals.py
==================
Genera automaticamente locals_yaml.tf dai file YAML di configurazione.

Uso:
    python3 infra/scripts/generate_locals.py

Il file generato sovrascrive infra/resources/prod/locals_yaml.tf.
NON modificare locals_yaml.tf manualmente: eseguire questo script.

Convenzioni YAML
----------------
- Chiave __local: <nome>   → segna la sezione come risorsa Azure da processare.
                             Il nome diventa il prefisso del local Terraform:
                             __local: yaml_fe_smcr  →  yaml_fe_smcr_app_settings
                                                        yaml_fe_smcr_slot_app_settings

- "kv:<resource_name>"     → segreto da Azure Key Vault.
                             "kv:db_host" → data.azurerm_key_vault_secret.db_host.value
                             I trattini vengono convertiti in underscore automaticamente.

- production: { ... }      → valori specifici per lo slot production.
- staging:    { ... }      → valori specifici per lo slot staging.
- Tutto il resto           → condiviso tra i due slot.

Sezioni speciali (senza __local)
---------------------------------
- environment              → genera local yaml_environment (da prod.yaml)
- tags                     → genera local yaml_tags         (da prod.yaml)
"""

import yaml
import sys
from pathlib import Path
from datetime import datetime

# ─── Percorsi ────────────────────────────────────────────────────────────────
BASE    = Path(__file__).resolve().parent.parent / "resources"
ENV_DIR = BASE / "environments"
OUTPUT  = BASE / "prod" / "locals_yaml.tf"

YAML_FILES = ["common.yaml", "prod.yaml"]   # ordine di lettura; prod sovrascrive common in caso di duplicati

# Sezioni top-level da ignorare (non sono risorse Azure)
_SKIP_SECTIONS = {"environment", "tags", "network", "app_insights", "common",
                  "runtime", "health_check", "database"}


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
        ref = val[3:].replace("-", "_")
        return f"data.azurerm_key_vault_secret.{ref}.value"
    if isinstance(val, bool):
        return f'"{str(val).lower()}"'
    return f'"{val}"'


def render_map(settings: dict, indent: int = 4) -> str:
    """Serializza un dict Python come mappa HCL Terraform."""
    if not settings:
        return "{}"
    width = max(len(k) for k in settings)
    rows = "\n".join(
        f"{' ' * indent}{k:{width}} = {tf_expr(v)}"
        for k, v in settings.items()
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
            continue            # metadata
        if k == "production":
            prod_only = {kk: vv for kk, vv in (v or {}).items() if not kk.startswith("__")}
        elif k == "staging":
            staging_only = {kk: vv for kk, vv in (v or {}).items() if not kk.startswith("__")}
        elif not isinstance(v, dict):
            shared[k] = v       # valore piatto → condiviso
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

    prod    = {**shared, **prod_only}
    staging = {**shared, **staging_only}

    lines = [
        f"  # {'─' * 60}",
        f"  # {app_key}",
        f"  # {'─' * 60}",
        "",
        f"  {local_name}_app_settings = {render_map(prod)}",
        "",
    ]

    if prod == staging:
        # Slot identici: lo staging punta al production → zero duplicazione
        lines.append(f"  {local_name}_slot_app_settings = local.{local_name}_app_settings")
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
            "prefix":          env.get("prefix", ""),
            "env_short":       env.get("env_short", ""),
            "location":        env.get("location", ""),
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


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    # Carica i YAML; prod.yaml ha priorità in caso di chiave duplicata
    data: dict[str, dict] = {}
    for filename in YAML_FILES:
        source_name = filename.replace(".yaml", "")
        data[source_name] = load(filename)

    # Scoperta automatica delle risorse (sezioni con __local)
    seen: dict[str, dict] = {}      # app_key → app_cfg
    for source_name in ["common", "prod"]:
        for app_key, app_cfg in data[source_name].items():
            if app_key in _SKIP_SECTIONS:
                continue
            if not isinstance(app_cfg, dict):
                continue
            if "__local" not in app_cfg:
                continue
            if app_key in seen:
                # Merge: prod.yaml arricchisce/sovrascrive common.yaml
                seen[app_key] = {**seen[app_key], **app_cfg}
            else:
                seen[app_key] = app_cfg

    if not seen:
        print("ERRORE: nessuna sezione con __local trovata nei file YAML.", file=sys.stderr)
        sys.exit(1)

    # Intestazione file
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    out = [
        "# =============================================================================",
        "# AUTO-GENERATED — NON modificare manualmente.",
        f"# Generato il: {timestamp}",
        "# Per aggiornare: python3 infra/scripts/generate_locals.py",
        "# =============================================================================",
        "",
        "locals {",
    ]

    # Blocchi app
    for app_key, app_cfg in seen.items():
        out.append("")
        out.append(generate_app_block(app_key, app_cfg))

    # Sezioni speciali (environment + tags)
    special = generate_special_sections(data.get("prod", {}))
    if special:
        out.append("")
        out.extend(f"  {line}" if line and not line.startswith("  ") else line for line in special)

    out.append("}\n")

    OUTPUT.write_text("\n".join(out))
    print(f"✓ Generato: {OUTPUT}")
    print(f"  Risorse processate ({len(seen)}): {', '.join(seen.keys())}")


if __name__ == "__main__":
    main()
