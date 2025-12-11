/* eslint-disable @typescript-eslint/no-explicit-any */

import { AckFn, SayFn, SlashCommand } from "@slack/bolt";
import { validateFiscalCode } from "../../../types/fiscal-code";
import { getUser } from "../../../services/user.service";
import { getLegalCommandMessage } from "../messages/legal.message";
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
  const isAuthorized = await hasLegalAccess(command.user_id);
  if (isAuthorized.error) {
    await say(isAuthorized.error);
    return;
  }
  const fiscalCode = validateFiscalCode(command.text);
  if (fiscalCode.error) {
    await say(fiscalCode.error);
    return;
  }

  const user = await getUser(fiscalCode.data!);
  if (user.error) {
    await say(user.error);
    return;
  }

  say(getLegalCommandMessage(fiscalCode.data!, user.data!));
};

export default legalCommand;
