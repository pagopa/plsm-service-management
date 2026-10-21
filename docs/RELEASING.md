# Rilasci delle applicazioni

Release Please gestisce versioni, changelog e GitHub Releases a partire dai commit su `main`. Ogni componente ha una versione indipendente; una sola PR raccoglie i componenti pronti per il rilascio. I deploy in Azure si avviano manualmente dai workflow CD esistenti.

## Configurazione iniziale su GitHub

Prima di integrare il workflow su `main`, configurare una GitHub App installata su `pagopa/plsm-service-management`, con questi repository permissions:

- **Contents: Read and write** per branch, commit, tag e release.
- **Pull requests: Read and write** per creare e aggiornare la PR di release.
- **Issues: Read and write** per le etichette di release.
- **Metadata: Read-only**, assegnato automaticamente da GitHub.

Nelle impostazioni Actions del repository configurare:

| Tipo     | Nome                             | Valore                              |
| -------- | -------------------------------- | ----------------------------------- |
| Variable | `RELEASE_PLEASE_APP_ID`          | ID numerico della GitHub App        |
| Secret   | `RELEASE_PLEASE_APP_PRIVATE_KEY` | Chiave privata PEM della GitHub App |

Il token generato è limitato al repository corrente. Il workflow usa una GitHub App perché le PR e i push creati con `GITHUB_TOKEN` non avviano automaticamente le CI. Se mancano le credenziali, il workflow termina con un errore esplicito.

Nelle regole di `main`:

1. Usare **squash merge** e il titolo della PR come messaggio del commit finale. Verificare il messaggio proposto da GitHub prima del merge.
2. Rendere obbligatorio il check **Conventional PR title** dopo la sua prima esecuzione.
3. Conservare le revisioni e i controlli CI richiesti anche per le PR di release.

Per i deploy da tag, verificare che le eventuali deployment branch/tag policies degli environment `app-dev-ci`, `app-dev-cd`, `app-prod-ci` e `app-prod-cd` ammettano i tag dei componenti interessati, ad esempio `sm-fe-smcr-v*` per il frontend. Le protezioni e le approvazioni degli environment continuano ad applicarsi.

Il workflow di controllo dei titoli usa `pull_request_target` per poter validare anche le PR da fork con i soli metadati dell'evento. Non esegue checkout, codice della PR o operazioni di scrittura.

## Titoli delle PR

Usare il formato `tipo(scope): [SMION-123] descrizione`. Lo scope e il riferimento Jira sono facoltativi per il controllo automatico; usare il componente come scope aiuta la lettura.

```text
feat(sm-fe-smcr): [SMION-906] aggiunge gestione variabili ambiente
fix(sm-auth-fn): [SMION-907] corregge rinnovo sessione
feat(sm-crm-fn)!: [SMION-908] modifica il contratto API
chore(deps): aggiorna le dipendenze
ci: aggiorna il workflow di build
```

| Prefisso                                                                                            | Effetto sulla versione              |
| --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `fix:`, `perf:`, `deps:`                                                                            | Patch, ad esempio `1.0.0` → `1.0.1` |
| `feat:`                                                                                             | Minor, ad esempio `1.0.0` → `1.1.0` |
| `feat!:`, `fix!:` o altro tipo con `!`                                                              | Major, ad esempio `1.0.0` → `2.0.0` |
| `chore:`, `ci:`, `docs:`, `style:`, `refactor:`, `test:`, `build:`, `revert:` senza breaking change | Da soli non avviano una release     |

La strategia usa gli incrementi SemVer standard anche prima di `1.0.0`: una breaking change del frontend `0.9.0` porta a `1.0.0`. Per le breaking change, documentare anche la migrazione nella PR e conservarla nel corpo del commit squash, eventualmente con un footer `BREAKING CHANGE:`.

Release Please attribuisce i commit ai componenti attraverso i **file modificati**, non attraverso lo scope del titolo. Una PR che modifica più componenti può quindi aggiornare più versioni. Per dipendenze applicative che richiedono un rilascio usare `fix(deps): ...` o `deps: ...`; `chore(deps): ...` da solo non lo avvia.

## Componenti e versioni iniziali

| Percorso                   | Versione iniziale | Formato del tag              |
| -------------------------- | ----------------- | ---------------------------- |
| `apps/sm-auth-fn`          | `1.0.0`           | `sm-auth-fn-v1.0.1`          |
| `apps/sm-certification-fn` | `1.0.0`           | `sm-certification-fn-v1.0.1` |
| `apps/sm-crm-fn`           | `1.0.0`           | `sm-crm-fn-v1.0.1`           |
| `apps/sm-fe-smcr`          | `0.9.0`           | `sm-fe-smcr-v0.10.0`         |
| `apps/sm-onboarding-fn`    | `4.1.1`           | `sm-onboarding-fn-v4.1.2`    |
| `apps/sm-pf-fn`            | `1.0.0`           | `sm-pf-fn-v1.0.1`            |
| `apps/sm-signature-fn`     | `1.0.0`           | `sm-signature-fn-v1.0.1`     |
| `packages/db-monitoring`   | `0.0.0`           | `db-monitoring-v0.1.0`       |

