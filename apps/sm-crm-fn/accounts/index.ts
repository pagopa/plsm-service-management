// =============================================================================
// ACCOUNTS INDEX - Azure Function Definition
// =============================================================================

import { app } from "@azure/functions";
import { getAccountHandler } from "./handler";

app.http("getAccount", {
  methods: ["GET"],
  authLevel: "function",
  route: "accounts",
  handler: getAccountHandler,
});
