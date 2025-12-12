import { Badge } from "@/components/ui/badge";

type Status = "pending" | "blocked" | "completed";
type Props = {
  status: Status;
};
export default function Status({ status }: Props) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 border-amber-600/60 shadow-none rounded-full">
          PENDING
        </Badge>
      );
    case "blocked":
      return (
        <Badge className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 border-red-600/60 shadow-none rounded-full">
          BLOCCATO
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-pagopa-primary border-pagopa-primary-600/60 shadow-none rounded-full">
          COMPLETATO
        </Badge>
      );

    default:
      throw new Error(`Invalid status ${status satisfies never}`);
  }
}
