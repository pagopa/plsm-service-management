import * as avro from "avsc";
import { ScContracts as contract } from "../generated/avro/it/pagopa/selfcare/ScContracts";
import { Sample as sample } from "../generated/avro/it/pagopa/test/Sample";

export const ScContractsSchema = avro.Type.forSchema(
  contract.schema as avro.Schema
);

export const SampleSchema = avro.Type.forSchema(sample.schema as avro.Schema);
