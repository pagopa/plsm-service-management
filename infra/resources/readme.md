## Infrastruttura di Base (Core Infrastructure)

Questa configurazione Terraform utilizza il modulo pagopa-dx/azure-core-infra/azurerm per creare l'infrastruttura fondamentale su Azure.

## 🎯 Scopo

Questo è il Passo 1 del processo di provisioning su cloud. Il suo obiettivo è creare le "fondamenta" e i "contenitori" su cui verranno poi distribuiti i servizi applicativi e le pipeline.

Le sue responsabilità principali includono:

* Gruppi di Risorse: Creazione di `Resource Group` separati per organizzare logicamente le risorse (es. common, network, opex, github-runner).

* Rete: Provisioning della **Rete Virtuale (VNet)**, delle subnet e delle Zone DNS Private per garantire una comunicazione sicura e isolata tramite Private Endpoint.

* Sicurezza: Creazione di un **Key Vault** per la gestione centralizzata di segreti, chiavi e certificati.

* Monitoraggio: Impostazione di un **Log Analytics Workspace** e di un'istanza di Application Insights per aggregare log e metriche.

* Ambiente per CI/CD: Creazione di un **Azure Container App Environment** dedicato ad ospitare i runner self-hosted di GitHub Actions.

## 🚀 Modalità di Esecuzione
Questa configurazione deve essere applicata prima di quella del `bootstrap`. L'esecuzione può avvenire tramite una pipeline di GitHub Actions dedicata (consigliato per le modifiche future) o manualmente da locale.

L'output di questa esecuzione (le risorse create su Azure) è un prerequisito fondamentale per il corretto funzionamento della configurazione di `bootstrap`.