Le versioni iniziali corrispondono ai `package.json` al momento dell'adozione; i tag in tabella sono esempi di release successive. Il manifest iniziale non pubblica retroattivamente quelle versioni. Per `db-monitoring`, ancora a `0.0.0`, la prima release è esplicitamente `0.1.0`; le successive seguono SemVer.

`release-please-config.json` contiene i componenti e le regole. `.release-please-manifest.json` registra le versioni correnti ed è aggiornato dal bot nelle PR di release: dopo il bootstrap evitare modifiche manuali alle versioni o comandi `npm version` / `yarn version`.

Il `bootstrap-sha` è `56e8f241a59b7ef932e794b91f844747fee0a3d8`, riferimento di `origin/main` disponibile durante l'adozione. La prima release considera solo i commit successivi a quel punto. Dopo la prima release gestita dal bot, Release Please usa i riferimenti delle release precedenti e il bootstrap può essere rimosso.

Il plugin `node-workspace` propaga gli aggiornamenti delle dipendenze interne: un rilascio di `db-monitoring` aggiorna anche CRM, almeno con una patch. La dipendenza `@repo/db-monitoring` usa `workspace:*` per mantenere il collegamento locale senza riscrivere il range e il lockfile a ogni release. I pacchetti privati non vengono pubblicati su npm.

`packages/eslint-config`, `packages/typescript-config`, infrastruttura Terraform e `Archive/` non hanno release proprie. I cambiamenti ai pacchetti di configurazione attivano la CI del frontend; quelli a `db-monitoring` attivano la CI di CRM. I cambiamenti al lockfile e alla configurazione di build comune attivano tutte le CI applicative.

## Preparare e pubblicare una release

1. Integrare le PR funzionali su `main` con un titolo conforme e squash merge.
2. Il workflow **Release Please** apre o aggiorna una PR aggregata, normalmente `chore(main): release main`. Se non esistono cambiamenti rilasciabili, non viene aperta alcuna PR.
3. Revisionare versioni, changelog per componente e risultati CI nella PR di release. Verificare anche le eventuali migrazioni database.
4. Integrare la PR di release mantenendo titolo, corpo e metadati generati dal bot.
5. Il successivo workflow crea un tag e una GitHub Release per ciascun componente incluso, sul commit della PR di release. Questo passaggio non distribuisce applicazioni e non esegue migrazioni.

Il workflow può essere rilanciato da **Actions → Release Please → Run workflow**, selezionando `main`. Le esecuzioni manuali su altri branch vengono ignorate. Non aggiungere filtri per percorso: il bot deve vedere anche il merge della PR di release e gli aggiornamenti condivisi.

## Deploy di una versione

Aprire il workflow **CD** dell'applicazione, scegliere **Run workflow**, selezionare il **tag del componente** nel selettore del riferimento e scegliere `app-dev` o `app-prod`. Ad esempio, per il frontend selezionare `sm-fe-smcr-v0.10.0`. Il checkout del workflow userà quel riferimento.

Per un'applicazione che dipende da modifiche allo schema, eseguire le migrazioni attraverso **DB Monitoring - Migrate** sul riferimento appropriato prima di distribuire il codice che le richiede, rispettando la compatibilità delle migrazioni con la versione in esecuzione. In una release aggregata i tag dei componenti inclusi puntano allo stesso commit.

Per ridistribuire una versione precedente, avviare nuovamente il workflow CD sul relativo tag; verificare separatamente la compatibilità con le migrazioni già applicate. Gli artefatti sono ricostruiti dal tag e i valori di build dipendono dall'ambiente selezionato.

## Aggiungere un componente

1. Inserire il percorso e un `component` univoco in `release-please-config.json`.
2. Inserire la versione corrente del suo `package.json` nel manifest, come bootstrap del nuovo componente.
3. Aggiungere o aggiornare CI e filtri dei consumatori per le dipendenze condivise.
4. Documentare il workflow di deploy e il prefisso del tag.

## Riferimenti

- [Release Please e Conventional Commits](https://github.com/googleapis/release-please)
- [Manifest e plugin node-workspace](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)
- [Release Please Action e autenticazione](https://github.com/googleapis/release-please-action)
- [Creazione di un token GitHub App](https://github.com/actions/create-github-app-token)
