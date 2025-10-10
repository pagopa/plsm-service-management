import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs,
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import { getDelegations } from '../../../services/delegations.service'
import getDelegationsMessage from '../messages/delegations.message'

const delegationsAction = async ({
  body,
  ack,
  say,
}: SlackActionMiddlewareArgs<BlockButtonAction> &
  AllMiddlewareArgs<StringIndexed>) => {
  await ack()

  try {
    const institutionId = body.actions[0].value
    if (!institutionId) {
      throw new Error('Si è verificato un errore riprova più tardi')
    }

    const delegations = await getDelegations(institutionId)

    await say(getDelegationsMessage(delegations))
  } catch (error) {
    if (error instanceof Error) {
      say(error.message)
    } else {
      say('Si è verificato un errore riprova più tardi')
    }
  } finally {
    return
  }
}

export default delegationsAction
