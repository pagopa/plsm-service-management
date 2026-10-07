"""
add_env_var_ui.py
=================
Pagina web locale per add_env_var.py:  uv run infra/scripts/add_env_var.py --ui

Usa la stessa logica del terminale (validazioni, scelta del file, controllo in memoria,
generate_locals.py). Il server:
  - ascolta solo su 127.0.0.1;
  - accetta le chiamate solo con il token casuale generato all'avvio (nell'URL della pagina),
    così un altro sito aperto nel browser non può usarlo;
  - non riceve né mostra mai valori di segreti: nei YAML finisce solo il riferimento "kv:".
"""

from __future__ import annotations

import argparse
import hashlib
import json
import secrets
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

PAGE = Path(__file__).resolve().parent / "add_env_var_ui.html"
MAX_BODY = 64 * 1024

# Campi del form → opzioni di add_env_var.py (stessi nomi di argparse).
FIELDS = ("env", "app", "slot", "name", "kind", "value", "dev_value", "prod_value", "secret_name", "dev_secret", "prod_secret")


CHOICES = {"env": ("dev", "prod", "both"), "slot": ("all", "production", "staging"), "kind": ("value", "secret")}
REQUIRED = {"env": "ambiente", "app": "app", "slot": "slot", "name": "nome della variabile", "kind": "tipo"}


def to_args(body: dict) -> argparse.Namespace:
    values = {f: (str(body.get(f)).strip() or None) if body.get(f) is not None else None for f in FIELDS}
    missing = [label for f, label in REQUIRED.items() if not values[f]]
    if missing:
        raise ValueError(f"campi mancanti: {', '.join(missing)}")
    for f, allowed in CHOICES.items():
        if values[f] not in allowed:
            raise ValueError(f"valore non ammesso per {f}: {values[f]}")
    if values["name"]:
        values["name"] = values["name"].upper()
    # Con "entrambi" il form manda o il valore unico o quelli per ambiente, mai tutti e due.
    if values["env"] == "both" and body.get("same", True):
        for f in ("dev_value", "prod_value", "dev_secret", "prod_secret"):
            values[f] = None
    elif values["env"] == "both":
        values["value"] = values["secret_name"] = None
    return argparse.Namespace(**values)


def options(core) -> dict:
    """App attive per ambiente, con le variabili già presenti (solo i nomi) per segnalare i duplicati."""
    y = core.make_yaml()
    docs, _ = core.load_docs(y)
    result = {}
    for env in core.ENVS:
        apps = {}
        for app, cfg in core.active_apps(docs, env).items():
            prod_s, staging_s = core.effective_slots(docs, env, app)
            apps[app] = {"local": cfg["__local"], "production": sorted(prod_s), "staging": sorted(staging_s)}
        result[env] = apps
    return result


def preview_payload(core, p) -> dict:
    payload = {
        "summary": f"{p.name} → {p.app}  ({', '.join(p.envs)}; {core.SLOT_LABELS[p.slot]})",
        "diffs": p.diffs,
        "notes": p.notes,
        "secrets": [
            {"env": env, "vault": vault, "name": kv, "status": core.SECRET_LABELS[ok], "ok": ok}
            for env, vault, kv, ok in p.secrets
        ],
        "regenerate": p.regenerate,
    }
    # L'impronta lega "Applica" a questa anteprima: se i YAML cambiano nel frattempo, si rifà l'anteprima.
    payload["fingerprint"] = hashlib.sha256(json.dumps(p.diffs, sort_keys=True).encode()).hexdigest()
    return payload


def make_handler(core, token: str, port: int):
    allowed_hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):  # niente log di ogni richiesta nel terminale
            pass

        def send(self, status: int, body: bytes, content_type: str) -> None:
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Frame-Options", "DENY")
            self.end_headers()
            self.wfile.write(body)

        def send_json(self, status: int, data: dict) -> None:
            self.send(status, json.dumps(data).encode(), "application/json; charset=utf-8")

        def host_ok(self) -> bool:
            return self.headers.get("Host") in allowed_hosts  # blocca il DNS rebinding

        def do_GET(self):
            url = urlparse(self.path)
            if not self.host_ok():
                return self.send(HTTPStatus.FORBIDDEN, b"Host non ammesso", "text/plain")
            if url.path == "/":
                if parse_qs(url.query).get("t", [""])[0] != token:
                    return self.send(HTTPStatus.FORBIDDEN, b"Usa il link stampato nel terminale.", "text/plain; charset=utf-8")
                html = PAGE.read_text().replace("__TOKEN__", token)
                return self.send(HTTPStatus.OK, html.encode(), "text/html; charset=utf-8")
            if url.path == "/api/options":
                if self.headers.get("X-Token") != token:
                    return self.send_json(HTTPStatus.FORBIDDEN, {"error": "token non valido"})
                return self.send_json(HTTPStatus.OK, options(core))
            self.send(HTTPStatus.NOT_FOUND, b"", "text/plain")

        def do_POST(self):
            url = urlparse(self.path)
            if not self.host_ok() or self.headers.get("X-Token") != token:
                return self.send_json(HTTPStatus.FORBIDDEN, {"error": "richiesta non ammessa"})
            if url.path not in ("/api/preview", "/api/apply"):
                return self.send_json(HTTPStatus.NOT_FOUND, {"error": "endpoint sconosciuto"})
            length = int(self.headers.get("Content-Length") or 0)
            if length > MAX_BODY:
                return self.send_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "richiesta troppo grande"})
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
                args = to_args(body)
                # La verifica sul Key Vault serve all'anteprima; in "Applica" il riepilogo è già stato visto.
                kv_check = bool(body.get("kv_check", True)) and url.path == "/api/preview"
                p = core.prepare(args, kv_check=kv_check)
                payload = preview_payload(core, p)
                if url.path == "/api/preview":
                    return self.send_json(HTTPStatus.OK, payload)
                if body.get("fingerprint") != payload["fingerprint"]:
                    raise core.Abort("I file YAML sono cambiati dopo l'anteprima: rifai l'anteprima.")
                log = core.write_and_generate(p)
                return self.send_json(HTTPStatus.OK, {**payload, "log": log, "next_steps": core.next_steps(p)})
            except core.Abort as err:
                return self.send_json(HTTPStatus.UNPROCESSABLE_ENTITY, {"error": str(err)})
            except (ValueError, TypeError) as err:
                return self.send_json(HTTPStatus.BAD_REQUEST, {"error": f"richiesta non valida: {err}"})

    return Handler


def serve(core, port: int = 0, open_browser: bool = True) -> int:
    core.INTERACTIVE = False  # un dato mancante diventa un errore mostrato nella pagina
    token = secrets.token_urlsafe(24)
    server = HTTPServer(("127.0.0.1", port), None)
    actual_port = server.server_address[1]
    server.RequestHandlerClass = make_handler(core, token, actual_port)
    url = f"http://127.0.0.1:{actual_port}/?t={token}"

    print("UI locale per aggiungere variabili d'ambiente")
    print(f"  {url}")
    print("Ctrl+C per chiudere. La pagina funziona solo con questo link.", flush=True)
    if open_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nUI chiusa.")
    finally:
        server.server_close()
    return 0
