## Configurazione del Repository GitHub

Questa configurazione Terraform utilizza il modulo pagopa-dx/github-environment-bootstrap/github per creare e configurare il repository GitHub di questo progetto.

## 🎯 Scopo

Questo è il Passo 0 del processo di setup. Il suo unico scopo è preparare l'ambiente di sviluppo su GitHub, assicurando che sia standardizzato e sicuro fin dall'inizio.

Le sue responsabilità principali includono:

* Creazione del Repository: Provisioning del repository `plsm-service-management` all'interno dell'organizzazione pagopa.

* Impostazione del Branch di Default: Configurazione di `main` come branch predefinito.

* Protezione del Branch: Applicazione di regole di protezione sul branch `main`, come la richiesta obbligatoria di Pull Request, il numero minimo di approvazioni e il blocco del force push.

* Sicurezza: Abilitazione di funzionalità di sicurezza come secret scanning e vulnerability alerts.

* Integrazioni: Configurazione degli autolink verso le **board Jira** per facilitare il tracciamento delle attività.

## 🚀 Modalità di Esecuzione

Questa configurazione deve essere eseguita **una sola volta e manualmente da un ambiente locale** da un utente con i permessi necessari. Serve a creare il repository stesso, che ospiterà poi tutto il codice, inclusa questa configurazione.

Una volta che il repository è stato creato, questa configurazione può essere archiviata e non dovrebbe essere eseguita di nuovo, a meno che non sia necessario modificare le impostazioni di base del repository.

## ⚠️ Attenzione: apply solo mirati (dal modulo 3.0.1, SMION-891)

Il modulo fissa alcune regole che nel repo abbiamo cambiato a mano e che non si possono impostare dagli input:

* protezione di `main`: 1 approvazione obbligatoria + review dei code owner (oggi: 0 approvazioni);
* reviewer degli environment `app-prod-cd` e `infra-prod-cd`: solo i team (oggi ci sono anche utenti singoli);
* policy di deploy `main` su `app-prod-cd` (si porta dietro la modifica dei reviewer).

Un `terraform apply` **completo** riporterebbe tutto ai valori del modulo. Finché il team non decide di allinearsi, usare solo apply con `-target` sulle risorse da creare e controllare il plan riga per riga.
