# /// script
# requires-python = ">=3.9"
# dependencies = ["pyyaml", "ruamel.yaml>=0.18"]
# ///

#!/usr/bin/env python3

"""
add_env_var.py
==============
Aggiunge una variabile d'ambiente (valore semplice o segreto Key Vault) a una app,
in dev, in prod o in entrambi, senza dover modificare a mano i file YAML.

Uso:
    uv run infra/scripts/add_env_var.py                            # guidato, con domande
    uv run infra/scripts/add_env_var.py --dry-run                  # stesse domande, mostra il diff, non scrive nulla
    uv run infra/scripts/add_env_var.py --dry-run --no-kv-check    # come sopra, senza nemmeno interrogare il Key Vault

Senza uv:  pip install pyyaml ruamel.yaml  e poi  python3 infra/scripts/add_env_var.py

Cosa fa:
  1. chiede ambiente, app, nome, tipo (valore o segreto KV), valore e slot
  2. sceglie il file giusto (common.yaml, dev.yaml, prod.yaml)
  3. verifica in memoria che la variabile arrivi solo negli ambienti e negli slot scelti
  4. mostra il diff dei YAML e chiede conferma
  5. scrive i YAML (commenti e ordine restano intatti) e rilancia generate_locals.py

I valori dei segreti non passano mai da qui: nei YAML finisce solo il riferimento "kv:".
Il segreto va creato nel Key Vault con il workflow kv-set-secret.yaml.

Tutte le domande si possono saltare passando le opzioni da riga di comando (vedi --help).
"""

from __future__ import annotations

import argparse
import difflib
import io
import re
import subprocess
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))
sys.dont_write_bytecode = True  # l'import di generate_locals non deve lasciare __pycache__ nel repo

try:
    from ruamel.yaml import YAML
    from ruamel.yaml.comments import CommentedMap
    from ruamel.yaml.scalarstring import DoubleQuotedScalarString

    # Stesse regole del generatore: sezioni ignorate e divisione tra gli slot.
    from generate_locals import _SKIP_SECTIONS, split_settings
except ImportError as err:
    print(f"Errore: dipendenza mancante ({err.name}).", file=sys.stderr)
    print("Esegui con:  uv run infra/scripts/add_env_var.py", file=sys.stderr)
    print("oppure:      pip install pyyaml ruamel.yaml", file=sys.stderr)
    sys.exit(1)

# ─── Percorsi e costanti ─────────────────────────────────────────────────────

REPO = SCRIPTS_DIR.parent.parent
ENV_DIR = REPO / "infra" / "resources" / "environments"
GENERATOR = SCRIPTS_DIR / "generate_locals.py"

ENVS = ("dev", "prod")
FILES = ("common", "dev", "prod")
SLOTS = ("production", "staging")

KEY_VAULTS = {
    "dev": ("plsm-d-itn-common-kv-01", "DEV-PLATFORM-SM"),
    "prod": ("plsm-p-itn-common-kv-01", "PROD-PLATFORM-SM"),
}
KV_WORKFLOW_URL = "https://github.com/pagopa/plsm-service-management/actions/workflows/kv-set-secret.yaml"

VAR_NAME_RE = re.compile(r"^[A-Z][A-Z0-9_]*$")
SECRET_NAME_RE = re.compile(r"^[a-z][a-z0-9-]*[a-z0-9]$")  # come kv-set-secret.yaml, ma minuscolo
FORBIDDEN_IN_VALUE = ('"', "\\", "${", "%{", "\n")  # romperebbero la stringa HCL generata


class Abort(Exception):
    """Errore di input o di configurazione: messaggio per l'utente, nessuna scrittura."""


# ─── YAML ────────────────────────────────────────────────────────────────────


def make_yaml() -> YAML:
    # Impostazioni verificate: rileggere e riscrivere i tre file li lascia identici.
    y = YAML()
    y.preserve_quotes = True
    y.width = 4096
    y.indent(mapping=2, sequence=4, offset=2)
    return y


def dump(y: YAML, doc) -> str:
    out = io.StringIO()
    y.dump(doc, out)
    return out.getvalue()


def load_docs(y: YAML) -> tuple[dict, dict]:
    sources = {f: (ENV_DIR / f"{f}.yaml").read_text() for f in FILES}
    docs = {f: y.load(sources[f]) for f in FILES}
    return docs, sources


def quoted(value: str) -> DoubleQuotedScalarString:
    return DoubleQuotedScalarString(value)


