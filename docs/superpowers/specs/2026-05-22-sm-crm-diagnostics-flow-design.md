# SM CRM Diagnostics Flow Design

> Goal: rendere i blob diagnostici di `apps/sm-crm-fn` leggibili end-to-end, mostrando in modo esplicito il payload ricevuto dal frontend, tutte le chiamate intermedie verso Dynamics e il payload finale di creazione meeting.

## Contesto attuale

`apps/sm-crm-fn` salva gia' su Blob Storage una `DiagnosticSession` con:
- `frontendPayload`
- `dynamicsCalls`
- `orchestratorResult`

Il problema non e' l'assenza dei dati, ma la loro leggibilita': oggi il blob contiene buona parte delle informazioni utili, ma non garantisce una rappresentazione chiara, uniforme e flow-first di tutto il percorso `frontend -> orchestrator -> Dynamics`.

## Obiettivo

Quando arriva una `POST /meetings`, il blob deve permettere a chi legge di capire senza aprire il codice:

1. cosa ha inviato il frontend;
2. quali chiamate intermedie sono state fatte verso Dynamics;
3. quali payload completi sono stati inviati a Dynamics;
4. quali dati applicativi sono stati derivati lungo il flusso;
5. quale chiamata finale ha creato il meeting;
6. come si e' conclusa l'orchestrazione.

## Non obiettivi

- cambiare il comportamento funzionale di creazione account/contatti/meeting;
- cambiare i payload mandati a Dynamics per ragioni non collegate al logging;
- sostituire il formato blob esistente con uno incompatibile.

## Approccio scelto

Evolvere il formato della sessione diagnostica senza rompere le sezioni gia' esistenti:

- mantenere `frontendPayload`;
- mantenere `dynamicsCalls` come fonte completa di verita' tecnica;
- arricchire ogni record di `dynamicsCalls` per renderlo autosufficiente;
- aggiungere una sezione `flowSummary` che renda il flusso leggibile dall'alto verso il basso.

Questo approccio e' preferito perche':
- non rompe i consumer attuali del blob;
- conserva il dettaglio grezzo utile al debugging;
- aggiunge una vista leggibile per troubleshooting operativo.

## Struttura target del blob

La `DiagnosticSession` finale dovra' contenere:

- `sessionId`
- `timestamp`
- `environment`
- `frontendPayload`
- `flowSummary`
- `dynamicsCalls`
- `orchestratorResult`

### frontendPayload

Deve continuare a rappresentare il body ricevuto dal frontend su `POST /meetings`, con le stesse regole di sanitizzazione applicate oggi ai dati personali.

### flowSummary

Nuova sezione orientata alla lettura umana. Deve mostrare:

- `frontendRequest`: snapshot leggibile della richiesta frontend;
- `derivedData`: dati risolti durante l'orchestrazione;
- `finalDynamicsRequest`: chiamata finale di creazione appointment verso Dynamics;
- `flowSteps`: timeline sintetica dei passaggi logici;
- `result`: esito finale dell'orchestrazione.

#### frontendRequest

Campi attesi:

- `institutionIdSelfcare`
- `nomeEnte`
- `productIdSelfcare`
- `partecipanti`
- `subject`
- `scheduledstart`
- `scheduledend`
- `location`
- `description`
- `oggettoDelContatto`
- `categoria`
- `dataProssimoContatto`
- `dryRun`

#### derivedData

Campi attesi:

- `account`
  - `accountId`
  - `accountName`
  - `resolutionMethod`
- `product`
  - `productIdSelfcare`
  - `environment`
  - `productGuid`
- `contacts`
  - elenco partecipanti con esito `found` o `created`
  - `contactId`
- `appointmentBindings`
  - `regardingobjectid_account@odata.bind`
  - `pgp_clienteid_Appointment@odata.bind`
  - `pgp_prodottooggettodelcontattoid_Appointment@odata.bind`

#### finalDynamicsRequest

Deve rendere evidente l'ultima `POST /appointments`, con:

- `method`
- `url`
- `requestBody`
- `derivedFromFrontend`

`requestBody` deve essere quasi completo, incluso:
- subject, scheduledstart, scheduledend, location, description;
- `appointment_activity_parties`;
- `regardingobjectid_account@odata.bind`;
- `pgp_clienteid_Appointment@odata.bind`;
- `pgp_prodottooggettodelcontattoid_Appointment@odata.bind`;
- altri campi opzionali effettivamente inviati (`category`, `sortdate`, `ownerid@odata.bind`, `pgp_oggettodelcontatto`).

#### flowSteps

Timeline sintetica ordinata, con step come:

1. `frontendRequestReceived`
2. `verifyAccount`
3. `verifyOrCreateContact`
4. `createAppointment`
5. `orchestratorCompleted`

Ogni elemento deve contenere almeno:

- `sequence`
- `step`
- `status`
- `summary`

#### result

Sintesi finale con:

- `success`
- `activityId`
- `accountId`
- `contactIds`
- `warnings`
- `timestamp`

## Nuovo standard per dynamicsCalls

