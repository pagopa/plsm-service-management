import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { AnalyticsCard } from "./analytics-card";

type Props = {
  label: string;
  currentCount: number;
  previousCount: number;
  bgColor?: string;
  variationPercentage: number;
};

export default function TextAnalytics({
  label,
  currentCount,
  previousCount,
  bgColor,
  variationPercentage,
}: Props) {
  return (
    <AnalyticsCard label={label} bgColor={bgColor}>
      <div className="flex flex-col gap-4">
        <div className="inline-flex w-full items-center justify-between">
          <p className="font-medium text-3xl">{currentCount}</p>
          <VariationBadge variationPercentage={variationPercentage} />
        </div>
        <p className="text-sm text-muted-foreground">
          Last month: {previousCount}
        </p>
      </div>
    </AnalyticsCard>
  );
}

function VariationBadge({
  variationPercentage,
}: {
  variationPercentage: number;
}) {
  const value = `${variationPercentage.toFixed(2)}`;

  if (variationPercentage < 0) {
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
