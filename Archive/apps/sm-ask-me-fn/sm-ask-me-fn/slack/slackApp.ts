import {
  App,
  BlockButtonAction,
  BlockExternalSelectAction,
  ReceiverEvent,
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import { envData } from '../utils/validateEnv'
import selfcareEnteCommand from './handlers/command/selfcare-ente'
import productsAction from './handlers/actions/products'
import productDetailAction from './handlers/actions/product_detail'
import usersAction from './handlers/actions/users'
import contractAction from './handlers/actions/contract'
import receiver from './receiver'
import { initAppInight } from '../utils/AppInsight/appinsight'
import legalCommand from './handlers/command/legal'
import delegationsAction from './handlers/actions/delegations'
import institutionDetailAction from './handlers/actions/institution_detail'

const ai = initAppInight(envData.APPINSIGHTS_CONNECTION_STRING, {
  sampleRate: envData.APPINSIGHTS_SAMPLING_PERCENTAGE,
  disableAppInsights: false,
})

/* eslint-disable @typescript-eslint/no-explicit-any */
export const runSlackApp = (payload: any) => {
  const app = new App({
    token: envData.SLACK_BOT_TOKEN,
    receiver,
  })

  const slackEvent = (payload: StringIndexed): ReceiverEvent => {
    return {
      body: payload,
      /* eslint-disable @typescript-eslint/no-explicit-any */
      ack: async (response: Response): Promise<any> => {
        return {
          statusCode: 200,
          body: response ?? '',
        }
      },
    }
  }

  app.command('/selfcare-ente', selfcareEnteCommand)
  app.command('/legal', legalCommand)
  app.action<BlockButtonAction>('products', productsAction)
  app.action<BlockExternalSelectAction>('product_detail', productDetailAction)
  app.action<BlockExternalSelectAction>(
    'institution_detail',
    institutionDetailAction,
  )
  app.action<BlockButtonAction>('delegations', delegationsAction)
  app.action<BlockButtonAction>('users', usersAction(ai))
  app.action<BlockButtonAction>('contract', contractAction)

  app.processEvent(slackEvent(payload))
  return app
}
