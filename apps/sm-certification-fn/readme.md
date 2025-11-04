# 🧾 Certification Function

Azure Function per la gestione e il monitoraggio dei certificati SPID.

La funzione:

- recupera periodicamente (ogni 10 secondi) tutti i certificati SPID da [https://api.is.eng.pagopa.it/idp-keys/spid/latest](https://api.is.eng.pagopa.it/idp-keys/spid/latest),
- ne calcola la data di scadenza,
- li salva su un database Postgres nella tabella `certificates`,
- espone endpoint HTTP/GET per **elenco dei certificati**.

---

## ⚙️ Endpoint disponibili

### **GET /api/v1/health**

Health check per warm-up e monitoraggio.

**Esempio:**

```bash
curl https://<your-func-app>.azurewebsites.net/api/v1/health
```

### **GET /api/v1/listAll**

Header: inserisci API_KEY con il valore definito in ambiente.

Restituisce l'elenco di tutti i certificati SPID.

**Esempio:**
```bash
curl https://<your-func-app>.azurewebsites.net/api/v1/listAll
```

---

## **Funzione Timer**

Il trigger temporizzato (timerTrigger) viene eseguito ogni 10 secondi (cron: _/10 _ \* \* \* \*).

- Recupera i certificati SPID pubblici.
- Analizza le date di scadenza.
- Inserisce i dati nella tabella Postgres definita da DB_TABLE.
- Svuota la tabella prima di ogni inserimento (truncate + insert bulk).
