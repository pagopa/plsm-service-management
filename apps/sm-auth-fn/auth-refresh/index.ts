import { app } from "@azure/functions";
import { handler } from "./handler";

app.http("auth-refresh", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/refresh",
  handler,
});
