import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { AnalyticsCard } from "./analytics-card";

type Props = {
  label: string;
  currentCount: number;
  previousCount: number;
  bgColor?: string;
  variation: number;
};

export default function TextAnalytics({
  label,
  currentCount,
  previousCount,
  bgColor,
  variation,
}: Props) {
  return (
    <AnalyticsCard label={label} bgColor={bgColor}>
      <div className="flex flex-col gap-4">
        <div className="inline-flex w-full items-center justify-between">
          <p className="font-medium text-3xl">{currentCount}</p>
          <VariationBadge variation={variation} />
        </div>
        <p className="text-sm text-muted-foreground">
          Last month: {previousCount}
        </p>
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
