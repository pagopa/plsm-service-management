import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import * as t from 'io-ts';
import { getCurrentDate, isAdd } from './date';

const PRODUCT_LITERALS = {
  FD: 'prod-fd',
  INTEROP: 'prod-interop',
  INTEROP_ATST: 'prod-interop-atst',
  INTEROP_COLL: 'prod-interop-coll',
  IO: 'prod-io',
  IO_PREMIUM: 'prod-io-premium',
  IO_SIGN: 'prod-io-sign',
  PAGOPA: 'prod-pagopa',
  PN: 'prod-pn',
} as const;

export type ProductType = t.TypeOf<typeof ProductType>;
export const ProductType = t.union([
  t.literal(PRODUCT_LITERALS.IO),
  t.literal(PRODUCT_LITERALS.IO_PREMIUM),
  t.literal(PRODUCT_LITERALS.PN),
  t.literal(PRODUCT_LITERALS.FD),
  t.literal(PRODUCT_LITERALS.PAGOPA),
  t.literal(PRODUCT_LITERALS.IO_SIGN),
  t.literal(PRODUCT_LITERALS.INTEROP),
  t.literal(PRODUCT_LITERALS.INTEROP_COLL),
  t.literal(PRODUCT_LITERALS.INTEROP_ATST),
  NonEmptyString,
]);

const PricingPlanWithC = t.brand(
  t.string,
  (s): s is t.Branded<string, { readonly PricingPlanWithC: unique symbol }> =>
    /^C\d+$/.test(s),
  'PricingPlanWithC'
);

export type DecodedContract = t.TypeOf<typeof DecodedContract>;
export const DecodedContract = t.intersection([
  t.type({
    createdAt: NonEmptyString,
    institution: t.intersection([
      t.type({
        description: NonEmptyString,
        institutionType: NonEmptyString,
        origin: NonEmptyString,
        originId: NonEmptyString,
      }),
      t.partial({
        taxCode: NonEmptyString,
      }),
    ]),
    internalIstitutionID: NonEmptyString,
    notificationType: t.union([t.literal('ADD'), t.literal('UPDATE')]),
    product: ProductType,
    updatedAt: NonEmptyString,
  }),
  t.partial({
    billing: t.union([
      t.partial({
        recipientCode: t.union([NonEmptyString, t.string, t.null]),
      }),
      t.null,
    ]),
    pricingPlan: t.union([t.literal('FA'), PricingPlanWithC, t.null]),
  }),
]);

export type EnrichData = t.TypeOf<typeof EnrichData>;
export const EnrichData = t.intersection(
  [DecodedContract, t.type({ rootParent: NonEmptyString })],
  'EnrichData'
);

export type MessageToSlack = t.TypeOf<typeof MessageToSlack>;
export const MessageToSlack = t.type({
  attachments: t.readonlyArray(
    t.type({
      color: NonEmptyString,
      fields: t.readonlyArray(
        t.union([
          t.type({
            short: t.boolean,
            title: NonEmptyString,
            value: NonEmptyString,
          }),
          t.null,
        ])
      ),
      footer: NonEmptyString,
      pretext: NonEmptyString,
      text: NonEmptyString,
      title: NonEmptyString,
      ts: t.number,
    })
  ),
});

const prettifyPlan = (plan: string): string => {
  switch (plan) {
    case 'FA': {
      return 'Fast';
    }

    default: {
      return 'Premium';
    }
  }
};

const getText = (data: EnrichData): NonEmptyString => {
  switch (data.product) {
    case PRODUCT_LITERALS.INTEROP:
    case PRODUCT_LITERALS.INTEROP_COLL:
    case PRODUCT_LITERALS.INTEROP_ATST: {
      return `Origin: ${data.institution.origin} e OriginID: ${data.institution.originId}` as NonEmptyString;
    }
    case PRODUCT_LITERALS.IO:
    case PRODUCT_LITERALS.IO_PREMIUM: {
      return `Arrivata nuova istanza di onboarding - Pricing plan: ${
        data.pricingPlan ? prettifyPlan(data.pricingPlan) : 'Non esplicitato'
      }` as NonEmptyString;
    }
    default: {
      return `Arrivata nuova istanza di onboarding` as NonEmptyString;
    }
  }
};

