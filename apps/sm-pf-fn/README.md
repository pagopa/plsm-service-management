# Funzione Portale Fatturazione

L'endpoint è utilizzato per l'upload e il salvataggio sicuro di documenti (file PDF) in Azure Blob Storage. La sicurezza è garantita da un'API Key (lato client) e Managed Identity (lato Azure).

## 1. Dettagli Tecnologici

| Componente                 | Dettagli                                    |
| :------------------------- | :------------------------------------------ |
| **Piattaforma**            | Azure Functions v4 (Node.js/TypeScript)     |
| **Route Attiva**           | `/api/manuali`                              |
| **Autenticazione Cliente** | API Key (Header `Authorization`)            |
| **Autenticazione Storage** | Managed Identity (`DefaultAzureCredential`) |
| **Container Target**       | Nome dello storage                          |

## 2. Endpoint Attivo

| Metodo   | Route Completa       | Descrizione                                          |
| :------- | :------------------- | :--------------------------------------------------- |
| **POST** | `.../v1/api/manuali` | Carica il file binario nel Blob Storage specificato. |
| **GET**  | `.../v1/info`        | Health Check                                         |

---

## 3. Autorizzazione (API Key)

L'endpoint è protetto. È richiesto l'invio di un Bearer Token nell'header `Authorization`. Il token deve corrispondere esattamente al valore configurato nella variabile d'ambiente **`API_KEY_SECRET`**.

### Header di Autenticazione

| Nome Header     | Formato                   | Esempio                        |
| :-------------- | :------------------------ | :----------------------------- |
| `Authorization` | `Bearer <API_KEY_SECRET>` | `Bearer chiave-segreta-XYZ123` |

---

## 4. Esempio di Richiesta

```bash
curl -v -X POST "http://localhost:7071/api/manuali?filename=test-rapporto.pdf" \
     --header "Content-Type: application/pdf" \
     --header "Authorization: Bearer $API_KEY" \
     --data-binary "CONTENUTO DEL PDF DI PROVA"
```
