import { HttpRequest, InvocationContext } from '@azure/functions'
import { envData } from '../utils/validateEnv'
import { parseBody, readHeader } from '../utils/parseRequest'
import { runSlackApp } from '../slack/slackApp'

export const handler = async (
  request: HttpRequest,
  context: InvocationContext
) => {
  context.log(`Starting ${envData.SERVICENAME}`)

  if (request.method === 'GET') {
    context.log(`Http request on GET for ${request.url}`)
    return {
      body: JSON.stringify({ data: `Hello World` }),
      status: 200,
    }
  } else {
    const body = await request.text()
    const contentType = readHeader(request, 'content-type')
    const payload = parseBody(body, contentType)

    if (payload && payload.challenge) {
      const { challenge } = payload
      return {
        status: 200,
        body: JSON.stringify({
          challenge,
        }),
      }
    }

    runSlackApp(payload)

    return {
      status: 202,
    }
  }
}
