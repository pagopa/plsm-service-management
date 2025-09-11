## Bootstrap della Connessione CI/CD (Azure-GitHub)

Questa configurazione Terraform utilizza il modulo pagopa-dx/azure-github-environment-bootstrap/azurerm per creare un "ponte" sicuro e automatizzato tra il repository GitHub e l'ambiente Azure.

## 🎯 Scopo
Questo è il Passo 2 e finale del processo di setup dell'infrastruttura. Il suo obiettivo è abilitare le pipeline di CI/CD, permettendo a GitHub Actions di autenticarsi su Azure in modo sicuro e di eseguire deploy automatici.

Le sue responsabilità principali includono:

* Identità per le Pipeline: Creazione di **Identità Gestite (Managed Identity)** su Azure, una per ogni scopo (es. infra-cd, app-cd), per seguire il principio del minimo privilegio.

* Autenticazione Passwordless (OIDC): Configurazione di **Credenziali Federate** che legano le identità Azure a specifici ambienti o branch del repository GitHub. Questo elimina la necessità di gestire segreti statici.

* Assegnazione dei Permessi: Applicazione di un set granulare di **ruoli IAM** alle identità delle pipeline, garantendo che possano operare solo sulle risorse necessarie.

* Configurazione degli Ambienti GitHub: **Creazione automatica degli Ambienti** su GitHub (es. prod, dev) e popolamento dei segreti (ARM_CLIENT_ID, etc.) necessari ai workflow.

## 📂 Struttura delle Cartelle
Questa configurazione è suddivisa in sottocartelle per ogni ambiente (es. prod/, dev/). Questa separazione è cruciale per:

* Isolamento dello Stato: Ogni ambiente ha un suo file `.tfstate` separato, prevenendo impatti accidentali tra DEV e PROD.

* Isolamento della Sicurezza: Vengono create identità e permessi completamente distinti per ogni ambiente.

## 🚀 Modalità di Esecuzione

* Primo `apply`: La primissima esecuzione di questa configurazione deve avvenire manualmente da un ambiente locale. Questo è necessario per "innescare" il sistema, creando le identità che le pipeline useranno in futuro.

* Modifiche Successive: Tutte le modifiche future dovrebbero essere gestite tramite GitHub Actions dedicate, che si attivano al merge su `main` (o altri branch) e usano le identità create al primo passo per auto-gestirsi.