def move_trailing_comment(mapping: CommentedMap, from_key, to_key) -> None:
    """
    In ruamel i commenti su righe proprie dopo una chiave (es. l'intestazione del blocco
    successivo) sono agganciati a quella chiave. Quando inseriamo una chiave subito dopo,
    li spostiamo sulla nuova chiave, così restano sotto di lei. Un commento in linea
    (sulla stessa riga della chiave) resta dov'è.
    """
    items = mapping.ca.items
    if from_key not in items:
        return
    entry = items[from_key]
    token = entry[2] if len(entry) > 2 else None
    if token is None:
        return
    value = token.value
    newline = value.find("\n")
    if value.lstrip(" ").startswith("#") and not value.startswith("\n") and token.column > 0 and newline != -1:
        # Commento in linea + eventuali righe successive: le righe successive passano alla nuova chiave.
        inline, rest = value[: newline + 1], value[newline + 1 :]
        if not rest:
            return
        token.value = inline
        new_token = type(token)(rest, token.start_mark, None)
        mapping.ca.items[to_key] = [None, None, new_token, None]
        return
    mapping.ca.items[to_key] = items.pop(from_key)


def insert_shared(section: CommentedMap, key: str, value: str) -> None:
    """Inserisce una variabile condivisa prima dei blocchi production/staging."""
    keys = list(section.keys())
    slot_positions = [i for i, k in enumerate(keys) if k in SLOTS]
    pos = slot_positions[0] if slot_positions else len(keys)
    section.insert(pos, key, quoted(value))
    if pos > 0:
        move_trailing_comment(section, keys[pos - 1], key)


def append_to(mapping: CommentedMap, key: str, value) -> None:
    keys = list(mapping.keys())
    mapping[key] = value
    if keys:
        move_trailing_comment(mapping, keys[-1], key)


# ─── Configurazione effettiva (stessa logica di generate_locals.py) ──────────


def active_apps(docs: dict, env: str) -> dict:
    """
    Sezioni con __local attive in un ambiente, con common.yaml e <env>.yaml uniti come
    fa generate_locals.py: unione superficiale (un blocco production/staging nel file
    dell'ambiente sostituisce per intero quello di common.yaml), __skip le esclude.
    """
    seen: dict = {}
    for source in ("common", env):
        for app, cfg in (docs[source] or {}).items():
            if app in _SKIP_SECTIONS or not isinstance(cfg, dict):
                continue
            if cfg.get("__skip", False):
                seen.pop(app, None)
                continue
            if "__local" not in cfg:
                continue
            seen[app] = {**seen[app], **cfg} if app in seen else dict(cfg)
    return seen


def effective_slots(docs: dict, env: str, app: str) -> tuple[dict, dict] | None:
    cfg = active_apps(docs, env).get(app)
    if cfg is None:
        return None
    shared, prod_only, staging_only = split_settings(cfg)
    return {**shared, **prod_only}, {**shared, **staging_only}


def kv_refs(docs: dict) -> dict:
    """{ tf_name: kv_name } per tutti i riferimenti kv: dei tre YAML."""
    refs: dict = {}

    def walk(node):
        if isinstance(node, dict):
            for v in node.values():
                walk(v)
        elif isinstance(node, str) and node.startswith("kv:"):
            parts = node[3:].split(":", 1)
            tf_name = parts[0].replace("-", "_")
            refs.setdefault(tf_name, parts[1] if len(parts) > 1 else tf_name.replace("_", "-"))

    for f in FILES:
        walk(docs[f])
    return refs


# ─── Interazione ─────────────────────────────────────────────────────────────


INTERACTIVE = True  # False nella UI web: un dato mancante è un errore, non una domanda


def ask(question: str, default: str | None = None, sep: str = ": ") -> str:
    if not INTERACTIVE:
        raise Abort(f"Dato mancante: {question.strip()}")
    suffix = f" [{default}]" if default else ""
    try:
        answer = input(f"{question}{suffix}{sep}").strip()
    except EOFError:
        raise Abort("Input terminato.")
    return answer or (default or "")


def choose(title: str, options: list[tuple[str, str]]) -> str:
    """options = [(valore, etichetta)]; restituisce il valore scelto."""
    print(f"\n{title}")
    for i, (_, label) in enumerate(options, 1):
        print(f"  {i}) {label}")
    while True:
        answer = ask(">", sep=" ")
        if answer.isdigit() and 1 <= int(answer) <= len(options):
            return options[int(answer) - 1][0]
        print("Scelta non valida.")


