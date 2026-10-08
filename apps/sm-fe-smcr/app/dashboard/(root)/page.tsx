export const dynamic = "force-dynamic";

import { format, parseISO, subDays } from "date-fns";
import { it } from "date-fns/locale";

import { ChartPie } from "@/components/dashboard/chart";
import TextAnalytics from "@/components/dashboard/text-analytics";
import { getOnboardingProducts } from "@/lib/services/product.service";
import { PRODUCT_CARDS } from "@/lib/constants/dashboard-products";

export default async function DashboardPage() {
  const dateRanges = buildDateRanges();
  const analytics = [];
  const products = await getOnboardingProducts();

  if (products.error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        Errore: {products.error}
      </div>
    );
  }

  for (const card of PRODUCT_CARDS) {
    const product = products.data?.find((p) => p.product === card.productId);
    analytics.push({
      ...card,
      currentCount: product?.count_current_month ?? 0,
      previousCount: product?.count_previous_month ?? 0,
      variationPercentage: product?.variazione_percentuale ?? 0,
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
            variationPercentage={card.variationPercentage}
          />
        ))}
      </section>

      <section className="w-full">
        <ChartPie
          period={`${format(parseISO(dateRanges.current.from), "MMMM", { locale: it })} - ${format(parseISO(dateRanges.current.to), "MMMM", { locale: it })}`}
          chartData={(() => {
            const total =
              analytics.reduce(
                (sum, analytic) => sum + analytic.currentCount,
                0,
              ) || 1;
            return analytics.map((analytic) => ({
              product: analytic.label,
              count: Number(((analytic.currentCount / total) * 100).toFixed(2)), // percentage
              fill:
                PRODUCT_CARDS.find((c) => c.label === analytic.label)?.color ||
                "gray",
            }));
          })()}
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
  const now = new Date();
  return {
    current: {
      from: format(subDays(now, 30), "yyyy-MM-dd"),
      to: format(now, "yyyy-MM-dd"),
    },
    previous: {
      from: format(subDays(now, 60), "yyyy-MM-dd"),
      to: format(subDays(now, 30), "yyyy-MM-dd"),
    },
  };
}
