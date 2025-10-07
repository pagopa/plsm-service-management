/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from "@azure/functions";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { toError } from "fp-ts/lib/Either";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { TelemetryClient, trackException } from "../utils/appinsights";
import {
  DecodedContract,
  EnrichData,
  errorOnboarding,
  MessageToSlack,
  onboarding
} from "../utils/messageslack";
import { IConfig } from "../utils/config";
import {
  PermanentFailure,
  toPermanentFailure,
  toTransientFailure,
  TransientFailure
} from "../utils/errors";
import { errorsToError } from "../utils/conversions";
import { isAdd } from "../utils/date";

const getChannel = (config: IConfig, contract: DecodedContract): string => {
  if (isAdd(contract)) {
    switch (contract.product.toLocaleLowerCase()) {
      case "prod-interop":
      case "prod-interop-coll":
      case "prod-interop-atst": {
        return config.SLACK_WEBHOOK_ONBOARDING_INTEROP;
      }
      case "prod-io": {
        return config.SLACK_WEBHOOK_ONBOARDING_IO;
      }
      case "prod-io-premium": {
        return config.SLACK_WEBHOOK_ONBOARDING_IO_PREMIUM;
      }
      case "prod-pagopa": {
        return config.SLACK_WEBHOOK_ONBOARDING_PAGOPA;
      }
      case "prod-pn": {
        return config.SLACK_WEBHOOK_ONBOARDING_PN;
      }
      default: {
        return config.SLACK_WEBHOOK_LOG;
      }
    }
  }
  return config.SLACK_WEBHOOK_LOG;
};

const sendToSlack = (
  context: Context,
  url: NonEmptyString,
  message: MessageToSlack
): TE.TaskEither<Error, Response> =>
  TE.tryCatch(
    () =>
      fetch(url, {
        body: JSON.stringify(message),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      }),
    e => {
      context.log(`Error on sending to slack ${e}`);
      return toError(e);
    }
  );

export const handle = (
  _context: Context,
  _telemetryClient: TelemetryClient,
  config: IConfig
) => (rawContract: any): Promise<any> =>
  pipe(
    _context.log(`received rawContract => ${JSON.stringify(rawContract)}`),
    () =>
      pipe(
        rawContract,
        DecodedContract.decode,
        TE.fromEither,
        TE.mapLeft(flow(errorsToError, e => toPermanentFailure(e)())),
        TE.chain(decodedContract =>
          pipe(
            TE.tryCatch(
              () =>
                fetch(
                  `${config.ENDPOINT_GET_INSTITUTION_FROM_TAXCODE}${decodedContract.institution.taxCode}`,
                  {
                    headers: {
                      "Ocp-Apim-Subscription-Key":
                        config.OCP_APIM_SUBSCRIPTION_KEY
                    },
                    method: "GET"
                  }
                )
                  .then(res => res.json())
                  .then(data => {
                    _context.log(`Enrich Data is ${JSON.stringify(data)}`);
                    return data as {
                      readonly institutions: ReadonlyArray<{
                        readonly description: string;
                      }>;
                    };
                  })
                  .catch(e => {
                    _context.log(
                      `Error on fetch data ${config.ENDPOINT_GET_INSTITUTION_FROM_TAXCODE}${decodedContract.institution.taxCode}`
                    );
                    throw toTransientFailure(
                      Error(
                        JSON.stringify(
                          `Error on fetch data ${config.ENDPOINT_GET_INSTITUTION_FROM_TAXCODE}${decodedContract.institution.taxCode} - ${e}`
                        )
                      )
                    )();
                  }),
              e =>
                toTransientFailure(
                  Error(
                    JSON.stringify(
                      `Error on TryCatch data ${config.ENDPOINT_GET_INSTITUTION_FROM_TAXCODE}${decodedContract.institution.taxCode} - ${e}`
                    )
                  )
                )()
            ),
            TE.map(res => ({
              ...decodedContract,
              rootParent:
                res.institutions && res.institutions.length > 0
                  ? (res.institutions[0].description as NonEmptyString)
                  : ("Nessun Root Parent" as NonEmptyString)
            }))
          )
        ),
        TE.chain(enrichedData =>
          pipe(
            enrichedData,
            EnrichData.decode,
            TE.fromEither,
            () => onboarding(enrichedData),
            MessageToSlack.decode,
            TE.fromEither,
            TE.map(formattedDecodedContract => ({
              channel: getChannel(config, enrichedData),
              formattedDecodedContract
            })),
            TE.mapLeft(() =>
              toPermanentFailure(
                Error(
                  JSON.stringify(
                    `Error on decode enrichedData: ${JSON.stringify(
                      enrichedData
                    )}`
                  )
                )
              )()
            )
          )
        )
      ),
    TE.chain(data =>
      pipe(
        sendToSlack(
          _context,
          data.channel as NonEmptyString,
          data.formattedDecodedContract
        ),
        TE.mapLeft(error => toPermanentFailure(Error(JSON.stringify(error)))())
      )
    ),
    TE.mapLeft(e => {
      const isTransient = TransientFailure.is(e);
      const error = isTransient
        ? `HandleRawContract|TRANSIENT_ERROR=${e.reason}`
        : `HandleRawContract|FATAL|PERMANENT_ERROR=${
            e.reason
          }|INPUT=${JSON.stringify(rawContract)}`;
      trackException(_telemetryClient, {
        exception: new Error(error),
        properties: {
          detail: e.kind,
          fatal: PermanentFailure.is(e).toString(),
          isSuccess: "false",
          modelId: e.modelId ?? "",
          name: "sm.onboarding.retry.failure"
        },
        tagOverrides: { samplingEnabled: String(isTransient) }
      });
      _context.log("Invio errore su SLACK");
      _context.log(
        `${e.kind}, ${JSON.stringify(rawContract, null, 2)} ${e.reason}`
      );
      void sendToSlack(
        _context,
        config.SLACK_WEBHOOK_LOG,
        errorOnboarding({
          data: e.kind,
          message: `Errore su ${JSON.stringify(rawContract, null, 2)}: ${
            e.reason
          }`
        })
      )();

      if (isTransient) {
        // Trigger a retry in case of temporary failures
        throw new Error(error);
      }
      return e;
    }),
    TE.toUnion
  )();