def confirm(question: str) -> bool:
    return ask(f"{question} [s/N]").lower() in ("s", "si", "sì", "y", "yes")


# ─── Raccolta input ──────────────────────────────────────────────────────────


def pick_envs(args) -> list[str]:
    env = args.env or choose(
        "In quale ambiente?",
        [("dev", "dev"), ("prod", "prod"), ("both", "entrambi (dev e prod)")],
    )
    return list(ENVS) if env == "both" else [env]


def pick_app(args, docs: dict, envs: list[str]) -> str:
    per_env = [set(active_apps(docs, e)) for e in envs]
    apps = sorted(set.intersection(*per_env))
    if not apps:
        raise Abort("Nessuna app attiva in tutti gli ambienti scelti.")
    if args.app:
        if args.app not in apps:
            raise Abort(f"App '{args.app}' non attiva in {' e '.join(envs)}. Disponibili: {', '.join(apps)}")
        return args.app
    if len(envs) == 2:
        only = sorted(set.union(*per_env) - set(apps))
        if only:
            print(f"(Attive in un solo ambiente, quindi non elencate: {', '.join(only)})")
    labels = []
    for app in apps:
        local = active_apps(docs, envs[0])[app]["__local"]
        labels.append((app, f"{app}  ({local})"))
    return choose("A quale app?", labels)


def pick_slot(args) -> str:
    return args.slot or choose(
        "Su quali slot?",
        [
            ("all", "entrambi (production e staging), il caso normale"),
            ("production", "solo production"),
            ("staging", "solo staging"),
        ],
    )


def pick_name(args, docs: dict, envs: list[str], app: str, slot: str) -> str:
    while True:
        name = (args.name or ask("\nNome della variabile (UPPER_SNAKE_CASE)")).strip()
        problem = None
        if not VAR_NAME_RE.match(name):
            problem = "usa solo maiuscole, cifre e _ (es. MY_API_URL)"
        else:
            clashes = []
            for e in envs:
                prod_s, staging_s = effective_slots(docs, e, app)
                targets = {"all": (prod_s, staging_s), "production": (prod_s,), "staging": (staging_s,)}[slot]
                if any(name in t for t in targets):
                    clashes.append(e)
            if clashes:
                problem = f"esiste già in {app} ({', '.join(clashes)})"
        if not problem:
            return name
        if args.name:
            raise Abort(f"Nome '{name}' non valido: {problem}.")
        print(f"  ✖ {problem}")


def check_value(value: str) -> str | None:
    if not value:
        return "il valore non può essere vuoto"
    if value.startswith(("kv:", "res:")):
        return "per i segreti scegli il tipo 'segreto Key Vault'"
    bad = [c for c in FORBIDDEN_IN_VALUE if c in value]
    if bad:
        return f"contiene caratteri non ammessi: {' '.join(repr(c) for c in bad)}"
    return None


def ask_value(prompt: str, preset: str | None) -> str:
    while True:
        value = preset if preset is not None else ask(prompt)
        problem = check_value(value)
        if not problem:
            return value
        if preset is not None:
            raise Abort(f"Valore non valido: {problem}.")
        print(f"  ✖ {problem}")


def ask_secret(prompt: str, default: str, preset: str | None, refs: dict, tf_default: str) -> tuple[str, str]:
    """Restituisce (tf_name, kv_name)."""
    while True:
        kv_name = preset or ask(prompt, default)
        problem = None
        if not SECRET_NAME_RE.match(kv_name) or "--" in kv_name:
            problem = "usa minuscole, cifre e trattini singoli (es. fe-smcr-my-key)"
        tf_name = kv_name.replace("-", "_") if kv_name != default else tf_default
        if not problem and tf_name in refs and refs[tf_name] != kv_name:
            problem = f"il nome Terraform '{tf_name}' punta già al segreto '{refs[tf_name]}'"
        if not problem:
            return tf_name, kv_name
        if preset:
            raise Abort(f"Segreto '{kv_name}' non valido: {problem}.")
        print(f"  ✖ {problem}")


def kv_reference(tf_name: str, kv_name: str) -> str:
    derived = tf_name.replace("_", "-")
    return f"kv:{tf_name}" if kv_name == derived else f"kv:{tf_name}:{kv_name}"


