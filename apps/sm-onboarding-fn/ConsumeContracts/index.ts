import { Context } from '@azure/functions';

import { initTelemetryClient } from '../utils/appinsights';
import { getConfigOrThrow } from '../utils/config';
import { handle } from './handler';

const config = getConfigOrThrow();

const telemetryClient = initTelemetryClient(
  config.APPINSIGHTS_INSTRUMENTATIONKEY
);

const run = async (context: Context, rawContract: unknown) => {
  await handle(context, telemetryClient, config)(rawContract);
};

export default run;
