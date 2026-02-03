import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("ping", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "dynamics/ping",
  handler,
});
