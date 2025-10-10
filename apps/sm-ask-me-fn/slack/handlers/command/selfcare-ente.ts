/* eslint-disable @typescript-eslint/no-explicit-any */

import { AckFn, SayFn, SlashCommand } from '@slack/bolt'
import { getInstitutionByTaxCode } from '../../../services/institution.service'
import hasAuthorization from '../../../utils/hasAuthorization'
import messages from '../../../utils/messages'
import { validateTaxCode } from '../../../utils/validateInput'
import getSelfcareEnteMessage from '../messages/selfcare-ente.message'

const selfcareEnteCommand = async ({
  command,
  ack,
  say,
}: {
  command: SlashCommand
  ack: AckFn<any>
  say: SayFn
}) => {
  await ack()

  try {
    const [taxCodeInput, subunitCode] = command.text.split(' ')
    const { data, error } = validateTaxCode(taxCodeInput)

    if (error || data === null) {
      await say(error)
      return
    }

    if (!(await hasAuthorization(command.user_id, say))) {
      return
    }

    const { root, institutions } = await getInstitutionByTaxCode(data)

    say(
      getSelfcareEnteMessage({
        taxCode: data,
        subunitCode,
        root,
        institutions,
      }),
    )
  } catch (error) {
    if (error instanceof Error) {
      say(error.message)
    } else {
      say(messages.errors.generic)
    }
  }
}

export default selfcareEnteCommand
