/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import * as t from "io-ts";

import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.type({
  APPINSIGHTS_INSTRUMENTATIONKEY: NonEmptyString,

  CONTRACTS_CONSUMER_CONNECTION_STRING: NonEmptyString,
  CONTRACTS_TOPIC_CONSUMER_GROUP: NonEmptyString,
  CONTRACTS_TOPIC_NAME: NonEmptyString,

  ENDPOINT_GET_INSTITUTION_FROM_TAXCODE: NonEmptyString,

  OCP_APIM_SUBSCRIPTION_KEY: NonEmptyString,

  SLACK_WEBHOOK_LOG: NonEmptyString,
  SLACK_WEBHOOK_ONBOARDING_INTEROP: NonEmptyString,
  SLACK_WEBHOOK_ONBOARDING_IO: NonEmptyString,
  SLACK_WEBHOOK_ONBOARDING_IO_PREMIUM: NonEmptyString,
  SLACK_WEBHOOK_ONBOARDING_PAGOPA: NonEmptyString,
  SLACK_WEBHOOK_ONBOARDING_PN: NonEmptyString,

  isProduction: t.boolean
});

export const envConfig = {
  ...process.env,
  CONTRACTS_TOPIC_CONSUMER_GROUP: pipe(
    process.env.CONTRACTS_TOPIC_CONSUMER_GROUP,
    O.fromNullable,
    O.getOrElse(() => "$Default")
  ),
  isProduction: process.env.NODE_ENV === "production"
};

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode(envConfig);

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export const getConfig = (): t.Validation<IConfig> => errorOrConfig;

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export const getConfigOrThrow = (): IConfig =>
  pipe(
    errorOrConfig,
    E.getOrElseW((errors: ReadonlyArray<t.ValidationError>) => {
      throw new Error(`Invalid configuration: ${readableReport(errors)}`);
    })
  );
