import { AzureFunction, Context, HttpRequest } from '@azure/functions';

interface IHttpResponse {
  status: number;
  headers?: { [key: string]: string };
}

async function myHandlerLogic(
  req: HttpRequest,
  context: Context
): Promise<IHttpResponse> {
  context.log('Eseguo la logica principale in stile Express...');

  // Restituisci l'oggetto di successo
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  };
}

const createHandler = (
  handler: (req: HttpRequest, context: Context) => Promise<IHttpResponse>
): AzureFunction => {
  return async (context: Context, req: HttpRequest): Promise<void> => {
    try {
      const result = await handler(req, context);

      context.res = result;
    } catch (error) {
      context.log.error("Errore non gestito nell'handler:", error);
      context.res = {
        status: 500,
        body: 'Errore interno del server.',
      };
    }
  };
};

export default createHandler(myHandlerLogic);
