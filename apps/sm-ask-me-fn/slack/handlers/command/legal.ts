/* eslint-disable @typescript-eslint/no-explicit-any */

import { AckFn, SayFn, SlashCommand } from "@slack/bolt";
import { validateFiscalCode } from "../../../types/fiscal-code";
import { getUser, UserResponse } from "../../../services/user.service";
import { getLegalCommandMessage } from "../messages/legal.message";
import messages from "../../../utils/messages";
import { hasLegalAccess } from "../../../services/auth.service";

const legalCommand = async ({
  command,
  ack,
  say,
}: {
  command: SlashCommand;
  ack: AckFn<any>;
  say: SayFn;
}): Promise<void> => {
  await ack();
  try {
    const isAuthorized = await hasLegalAccess(command.user_id);
    if (isAuthorized.error) {
      await say(isAuthorized.error);
      return;
    }

    const fiscalCode = validateFiscalCode(command.text);
    const data = await getUser(fiscalCode);

    say(getLegalCommandMessage(fiscalCode, data as UserResponse));
  } catch (error) {
    if (error instanceof Error) {
      say(error.message);
      return;
    }

    say(messages.errors.generic);
    return;
  }
};

export default legalCommand;
