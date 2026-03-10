import { app } from "@azure/functions";
import { handler } from "./handler";

app.http("auth-logout", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/logout",
  handler,
});
