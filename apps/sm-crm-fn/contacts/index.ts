// =============================================================================
// CONTACTS INDEX - Azure Function Definition
// =============================================================================

import { app } from "@azure/functions";
import { getContactsHandler } from "./handler";

app.http("getContacts", {
  methods: ["GET"],
  authLevel: "function",
  route: "contacts",
  handler: getContactsHandler,
});
