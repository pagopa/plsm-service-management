import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Prodotti PagoPA ammessi. Allineato a ProductIdSelfcare in
 * apps/sm-crm-fn/_shared/types/dynamics.ts, la fonte di verità per i prodotti
 * che possono comparire su una call CRM.
 */
export const PRODUCT_IDS = [
  "prod-pn",
  "prod-io",
  "prod-pagopa",
  "prod-idpay",
  "prod-idpay-merchant",
  "prod-checkiban",
  "prod-interop",
  "prod-io-premium",
  "prod-io-sign",
  "prod-rtp",
] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];

/**
 * Ambienti Dynamics da cui può provenire una call. Allineato a
 * DynamicsEnvironment in apps/sm-crm-fn/_shared/utils/requestEnvironment.ts:
 * l'unica sm-crm-fn serve sia UAT sia PROD (header x-dynamics-environment),
 * quindi le call UAT convivono nella stessa tabella e vanno tenute separate.
 */
export const ENVIRONMENTS = ["UAT", "PROD"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

export const calls = pgTable(
  "calls",
  {
    id: uuid().defaultRandom().primaryKey(),
    crmActivityId: uuid("crm_activity_id").notNull(),
    title: text(),
    institutionId: uuid("institution_id"),
    institutionName: text("institution_name"),
    productId: text("product_id").$type<ProductId>().notNull(),
    callDate: timestamp("call_date", { withTimezone: true }).notNull(),
    link: text(),
    // Default PROD: le righe esistenti prima di questa colonna sono tutte
    // call reali di produzione.
    environment: text()
      .$type<Environment>()
      .default("PROD")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    unique("uq_calls_crm_activity_id").on(table.crmActivityId),
    // La lista è derivata da PRODUCT_IDS: aggiungere un prodotto alla costante
    // produce automaticamente una migrazione che aggiorna il vincolo.
    check(
      "calls_product_id_check",
      sql`${table.productId} IN (${sql.join(
        PRODUCT_IDS.map((productId) => sql`${productId}`),
        sql`,`,
      )})`,
    ),
    check(
      "calls_environment_check",
      sql`${table.environment} IN (${sql.join(
        ENVIRONMENTS.map((environment) => sql`${environment}`),
        sql`,`,
      )})`,
    ),
    index("idx_calls_call_date").using("btree", table.callDate.desc()),
    // Ogni lettura filtra per ambiente e ordina/filtra per data.
    index("idx_calls_environment_call_date").using(
      "btree",
      table.environment,
      table.callDate.desc(),
    ),
    index("idx_calls_institution_id").using("btree", table.institutionId),
    index("idx_calls_product_id").using("btree", table.productId),
  ],
);

export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
