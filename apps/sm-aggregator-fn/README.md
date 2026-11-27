# sm-aggregator-fn

Azure Function (Node 22, `@azure/functions` v4) per l'incremento degli enti aggregati verso Selfcare (API `onboarding/aggregation/increment`).
Epica SMION-781, storia SMION-923. Sostituisce lo script locale `increment_finale.py`.

## Endpoint

| Metodo | Route | Auth | Descrizione |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | anonymous | Health check (sempre 200, stato nel body) |

`/parse` e `/submit` arrivano con SMION-928.

## Configurazione

| Variabile | Descrizione |
| --- | --- |
| `SELC_AGGREGATION_INCREMENT_URL` | Endpoint Selfcare `onboarding/aggregation/increment` |
| `SELC_AGGREGATION_INCREMENT_API_KEY` | Da Key Vault (`fa-aggregator-api-key-aggregation-increment`) |
| `AGGREGATOR_INCREMENT_MODE` | `mock` (default, dev e locale) o `live` (solo prod) |

## Sviluppo locale

```bash
cp local.settings.json.example local.settings.json
yarn install
yarn build && yarn start
yarn test
```