`dynamicsCalls` resta la lista tecnica completa delle chiamate reali a Dynamics.

Ogni entry dovra' essere autosufficiente e uniforme, con questi campi:

- `sequence`
- `step`
- `substep`
- `entity`
- `attempt`
- `participantRef` opzionale
- `method`
- `url`
- `requestDetails`
- `requestBody`
- `derivedFromFrontend`
- `responseStatus`
- `durationMs`
- `success`
- `error`

### sequence

Indice progressivo globale nella sessione, per leggere il flusso nell'ordine reale di esecuzione.

### step

Step logico orchestratore:
- `verifyAccount`
- `verifyOrCreateContact`
- `createAppointment`

### substep

Nome tecnico piu' preciso della singola chiamata, ad esempio:
- `getAccountBySelfcareId`
- `getAccountByName`
- `findContactByEmail`
- `createContact`
- `createAppointment`
- `createAppointmentFallback`

### entity

Entita' Dynamics coinvolta:
- `accounts`
- `contacts`
- `appointments`

### attempt

Numero tentativo della chiamata, utile per retry o fallback.

### participantRef

Campo opzionale usato nelle chiamate ai contatti per legare il record al partecipante del frontend. Puo' contenere, ad esempio, indice partecipante ed email mascherata.

### requestDetails

Per chiamate `GET`, oltre all'URL grezzo devono essere salvati dettagli leggibili:

- `entity`
- `filter`
- `select`
- `top`
- eventuali altri segmenti OData rilevanti

Questo evita di costringere chi legge a parsare query string complesse dentro `url`.

### requestBody

Per ogni `POST`, deve contenere il payload completo mandato a Dynamics.

Questo include in particolare:
- body di `POST /contacts`;
- body di `POST /appointments`.

### derivedFromFrontend

Mappa esplicita tra dati frontend/applicativi e chiamata Dynamics. Esempi:

- `institutionIdSelfcare -> verifyAccount filter`
- `productIdSelfcare -> productGuid -> pgp_prodottooggettodelcontattoid_Appointment@odata.bind`
- `accountId -> pgp_clienteid_Appointment@odata.bind`

### success

Booleano derivato da `responseStatus` o dall'assenza di errore, per lettura rapida.

## Regole di logging richieste

1. Nessuna chiamata reale a Dynamics deve restare fuori da `dynamicsCalls`.
2. Nessuna `POST` deve avere `requestBody` nullo se il payload e' noto.
3. Nessuna `GET` deve limitarsi al solo `url` quando e' possibile esplicitare `filter` e `select`.
4. La `POST /appointments` deve mostrare chiaramente i nuovi binding verso account e prodotto.
5. In caso di fallback o retry, ogni tentativo deve comparire come entry distinta.

## Regole di sanitizzazione

Il blob deve restare utile al debugging tecnico, quindi:

- i dati personali continuano a essere mascherati come oggi (`email`, `nome`, `cognome`, `subject`, `description`, `location`);
- non devono essere mascherati i campi tecnici necessari a capire il flusso:
  - GUID Dynamics;
  - `@odata.bind`;
  - filtri OData;
  - mapping prodotto;
  - payload outbound verso Dynamics.

Questo bilancia troubleshooting e protezione dei dati.

## Impatto sui file

### Da modificare

- `apps/sm-crm-fn/_shared/services/diagnosticLogger.ts`
  - estendere i tipi diagnostici;
  - aggiungere `flowSummary`;
  - gestire `sequence`;
  - adattare sanitizzazione e persistenza.

- `apps/sm-crm-fn/_shared/services/orchestrator.ts`
  - popolare `flowSummary`;
  - registrare esplicitamente i dati derivati del flusso;
  - aggiornare la finalizzazione della sessione diagnostica.

- `apps/sm-crm-fn/_shared/services/accounts.ts`
  - arricchire `addDiagnosticCall(...)` con `substep`, `entity`, `requestDetails`, `success`.

- `apps/sm-crm-fn/_shared/services/contacts.ts`
  - arricchire i log diagnostici di ricerca/creazione contatto;
  - aggiungere `participantRef` dove disponibile.

- `apps/sm-crm-fn/_shared/services/appointments.ts`
  - loggare in modo completo il payload finale verso Dynamics;
  - esporre nel record diagnostico i binding account/prodotto;
  - differenziare chiaramente eventuale fallback.

## Verifica attesa

La verifica corretta del lavoro richiede:

1. generare una richiesta `POST /meetings` con diagnostic logging abilitato;
2. leggere il blob prodotto;
3. confermare che il blob mostri:
   - body frontend;
   - chiamate intermedie verso `accounts`;
   - chiamate verso `contacts`;
   - `POST /appointments` con payload completo;
   - esito finale orchestratore.

## Criterio di successo

Il lavoro e' riuscito quando un operatore puo' aprire un singolo blob JSON e ricostruire, senza leggere il codice:

- input ricevuto dal frontend;
- lookup e decisioni intermedie;
- payload completi outbound verso Dynamics;
- creazione finale del meeting;
- esito complessivo del flusso.
