#!/usr/bin/env bash
# Estrae i 11 secret PDND dal Key Vault e li accoda a apps/sm-fe-smcr/.env.local
# Uso:  az login --tenant 7788edaf-0346-4068-9d79-c868aed15b3d
#       bash scripts/pull-pdnd-env.sh
set -euo pipefail

KV="plsm-p-itn-common-kv-01"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO_ROOT/apps/sm-fe-smcr/.env.local"

# ENV_NAME  SECRET_NAME (uno per riga)
PAIRS="
PDND_ENV fe-smcr-pdnd-env
PDND_CLIENT_ID fe-smcr-pdnd-client-id
PDND_CLIENT_ASSERTION_KID fe-smcr-pdnd-client-assertion-kid
PDND_CLIENT_ASSERTION_AUDIENCE fe-smcr-pdnd-client-assertion-audience
PDND_AUTH_TOKEN_URL fe-smcr-pdnd-auth-token-url
PDND_API_BASE_URL fe-smcr-pdnd-api-base-url
PDND_CLIENT_ASSERTION_PRIVATE_KEY fe-smcr-pdnd-client-assertion-private-key
PDND_DPOP_PRIVATE_KEY fe-smcr-pdnd-dpop-private-key
PDND_CLIENT_ASSERTION_TTL_SECONDS fe-smcr-pdnd-client-assertion-ttl-seconds
PDND_TOKEN_REFRESH_MARGIN_SECONDS fe-smcr-pdnd-token-refresh-margin-seconds
PDND_REQUEST_TIMEOUT_MS fe-smcr-pdnd-request-timeout-ms
"

if ! az account show >/dev/null 2>&1; then
  echo "❌ Non sei autenticato su az. Esegui prima:"
  echo "   az login --tenant 7788edaf-0346-4068-9d79-c868aed15b3d"
  exit 1
fi

echo "# ─── PDND Interoperabilità DPoP client (estratti da $KV il $(date +%F)) ───" >> "$OUT"

printf '%s' "$PAIRS" | while read -r env_name secret_name; do
  [ -z "$env_name" ] && continue
  val="$(az keyvault secret show --vault-name "$KV" --name "$secret_name" --query value -o tsv)"
  if [ -z "$val" ]; then
    echo "⚠️  $secret_name è vuoto o non accessibile" >&2
    continue
  fi
  # newline reali (chiavi PEM) -> \n letterali, come si aspetta normalizePem()
  val="$(printf '%s' "$val" | perl -0pe 's/\n/\\n/g')"
  # escape dei doppi apici, così un valore con " non rompe la riga .env
  val="${val//\"/\\\"}"
  printf '%s="%s"\n' "$env_name" "$val" >> "$OUT"
  echo "✅ $env_name"
done

echo "Fatto. Scritte in: $OUT"
