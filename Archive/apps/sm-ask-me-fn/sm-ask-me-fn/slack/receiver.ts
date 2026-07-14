import { ExpressReceiver } from '@slack/bolt'
import { envData } from '../utils/validateEnv'
import rateLimit from 'express-rate-limit'

const receiver = new ExpressReceiver({
  signingSecret: envData.SLACK_SIGNING_SECRET,
  processBeforeResponse: true,
})

// Add rate limiting middleware
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60, // limit each IP to 60 requests per window
})

receiver.router.use(limiter)

export default receiver
