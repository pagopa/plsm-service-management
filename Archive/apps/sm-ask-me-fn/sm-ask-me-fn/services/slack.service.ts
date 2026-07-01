import messages from '../utils/messages'
import { envData } from '../utils/validateEnv'

export const getUserInfo = async (id: string) => {
  const response = await fetch(
    `${envData.SLACK_API_URL}/users.info?user=${id}`,
    {
      headers: {
        Authorization: `Bearer ${envData.SLACK_BOT_TOKEN}`,
      },
    },
  )
  const body = await response.json()

  if (!response.ok) {
    throw new Error(messages.errors.generic)
  }

  return body.user.profile.email
}
