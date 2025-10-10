/* eslint-disable @typescript-eslint/no-explicit-any */

import { AckFn, SayFn, SlashCommand } from '@slack/bolt'
import { validateFiscalCode } from '../../../types/fiscal-code'
import { getUser, UserResponse } from '../../../services/user.service'
import { getLegalCommandMessage } from '../messages/legal.message'
import { envData } from '../../../utils/validateEnv'
import { getUserInfo } from '../../../services/slack.service'
import messages from '../../../utils/messages'

const legalCommand = async ({
  command,
  ack,
  say,
}: {
  command: SlashCommand
  ack: AckFn<any>
  say: SayFn
}): Promise<void> => {
  await ack()
  try {
    const email = await getUserInfo(command.user_id)

    if (!envData.LEGAL_ENABLED_EMAILS_SECRET.find((item) => item === email)) {
      throw new Error("Non hai l'autorizzazione per utilizzare questo comando.")
    }

    const fiscalCode = validateFiscalCode(command.text)
    const data = await getUser(fiscalCode)

    say(getLegalCommandMessage(fiscalCode, data as UserResponse))
  } catch (error) {
    if (error instanceof Error) {
      say(error.message)
      return
    }

    say(messages.errors.generic)
    return
  }
}

export default legalCommand