const getProduct = (product: string): string => {
  switch (product) {
    case PRODUCT_LITERALS.INTEROP: {
      return 'Interoperabilità';
    }
    case PRODUCT_LITERALS.PAGOPA: {
      return 'Piattaforma pagoPA';
    }
    case PRODUCT_LITERALS.PN: {
      return 'SEND';
    }
    case PRODUCT_LITERALS.IO: {
      return 'IO';
    }
    case PRODUCT_LITERALS.IO_PREMIUM: {
      return 'IO Premium';
    }
    case PRODUCT_LITERALS.INTEROP_ATST: {
      return 'Interoperabilità Attestazione';
    }
    case PRODUCT_LITERALS.INTEROP_COLL: {
      return 'Interoperabilità Collaudo';
    }
    default: {
      return product;
    }
  }
};

export const onboarding = (data: EnrichData): MessageToSlack => {
  const currentDate = getCurrentDate(new Date());
  const rootParent =
    data.rootParent.toLocaleUpperCase() ===
    data.institution.description.toLocaleUpperCase()
      ? null
      : {
          short: true,
          title: 'Root Parent' as NonEmptyString,
          value: `${data.rootParent}` as NonEmptyString,
        };
  return {
    attachments: [
      {
        color: '#36A64F' as NonEmptyString,
        fields: [
          {
            short: true,
            title: 'Tax Code' as NonEmptyString,
            value: `${
              data.institution.taxCode
                ? data.institution.taxCode
                : 'Non presente'
            }` as NonEmptyString,
          },
          {
            short: true,
            title: 'Recipient Code' as NonEmptyString,
            value: `${
              data.billing?.recipientCode && data.billing?.recipientCode !== ''
                ? data.billing.recipientCode
                : 'Nessun dato'
            }` as NonEmptyString,
          },
          {
            short: true,
            title: 'Institution Type' as NonEmptyString,
            value: `${data.institution.institutionType}` as NonEmptyString,
          },
          {
            short: true,
            title: 'Prodotto' as NonEmptyString,
            value: `${getProduct(data.product)} :pagopa-bot:` as NonEmptyString,
          },
          {
            short: true,
            title: `Data e Ora :calendar:` as NonEmptyString,
            value: currentDate as NonEmptyString,
          },
          {
            short: true,
            title: 'Type' as NonEmptyString,
            value: `${isAdd(data) ? 'ADD' : 'UPDATE'}` as NonEmptyString,
          },
          {
            short: true,
            title: 'Institution ID' as NonEmptyString,
            value: `${data.internalIstitutionID}` as NonEmptyString,
          },
          rootParent,
        ],
        footer: `Service Management :rocket:` as NonEmptyString,
        pretext:
          `:mega: *Oggi onboarding ${data.institution.description}* :mega:` as NonEmptyString,
        text: getText(data),
        title: `Dettagli onboarding` as NonEmptyString,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
};

export const errorOnboarding = ({
  data,
  message,
}: {
  readonly data: string;
  readonly message: string;
}): MessageToSlack => {
  const currentDate = getCurrentDate(new Date());
  return {
    attachments: [
      {
        color: '#36A64F' as NonEmptyString,
        fields: [
          {
            short: true,
            title: `Data e Ora :calendar:` as NonEmptyString,
            value: currentDate as NonEmptyString,
          },
        ],
        footer: ` Service Management :rocket:` as NonEmptyString,
        pretext: `:mega: *Errore* :mega:` as NonEmptyString,
        text: `Si è presentato un errore: ${message}` as NonEmptyString,
        title: `Errore onboarding ${data}` as NonEmptyString,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
};