def pick_values(args, docs: dict, envs: list[str], name: str) -> tuple[dict, dict]:
    """Restituisce ({env: valore da scrivere nel YAML}, {env: nome segreto KV} o {})."""
    kind = args.kind or choose(
        "Che tipo di variabile?",
        [("value", "valore semplice (URL, flag, numero...)"), ("secret", "segreto nel Key Vault")],
    )

    same = True
    if len(envs) == 2:
        if args.dev_value or args.prod_value or args.dev_secret or args.prod_secret:
            same = False
        elif args.value or args.secret_name:
            same = True
        else:
            question = "Il valore è uguale in dev e prod?" if kind == "value" else "Stesso segreto (stesso nome) in dev e prod?"
            same = confirm(question)

    if kind == "value":
        if same:
            v = ask_value("Valore", args.value)
            return {e: v for e in envs}, {}
        presets = {"dev": args.dev_value, "prod": args.prod_value}
        return {e: ask_value(f"Valore per {e}", presets[e]) for e in envs}, {}

    refs = kv_refs(docs)
    base = name.lower()
    if same:
        tf_name, kv_name = ask_secret("Nome del segreto nel Key Vault", base.replace("_", "-"), args.secret_name, refs, base)
        ref = kv_reference(tf_name, kv_name)
        return {e: ref for e in envs}, {e: kv_name for e in envs}
    values, secrets = {}, {}
    presets = {"dev": args.dev_secret, "prod": args.prod_secret}
    for e in envs:
        tf_default = f"{base}_{e}"
        tf_name, kv_name = ask_secret(f"Nome del segreto per {e}", tf_default.replace("_", "-"), presets[e], refs, tf_default)
        values[e], secrets[e] = kv_reference(tf_name, kv_name), kv_name
        refs[tf_name] = kv_name
    return values, secrets


# ─── Piano delle modifiche ───────────────────────────────────────────────────


def plan_and_apply(docs: dict, envs: list[str], app: str, slot: str, name: str, values: dict) -> list[str]:
    """
    Applica la modifica ai documenti in memoria e restituisce le note per il riepilogo.
    Regola: common.yaml solo se la variabile vale uguale in dev e prod e lì verrebbe davvero
    letta; altrimenti il file di ciascun ambiente.
    """
    notes = []
    common_sec = docs["common"].get(app)
    use_common = (
        len(envs) == 2
        and values["dev"] == values["prod"]
        and isinstance(common_sec, dict)
        and "__local" in common_sec
    )
    if use_common and slot != "all":
        # Il blocco slot di common.yaml vale solo se nessun ambiente lo ridefinisce.
        use_common = all(not (isinstance(docs[e].get(app), dict) and slot in docs[e][app]) for e in envs)

    targets = ["common"] if use_common else envs
    for target in targets:
        doc = docs[target]
        value = values["dev" if target == "common" else target]
        section = doc.get(app)

        if target != "common" and not (isinstance(section, dict) and "__local" in section):
            if isinstance(section, dict):
                raise Abort(f"In {target}.yaml la sezione '{app}' non ha __local: generate_locals.py la ignorerebbe.")
            section = CommentedMap()
            section["__local"] = common_sec["__local"]
            append_to(doc, app, section)
            doc.yaml_set_comment_before_after_key(
                app, before=f"\n─── {app}: valori solo {target} (il resto è in common.yaml) ───", indent=0
            )
            notes.append(f"{target}.yaml: creata la sezione '{app}' (prima esisteva solo in common.yaml)")

        if slot == "all":
            insert_shared(section, name, value)
            continue

        if slot not in section:
            block = CommentedMap()
            inherited = common_sec.get(slot) if target != "common" and isinstance(common_sec, dict) else None
            if inherited:
                # Un blocco slot nel file dell'ambiente sostituisce per intero quello di common.yaml:
                # va ricopiato, altrimenti quelle variabili sparirebbero dallo slot.
                for k, v in inherited.items():
                    block[k] = quoted(str(v)) if isinstance(v, str) else v
                notes.append(f"{target}.yaml: creato il blocco '{slot}' ricopiando le {len(inherited)} variabili di common.yaml")
            else:
                notes.append(f"{target}.yaml: creato il blocco '{slot}'")
            if "staging" in section and slot == "production":
                section.insert(list(section.keys()).index("staging"), slot, block)
            else:
                append_to(section, slot, block)
        append_to(section[slot], name, quoted(value))
    return notes


