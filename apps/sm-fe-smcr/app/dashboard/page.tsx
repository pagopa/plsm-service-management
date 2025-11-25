export const dynamic = "force-dynamic";

import dayjs from "dayjs";

import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { AnalyticsChart } from "@/components/dashboard/chart";
import TextAnalytics from "@/components/dashboard/text-analytics";
import { getOnboardingByProduct } from "@/lib/services/product.service";

const PRODUCT_CARDS = [
  { label: "IO", productId: "prod-io" },
  { label: "Interop", productId: "prod-interop" },
  { label: "Send", productId: "prod-pn" },
  { label: "PagoPA", productId: "prod-pagopa" },
  { label: "Firma con IO", productId: "prod-io-sign" },
] as const;

export default async function DashboardPage() {
  const dateRanges = buildDateRanges();
  const analytics = [];

  for (const card of PRODUCT_CARDS) {
    const current = await getOnboardingByProduct(
      card.productId,
      dateRanges.current.from,
      dateRanges.current.to,
    );
    const previous = await getOnboardingByProduct(
      card.productId,
      dateRanges.previous.from,
      dateRanges.previous.to,
    );

    analytics.push({
      ...card,
      currentCount: extractCount(current),
      previousCount: extractCount(previous),
    });
  }

  return (
    <main className="h-full w-full p-4 flex flex-col gap-4">
      <section className="grid grid-cols-5 gap-4">
        {analytics.map((card) => (
          <TextAnalytics
            key={card.productId}
            label={card.label}
            currentCount={card.currentCount}
            previousCount={card.previousCount}
          />
        ))}
      </section>

      <section className="w-full">
        <AnalyticsCard label="Ricerche">
          <AnalyticsChart />
        </AnalyticsCard>
      </section>
    </main>
  );
}

function buildDateRanges() {
  const now = dayjs(Date.now());
  return {
    current: {
      from: now.subtract(30, "days").format("YYYY-MM-DD"),
      to: now.format("YYYY-MM-DD"),
    },
    previous: {
      from: now.subtract(60, "days").format("YYYY-MM-DD"),
      to: now.subtract(30, "days").format("YYYY-MM-DD"),
    },
  };
}

function extractCount(
  result: Awaited<ReturnType<typeof getOnboardingByProduct>>,
) {
  return result.data?.notificationCount ?? 0;
}
