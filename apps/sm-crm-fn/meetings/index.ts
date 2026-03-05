// =============================================================================
// MEETINGS INDEX - Registrazione Azure Functions
// =============================================================================

import { app } from "@azure/functions";
import {
  createMeetingHandler,
  listMeetingsHandler,
  dryRunMeetingHandler,
} from "./handler";

// POST /api/meetings - Crea appuntamento
app.http("createMeeting", {
  methods: ["POST"],
  authLevel: "function",
  route: "meetings",
  handler: createMeetingHandler,
});

// GET /api/meetings - Lista appuntamenti
app.http("listMeetings", {
  methods: ["GET"],
  authLevel: "function",
  route: "meetings",
  handler: listMeetingsHandler,
});

// POST /api/meetings/dry-run - Test senza modifiche
app.http("dryRunMeeting", {
  methods: ["POST"],
  authLevel: "function",
  route: "meetings/dry-run",
  handler: dryRunMeetingHandler,
});