def verify(docs: dict, before: dict, envs: list[str], app: str, slot: str, name: str, values: dict) -> None:
    """Controlla sulla configurazione effettiva che la variabile arrivi solo dove deve e che nient'altro cambi."""
    for env in ENVS:
        old = effective_slots(before, env, app)
        new = effective_slots(docs, env, app)
        if old is None:
            if env in envs:
                raise Abort(f"Controllo fallito: '{app}' non è attiva in {env}.")
            continue
        for label, old_s, new_s in (("production", old[0], new[0]), ("staging", old[1], new[1])):
            expected = dict(old_s)
            if env in envs and slot in ("all", label):
                expected[name] = values[env]
            if {k: str(v) for k, v in new_s.items()} != {k: str(v) for k, v in expected.items()}:
                diff = set(new_s.items()) ^ set(expected.items())
                raise Abort(f"Controllo fallito su {env}/{label}: differenze inattese {sorted(diff)}. Nessun file scritto.")


# ─── Key Vault ───────────────────────────────────────────────────────────────


def secret_exists(env: str, kv_name: str) -> bool | None:
    """True/False se verificabile; None se az non è disponibile o non ha accesso. Legge solo i nomi."""
    vault, subscription = KEY_VAULTS[env]
    try:
        out = subprocess.run(
            ["az", "keyvault", "secret", "list", "--vault-name", vault, "--subscription", subscription,
             "--query", f"[?name=='{kv_name}'].name", "-o", "tsv"],
            capture_output=True, text=True, timeout=120,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return None
    if out.returncode != 0:
        return None
    return out.stdout.strip() == kv_name


# ─── Preparazione e scrittura (condivise da terminale e UI) ──────────────────


class Prepared:
    """Esito di una richiesta già validata e verificata in memoria, pronta da scrivere."""

    def __init__(self, y, docs, envs, app, slot, name, notes, diffs, secrets, regenerate):
        self.y, self.docs = y, docs
        self.envs, self.app, self.slot, self.name = envs, app, slot, name
        self.notes = notes            # note per il riepilogo
        self.diffs = diffs            # { file: unified diff }
        self.secrets = secrets        # [(env, vault, kv_name, esiste: True/False/None)]
        self.regenerate = regenerate  # ambienti per cui rilanciare generate_locals.py

    @property
    def missing_secrets(self):
        return [(env, kv) for env, _, kv, ok in self.secrets if ok is not True]


def prepare(args, kv_check: bool = True) -> Prepared:
    y = make_yaml()
    docs, sources = load_docs(y)
    before, _ = load_docs(y)

    envs = pick_envs(args)
    app = pick_app(args, docs, envs)
    slot = pick_slot(args)
    name = pick_name(args, docs, envs, app, slot)
    values, secrets = pick_values(args, docs, envs, name)

    notes = plan_and_apply(docs, envs, app, slot, name, values)
    verify(docs, before, envs, app, slot, name, values)

    diffs = {}
    for f in FILES:
        new = dump(y, docs[f])
        if new != sources[f]:
            path = f"environments/{f}.yaml"
            diffs[f] = "".join(difflib.unified_diff(sources[f].splitlines(True), new.splitlines(True), path, path, n=2))

    secret_rows = [
        (env, KEY_VAULTS[env][0], kv_name, secret_exists(env, kv_name) if kv_check else None)
        for env, kv_name in secrets.items()
    ]
    regenerate = sorted({e for f in diffs for e in (ENVS if f == "common" else (f,))})
    return Prepared(y, docs, envs, app, slot, name, notes, diffs, secret_rows, regenerate)


def write_and_generate(p: Prepared) -> list[str]:
    """Scrive i YAML e rilancia generate_locals.py. Restituisce il log delle operazioni."""
    log = []
    for f in p.diffs:
        (ENV_DIR / f"{f}.yaml").write_text(dump(p.y, p.docs[f]))
        log.append(f"✔ scritto environments/{f}.yaml")
    for env in p.regenerate:
        result = subprocess.run([sys.executable, str(GENERATOR), "--env", env], capture_output=True, text=True)
        if result.returncode != 0:
            raise Abort(f"generate_locals.py --env {env} è fallito:\n{result.stdout}{result.stderr}")
        log.append(f"✔ rigenerati locals_yaml.tf e data_kv.tf di {env}")
    stat = subprocess.run(
        ["git", "-C", str(REPO), "--no-pager", "diff", "--stat", "--", "infra/resources"],
        capture_output=True, text=True,
    )
    log.append(stat.stdout.rstrip())
    return log


SLOT_LABELS = {"all": "production e staging", "production": "solo production", "staging": "solo staging"}
SECRET_LABELS = {True: "✔ esiste", False: "✖ NON esiste", None: "? non verificato"}


def next_steps(p: Prepared) -> list[str]:
    lines, step = [], 1
    if p.missing_secrets:
        lines.append(f"{step}) Crea i segreti mancanti con il workflow Set Key Vault Secret (il valore non passa dal terminale):")
        lines.append(f"   {KV_WORKFLOW_URL}")
        lines += [f"   - secret_name={kv}  environment={env}" for env, kv in p.missing_secrets]
        step += 1
    lines.append(f"{step}) Controlla il diff, poi commit e PR del branch infra (vedi la pagina Confluence).")
    return lines


# ─── Main ────────────────────────────────────────────────────────────────────


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Aggiunge una variabile d'ambiente ai YAML di infra senza modificarli a mano.")
    p.add_argument("--ui", action="store_true", help="apre la pagina web locale invece delle domande nel terminale")
    p.add_argument("--port", type=int, default=0, help="porta della UI (default: una libera)")
    p.add_argument("--no-browser", action="store_true", help="con --ui, non aprire il browser")
    p.add_argument("--env", choices=["dev", "prod", "both"])
    p.add_argument("--app", help="sezione YAML (es. fe_smcr)")
    p.add_argument("--name", help="nome della variabile (UPPER_SNAKE_CASE)")
    p.add_argument("--kind", choices=["value", "secret"])
    p.add_argument("--value", help="valore uguale in tutti gli ambienti scelti")
    p.add_argument("--dev-value")
    p.add_argument("--prod-value")
    p.add_argument("--secret-name", help="nome del segreto nel Key Vault, uguale in tutti gli ambienti")
    p.add_argument("--dev-secret")
    p.add_argument("--prod-secret")
    p.add_argument("--slot", choices=["all", "production", "staging"])
    p.add_argument("--yes", action="store_true", help="non chiedere conferma")
    p.add_argument("--dry-run", action="store_true", help="mostra il riepilogo senza scrivere")
    p.add_argument("--no-kv-check", action="store_true", help="non verificare i segreti nel Key Vault")
    return p.parse_args()


def run_terminal(args) -> int:
    print("Aggiunta guidata di una variabile d'ambiente (Ctrl+C per uscire)")
    if args.dry_run:
        print("DRY-RUN: mostro solo il riepilogo, nessun file viene scritto e generate_locals.py non parte.")
        if not args.no_kv_check:
            print("         (i segreti vengono cercati nel Key Vault in sola lettura: aggiungi --no-kv-check per evitarlo)")

    p = prepare(args, kv_check=not args.no_kv_check)

    print("\n" + "─" * 70)
    print(f"RIEPILOGO  {p.name} → {p.app}  ({', '.join(p.envs)}; {SLOT_LABELS[p.slot]})")
    print("─" * 70)
    for diff in p.diffs.values():
        print(diff)
    for note in p.notes:
        print(f"• {note}")
    if p.secrets:
        print("\nSegreti Key Vault attesi:")
        for env, vault, kv_name, ok in p.secrets:
            print(f"  {env:5} {vault}  {kv_name}  {SECRET_LABELS[ok]}")
    when = "Senza --dry-run verrebbe" if args.dry_run else "Poi verrà"
    print(f"\n{when} rilanciato generate_locals.py per: {', '.join(p.regenerate)}")

    if args.dry_run:
        print("\nDry-run: nessun file scritto.")
        return 0
    if not args.yes and not confirm("\nProcedo?"):
        print("Annullato: nessun file scritto.")
        return 1

    for line in write_and_generate(p):
        print(line)
    print("\nProssimi passi:")
    for line in next_steps(p):
        print(f"  {line}")
    return 0


def main() -> int:
    args = parse_args()
    if args.ui:
        from add_env_var_ui import serve  # import qui: il terminale non ne ha bisogno

        # Passo questo modulo così com'è: reimportarlo creerebbe una seconda copia di INTERACTIVE.
        return serve(sys.modules[__name__], args.port, open_browser=not args.no_browser)
    return run_terminal(args)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Abort as err:
        print(f"\n✖ {err}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nInterrotto: nessun file scritto.", file=sys.stderr)
        sys.exit(130)
