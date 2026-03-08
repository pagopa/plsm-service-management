import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("auth-refresh", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/refresh",
  handler,
});
