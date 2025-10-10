import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs,
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import { User } from '../../../types/user'
import hasAuthorization from '../../../utils/hasAuthorization'
import { envData } from '../../../utils/validateEnv'
import getUsersMessage from '../messages/users.message'
import generateXLSX from '../../../utils/generateXLSX'
import { WebClient } from '@slack/web-api'
import {
  completeUpload,
  getFileName,
  getURL,
  uploadXLSX,
} from '../../../utils/slackUploads'
import { TelemetryClient } from 'applicationinsights'
import { trackEvent } from '../../../utils/AppInsight/tracking'
import messages from '../../../utils/messages'

const client = new WebClient(envData.SLACK_BOT_TOKEN)
const xlsColumWidth = 80

const usersAction =
  (ai: TelemetryClient) =>
  async ({
    body,
    ack,
    say,
  }: SlackActionMiddlewareArgs<BlockButtonAction> &
    AllMiddlewareArgs<StringIndexed>) => {
    const channelId = body.channel?.id
    await ack()
    if (!body.actions[0].value) {
      return
    }

    const [institutionId, productId] = body.actions[0].value.split('_')

    if (!(await hasAuthorization(body.user.id, say))) {
      return
    }

    const response = await fetch(
      `${envData.USERS_URL}/${institutionId}/users?productId=${productId}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': envData.USERS_APIM_SUBSCRIPTION_KEY,
        },
      },
    )
    const data: Array<User> = await response.json()

    if (!response.ok) {
      await say(messages.errors.generic)
      return
    }

    if (data.length < envData.MAX_DATA_LENGTH) {
      await say(getUsersMessage(data))
      return
    }
    await say(messages.users.fileGeneration)
    const fileBuffer = await generateXLSX(data, xlsColumWidth)
    const tempURL = await getURL(client)(
      getFileName(productId),
      fileBuffer.byteLength,
      'Lista utenti',
    )

    if (tempURL.upload_url && tempURL.file_id && fileBuffer && channelId) {
      try {
        const data = await uploadXLSX(tempURL.upload_url, fileBuffer)

        await say(
          `Sto inviando il file a ${channelId} - ${JSON.stringify(data)}`,
        )
        const upStatus = await completeUpload(client)(
          channelId,
          getFileName(productId),
          tempURL.file_id,
        )
        await say(`Lo status dell'upload è: ${upStatus.ok ? 'OK' : 'KO'}`)
      } catch (error) {
        trackEvent(ai)('io-servicemanagement.askmeanything', {
          operation: 'usersAction',
          status: `error ${JSON.stringify(error)}`,
          channelId: channelId ?? 'Nessun canale',
          fileId: tempURL.file_id ?? 'Nessun file Id',
          uploadUrl: tempURL.upload_url ?? 'Nessun upload URL',
        })
      }
    } else {
      await say(messages.users.error)
      trackEvent(ai)('io-servicemanagement.askmeanything', {
        operation: 'usersAction',
        status: 'error',
        channelId: channelId ?? 'Nessun canale',
        fileId: tempURL.file_id ?? 'Nessun file Id',
        uploadUrl: tempURL.upload_url ?? 'Nessun upload URL',
      })
    }
  }

export default usersAction
