import { TelemetryClient } from "./appinsights";
import { Failure, TransientFailure } from "./errors";

export interface IStorableError<T> extends Error {
  readonly body: T;
  readonly retriable: boolean;
}

export const toStorableError = <T>(body: T) => (
  error: Failure
): IStorableError<T> => ({
  body,
  message: error.reason,
  name: "Storable Error",
  retriable: TransientFailure.is(error)
});

export const trackError = <T>(
  telemetryClient: TelemetryClient,
  cqrsLogName: string
) => (processingError: IStorableError<T | unknown>): void =>
  telemetryClient.trackEvent({
    name: `trigger.sm.onboarding.${cqrsLogName}.failedwithoutstoringerror`,
    properties: {
      processingError: JSON.stringify(processingError),
      storingError: processingError.message
    },
    tagOverrides: { samplingEnabled: "false" }
  });
