import { app, InvocationContext, Timer } from "@azure/functions";
import { timerTrigger } from "./handler";
import { getConfigOrThrow } from "../utils/checkConfig";

app.timer("timerTrigger", {
  schedule: "*/10 * * * * *",
  handler: async (_myTimer: Timer, context: InvocationContext) => {
    try {
      const config = getConfigOrThrow();
      timerTrigger(config)(_myTimer, context);
    } catch (error) {
      console.error(
        "Errore durante l'esecuzione di timerTrigger: configurazione mancante o invalida.",
        error
      );
    }
  },
});
