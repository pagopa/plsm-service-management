# Guida errori CRM per il Frontend (SMION-800)

Quando `POST /meetings` fallisce, la Function restituisce un oggetto `error`
**neutro e stabile**. Il frontend è responsabile della traduzione in messaggi
user-facing (italiano). Il dettaglio grezzo di Dynamics NON è mai incluso nella
risposta: resta solo nei log server-side.

## Forma della risposta di errore

```jsonc
{
  "success": false,
  "message": "Errore durante la creazione dell'appuntamento", // legacy
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "category": "NOT_FOUND",
    "step": "verifyAccount"
  },
  "timestamp": "2026-07-09T..."
}
```

## Catalogo codici

| `code` | `category` | HTTP | Quando accade | Messaggio IT suggerito |
|--------|-----------|------|---------------|------------------------|
| `VALIDATION_ERROR` | `VALIDATION` | 400 | Payload non valido | Alcuni dati inseriti non sono validi. Controlla i campi e riprova. |
| `ACCOUNT_NOT_FOUND` | `NOT_FOUND` | 500 | Ente non risolto | Ente non trovato nel CRM. Verifica l'ente selezionato. |
| `CONTACT_INVALID` | `NOT_FOUND` | 500 | Contatto non trovato/creabile | Contatto non valido o non trovato nel CRM. Verifica i partecipanti. |
| `CRM_FIELD_REJECTED` | `CRM_REJECTED` | 500 | Dynamics rifiuta un campo/valore | Il CRM ha rifiutato uno dei valori inviati. Contatta il supporto. |
| `CRM_UNAVAILABLE` | `CRM_UNAVAILABLE` | 500 | Timeout / 5xx Dynamics | Il CRM non è al momento raggiungibile. Riprova più tardi. |
| `CRM_ERROR` | `UNKNOWN` | 500 | Errore CRM non classificato | Errore CRM. Riprova più tardi o contatta il supporto. |
| `UNKNOWN` | `UNKNOWN` | 500 | Fallback estremo | Errore CRM. Riprova più tardi o contatta il supporto. |

## Come consumarlo lato FE

1. Leggi `data.error?.code`.
2. Mappa il `code` sul messaggio italiano (vedi `lib/crm-error-messages.ts`).
3. Per un `code` sconosciuto, usa il fallback generico.
4. Se `error` è assente (es. risposta legacy), usa `data.message`.

## Retro-compatibilità

- Il campo `message` resta presente. I client che non conoscono `error` continuano
  a funzionare.
- Nuovi codici possono essere aggiunti in futuro: il FE deve sempre prevedere il
  fallback generico per codici non riconosciuti.
