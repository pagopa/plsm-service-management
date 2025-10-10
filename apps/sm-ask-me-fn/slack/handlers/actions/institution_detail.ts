import {
  AllMiddlewareArgs,
  BlockExternalSelectAction,
  SlackActionMiddlewareArgs,
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import { getInstitution } from '../../../services/institution.service'
import messages from '../../../utils/messages'
import getInstitutionDetailMessage from '../messages/institution-detail.message'

const institutionDetailAction = async ({
  body,
  ack,
  say,
}: SlackActionMiddlewareArgs<BlockExternalSelectAction> &
  AllMiddlewareArgs<StringIndexed>) => {
  await ack()

  if (!body.actions[0].selected_option?.value) {
    return
  }

  try {
    const [taxCode, subunitCode] =
      body.actions[0].selected_option.value.split('_')

    const institution = await getInstitution(taxCode, subunitCode)

    if (!institution) {
      throw new Error()
    }

    await say(getInstitutionDetailMessage(taxCode, subunitCode, institution))
  } catch (error) {
    if (error instanceof Error) {
      say(error.message)
    } else {
      say(messages.errors.generic)
    }
  }
}

export default institutionDetailAction
