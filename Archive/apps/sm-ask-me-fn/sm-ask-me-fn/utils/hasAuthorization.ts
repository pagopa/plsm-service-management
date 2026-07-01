import { SayFn } from '@slack/bolt'
import { envData } from './validateEnv'
import messages from './messages'

const hasAuthorization = async (
  userId: string,
  say: SayFn,
): Promise<string | null> => {
  const users = envData.ENABLED_EMAILS_SECRET

  const response = await fetch(
    `${envData.SLACK_API_URL}/users.info?user=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${envData.SLACK_BOT_TOKEN}`,
      },
    },
  )
  const body = await response.json()

  if (!response.ok) {
    await say(messages.errors.generic)
    return null
  }

  if (!users.find((user) => user === body.user.profile.email)) {
    await say(messages.auth.unauthorized)
    return null
  }

  return body.user.profile.email
}

export default hasAuthorization
