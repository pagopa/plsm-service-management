import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("ping", {
  methods: ["GET"],
  authLevel: "function",
  route: "dynamics/ping",
  handler,
});
