import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("auth-validate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/validate",
  handler,
});
