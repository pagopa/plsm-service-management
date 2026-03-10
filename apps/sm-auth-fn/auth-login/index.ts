import { app } from "@azure/functions";
import { handler } from "./handler";

app.http("auth-login", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth/login",
  handler,
});
