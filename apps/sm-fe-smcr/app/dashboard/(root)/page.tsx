export const dynamic = "force-dynamic";

import dayjs from "dayjs";

import TextAnalytics from "@/components/dashboard/text-analytics";
import { getOnboardingByProduct } from "@/lib/services/product.service";
import { ChartPie } from "@/components/dashboard/chart";
import { format } from "date-fns";

const PRODUCT_CARDS = [
  { label: "IO", productId: "prod-io", color: "#3b82f6" },
  { label: "Interop", productId: "prod-interop", color: "#22c55e" },
  { label: "Send", productId: "prod-pn", color: "#f59e0b" },
  { label: "PagoPA", productId: "prod-pagopa", color: "#ef4444" },
  { label: "Firma con IO", productId: "prod-io-sign", color: "#8b5cf6" },
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
      <h1 className="text-2xl font-bold">Dashboard Onboarding</h1>
      <section className="grid grid-cols-5 gap-4">
        {analytics.map((card) => (
          <TextAnalytics
            key={card.productId}
            label={card.label}
            currentCount={card.currentCount}
            previousCount={card.previousCount}
            bgColor={card.color}
          />
        ))}
      </section>

      <section className="w-full">
        <ChartPie
          period={`${format(dateRanges.current.from, "MMMM")} - ${format(dateRanges.current.to, "MMMM")}`}
          chartData={analytics.map((analytic) => ({
            product: analytic.label,
            count: analytic.currentCount,
            fill:
              PRODUCT_CARDS.find((c) => c.label === analytic.label)?.color ||
              "gray",
          }))}
          chartConfig={analytics.reduce(
            (acc, analytic) => {
              acc[analytic.label as string] = {
                label: analytic.label as string,
                color: "var(--color-primary)",
              };
              return acc;
            },
            {} as Record<string, { label: string; color: string }>,
          )}
        />
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
