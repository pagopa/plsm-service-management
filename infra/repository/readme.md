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