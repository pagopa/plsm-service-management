// =============================================================================
// CONTACTS INDEX - Azure Function Definition
// =============================================================================

import { app } from "@azure/functions";
import { getContactsHandler } from "./handler";
import { createContactsHandler } from "./createHandler";

app.http("getContacts", {
  methods: ["GET"],
  authLevel: "function",
  route: "contacts",
  handler: getContactsHandler,
});

app.http("createContacts", {
  methods: ["POST"],
  authLevel: "function",
  route: "contacts",
  handler: createContactsHandler,
});
