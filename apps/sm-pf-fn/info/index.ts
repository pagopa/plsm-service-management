import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler,
});
