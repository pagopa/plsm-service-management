import { AzureFunction, Context, HttpRequest } from '@azure/functions';

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  // Logga l'inizio dell'esecuzione per il debugging.
  context.log('HTTP trigger function processed a request.');

  // Cerca il parametro 'name' prima nella query string (es. ?name=Mondo)
  // e poi nel corpo della richiesta (es. { "name": "Mondo" }).
  const name = req.query.name || (req.body && req.body.name);

  // Prepara un messaggio di risposta standard.
  const responseMessage = name
    ? 'Ciao, ' + name + '. La funzione è stata eseguita con successo!'
    : "Questa funzione HTTP è stata eseguita con successo. Passa un 'name' nella query string o nel corpo della richiesta per una risposta personalizzata.";

  // Se il nome è stato fornito, rispondi con successo (200 OK).
  if (name) {
    context.res = {
      // Status: 200 OK
      status: 200,
      body: responseMessage,
    };
  }
  // Altrimenti, rispondi con un errore (400 Bad Request) indicando il parametro mancante.
  else {
    context.res = {
      status: 400,
      body: "Per favore, passa un 'name' nella query string o nel corpo della richiesta.",
    };
  }
};

export default httpTrigger;
