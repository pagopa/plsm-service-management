import { app } from '@azure/functions'
import { handler } from './handler'

export default app.http('slack', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'v1/slack', //api/v1/slack
  handler,
})
