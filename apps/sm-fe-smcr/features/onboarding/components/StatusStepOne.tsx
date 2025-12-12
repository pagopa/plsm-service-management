import { Badge } from "@/components/ui/badge";

type Props = {
  status: string;
};
export default function StatusStepOne({ status }: Props) {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 border-amber-600/60 shadow-none rounded-full">
          {status}
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-pagopa-primary border-pagopa-primary-600/60 shadow-none rounded-full">
          COMPLETATO
        </Badge>
      );

    default:
      return (
        <Badge className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 border-red-600/60 shadow-none rounded-full">
          {status}
        </Badge>
      );
  }
}
