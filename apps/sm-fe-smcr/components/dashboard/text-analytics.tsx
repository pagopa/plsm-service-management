import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { AnalyticsCard } from "./analytics-card";

type Props = {
  label: string;
  currentCount: number;
  previousCount: number;
  bgColor?: string;
  variationPercentage: number;
  href?: string;
};

export default function TextAnalytics({ href, label, ...props }: Props) {
  if (!href) return <TextAnalyticsCard label={label} {...props} />;

  return (
    <Link
      href={href}
      aria-label={`Vedi enti onboardati ${label}`}
      className="group rounded-xl focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
    >
      <TextAnalyticsCard
        label={label}
        {...props}
        className="h-full transition-shadow group-hover:shadow-md group-hover:border-primary/40"
      />
    </Link>
  );
}

function TextAnalyticsCard({
  label,
  currentCount,
  previousCount,
  bgColor,
  variationPercentage,
  className,
}: Omit<Props, "href"> & { className?: string }) {
  return (
    <AnalyticsCard label={label} bgColor={bgColor} className={className}>
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
