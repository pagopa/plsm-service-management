import * as express from 'express';

import { wrapRequestHandler } from '@pagopa/io-functions-commons/dist/src/utils/request_middleware';
import {
  IResponseErrorInternal,
  IResponseSuccessAccepted,
  ResponseErrorInternal,
  ResponseSuccessAccepted,
} from '@pagopa/ts-commons/lib/responses';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { checkApplicationHealth, HealthCheck } from '../utils/healthcheck';

type InfoHandler = () => Promise<
  IResponseSuccessAccepted<unknown> | IResponseErrorInternal
>;

export function InfoHandler(healthCheck: HealthCheck): InfoHandler {
  return () =>
    pipe(
      healthCheck,
      TE.bimap(
        (problems) => ResponseErrorInternal(problems.join('\n\n')),
        (_) => ResponseSuccessAccepted()
      ),
      TE.toUnion
    )();
}

export function Info(): express.RequestHandler {
  const handler = InfoHandler(checkApplicationHealth());

  return wrapRequestHandler(handler);
}
