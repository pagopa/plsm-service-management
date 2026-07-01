import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs,
} from "@slack/bolt";
import { StringIndexed } from "@slack/bolt/dist/types/helpers";
import validateInput from "../../../utils/validateInput";
import getProductsMessage from "../messages/products.message";
import { getInstitution } from "../../../services/institution.service";
import messages from "../../../utils/messages";
import { hasSelfcareAccess } from "../../../services/auth.service";

const productsAction = async ({
  body,
  ack,
  say,
}: SlackActionMiddlewareArgs<BlockButtonAction> &
  AllMiddlewareArgs<StringIndexed>) => {
  await ack();
  if (!body || !body.actions || !body.actions[0] || !body.actions[0].value) {
    return;
  }

  try {
    const [taxCode, subunitCode] = body.actions[0].value.split("_");

    if (!(await validateInput({ taxCode }, say))) {
      return;
    }

    const isAuthorized = await hasSelfcareAccess(body.user.id);
    if (isAuthorized.error) {
      await say(isAuthorized.error);
      return;
    }

    const institution = await getInstitution(taxCode, subunitCode);

    say(getProductsMessage(institution.onboarding));
  } catch (error) {
    if (error instanceof Error) {
      say(error.message);
    } else {
      say(messages.errors.generic);
    }
  }
};

export default productsAction;
