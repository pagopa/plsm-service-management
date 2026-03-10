import { app } from "@azure/functions";
import { handler } from "./handler";

app.http("auth-callback", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth/callback",
  handler,
});
