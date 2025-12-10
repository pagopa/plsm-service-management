import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "info",
  handler,
});
