import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { AnalyticsCard } from "./analytics-card";

type Props = {
  label: string;
  currentCount: number;
  previousCount: number;
};

export default function TextAnalytics({
  label,
  currentCount,
  previousCount,
}: Props) {
  return (
    <AnalyticsCard label={label}>
      <div className="inline-flex w-full items-center justify-between">
        <p className="font-medium text-3xl">{currentCount}</p>
        <VariationBadge variation={getVariation(previousCount, currentCount)} />
      </div>
    </AnalyticsCard>
  );
}

function VariationBadge({ variation }: { variation: number }) {
  const value = `${variation.toFixed(2)}`;

  if (variation < 0) {
    return (
      <Badge variant="outline-destructive">
        <TrendingDownIcon /> {value}
      </Badge>
    );
  }

  return (
    <Badge variant="outline-success">
      <TrendingUpIcon /> {value}
    </Badge>
  );
}

function getVariation(prev: number, current: number) {
  if (prev === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((prev - current) / prev) * 100;
}
