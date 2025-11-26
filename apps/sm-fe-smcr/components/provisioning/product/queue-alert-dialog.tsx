import { CircleAlertIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  isPending: boolean;
  formRef: React.RefObject<HTMLFormElement | null>;
};

export default function QueueAlertDialog({ isPending, formRef }: Props) {
  const handleClick = () => {
    formRef?.current?.requestSubmit();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Invia alla coda</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <CircleAlertIcon className="opacity-80" size={16} />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Invio</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler inviare il messaggio in coda?
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              onClick={handleClick}
            >
              {isPending ? <Spinner /> : "Conferma"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
