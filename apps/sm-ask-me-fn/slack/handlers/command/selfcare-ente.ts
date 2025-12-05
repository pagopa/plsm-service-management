/* eslint-disable @typescript-eslint/no-explicit-any */

import { AckFn, SayFn, SlashCommand } from "@slack/bolt";
import { getInstitutionByTaxCode } from "../../../services/institution.service";
import messages from "../../../utils/messages";
import { validateTaxCode } from "../../../utils/validateInput";
import getSelfcareEnteMessage from "../messages/selfcare-ente.message";
import { hasSelfcareAccess } from "../../../services/auth.service";

const selfcareEnteCommand = async ({
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
    const [taxCodeInput, subunitCode] = command.text.split(" ");
    const { data, error } = validateTaxCode(taxCodeInput);

    if (error || data === null) {
      await say(error);
      return;
    }

    console.log("checking user auth for id:", command.user_id);

    const isAuthorized = await hasSelfcareAccess(command.user_id);
    if (isAuthorized.error) {
      console.error("auth check error:", isAuthorized.error);
      await say(isAuthorized.error);
      return;
    }

    const { root, institutions } = await getInstitutionByTaxCode(data);

    say(
      getSelfcareEnteMessage({
        taxCode: data,
        subunitCode,
        root,
        institutions,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      say(error.message);
    } else {
      say(messages.errors.generic);
    }
  }
};

export default selfcareEnteCommand;
