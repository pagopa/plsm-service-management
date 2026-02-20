# Infrastructure

Questa cartella contiene la configurazione dell'infrastruttura per il progetto PLSM Service Management. Al suo interno sono presenti script e moduli Terraform per la gestione delle risorse cloud necessarie.

## Struttura delle directory

- `repository/`: Contiene le configurazioni Terraform per la gestione delle impostazioni e delle policy dei repository GitHub utilizzati dal progetto.
- `resources/`: Include i moduli Terraform per la creazione e gestione delle risorse cloud principali (es. storage, database, networking) necessarie al funzionamento del servizio.
- `docs/`: Documentazione infrastrutturale (architetture, scelte, note operative).
- `bootstrap/`: Fornisce script e configurazioni per l'inizializzazione dell'ambiente, come la creazione di utenti, ruoli, e la configurazione preliminare delle risorse cloud.

## Come usare

Consulta i README specifici all'interno di ciascuna sottocartella per istruzioni dettagliate sull'utilizzo e la configurazione dei moduli Terraform e degli script disponibili.  
Per iniziare:

1. Accedi alla sottocartella di interesse (`repository`, `resources`, `bootstrap`).
2. Segui le istruzioni riportate nel relativo README per configurare e applicare le risorse.
3. Assicurati di aver installato [Terraform](https://www.terraform.io/) e di aver configurato le credenziali necessarie per il tuo provider cloud.

> **Nota:** Esegui sempre una revisione delle configurazioni prima di applicare modifiche all'infrastruttura
