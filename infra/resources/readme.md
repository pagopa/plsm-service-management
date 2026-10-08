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

## 🔁 Plan e apply: CI o locale

| Evento | Plan | Apply |
|---|---|---|
| PR che tocca `prod/` o `_modules/` | prod | — |
| PR che tocca `dev/` o `_modules/` | dev | — |
| PR che tocca `dev-base/` | dev-base | — |
| PR che tocca `infra_plan.yaml` / `infra_apply.yaml` | prod, dev, dev-base | — |
| Push su `main` che tocca `prod/` o `_modules/` | — | prod, **dopo approvazione** su `infra-prod-cd` |
| `workflow_dispatch` con `target_env` + `confirm = apply` | l'ambiente scelto | l'ambiente scelto (prod solo da `main` o `infra/*`) |

Gli yaml di `environments/` non avviano nulla da soli: arrivano al Terraform tramite i `locals_yaml.tf` generati con `scripts/generate_locals.py`, che stanno in `prod/` e `dev/`.

**Dev è il banco di prova**: ogni modifica rischiosa (versioni dei moduli DX, rete, runner) si prova prima su `dev-base`/`dev` e poi si replica su prod.

### Quando applicare da locale

Il runner self-hosted è un Container App Job con `replica_timeout_in_seconds = 1800`: un job che dura di più viene interrotto e lascia lo state bloccato. Vanno quindi applicate **da locale**:

- creazione o rimozione del gateway VPN (15–30 minuti);
- modifiche che ricreano il Container App Environment del runner (la distruzione da sola richiede ~25 minuti) — il runner è proprio quello che eseguirebbe l'apply.

Procedura, con la stessa versione di Terraform della CI (`.terraform-version` nella root) e le proprie credenziali `az`:

```bash
cd infra/resources/<ambiente>
export ARM_SUBSCRIPTION_ID=$(az account show --subscription <DEV-PLATFORM-SM|PROD-PLATFORM-SM> --query id -o tsv)
terraform init
terraform plan -out=tfplan    # leggere tutto il plan
terraform apply tfplan
```

### Ricreare il Container App Environment del runner

Azure non elimina un Container App Environment che contiene ancora il job del runner, quindi l'ordine è:

1. `infra/bootstrapper/<ambiente>`: destroy mirato del job (`-target='module.azure-github-environment-bootstrap.module.github_runner.azurerm_container_app_job.github_runner'`);
2. `infra/resources/<ambiente-base>`: plan e apply (ricrea il Container App Environment);
3. `infra/bootstrapper/<ambiente>`: plan e apply (ricrea il job del runner);
4. il job viene creato prima del suo ruolo sul Key Vault, quindi KEDA non legge `github-runner-pat` e riprova solo ogni ~16 minuti. Per sbloccarlo:
   ```bash
   az containerapp job secret set -g <rg> -n <job> \
     --secrets "github-runner-pat=keyvaultref:https://<kv>.vault.azure.net/secrets/github-runner-pat,identityref:system" -o none
   ```
   e attendere il ciclo successivo dello scaler;
5. lanciare un Infra Plan da CI: deve girare sul nuovo runner e dare `No changes`.