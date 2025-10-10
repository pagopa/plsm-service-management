import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs,
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import hasAuthorization from '../../../utils/hasAuthorization'
import validateInput from '../../../utils/validateInput'
import getProductsMessage from '../messages/products.message'
import { getInstitution } from '../../../services/institution.service'
import messages from '../../../utils/messages'

const productsAction = async ({
  body,
  ack,
  say,
}: SlackActionMiddlewareArgs<BlockButtonAction> &
  AllMiddlewareArgs<StringIndexed>) => {
  await ack()
  if (!body || !body.actions || !body.actions[0] || !body.actions[0].value) {
    return
  }

  try {
    const [taxCode, subunitCode] = body.actions[0].value.split('_')

    if (!(await validateInput({ taxCode }, say))) {
      return
    }

    if (!(await hasAuthorization(body.user.id, say))) {
      return
    }

    const institution = await getInstitution(taxCode, subunitCode)

    say(getProductsMessage(institution.onboarding))
  } catch (error) {
    if (error instanceof Error) {
      say(error.message)
    } else {
      say(messages.errors.generic)
    }
  }
}

export default productsAction
