"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";

interface FieldChange {
  field: string;
  label: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
}

interface EditConfirmationDialogProps {
  open: boolean;
  sendToQueue?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sendToQueue: boolean) => void;
  changes: FieldChange[];
  title?: string;
  description?: string;
  isPending?: boolean;
}

export default function ConfirmChanges({
  open,
  onOpenChange,
  onConfirm,
  changes,
  title = "Conferma modifiche",
  description = "Stai per salvare le seguenti modifiche. Vuoi continuare?",
  isPending = false,
}: EditConfirmationDialogProps) {
  const [isSendingToQueue, setIsSendingToQueue] = useState(false);
  const formatValue = (value: string | number | boolean): string => {
    if (typeof value === "boolean") {
      return value ? "Sì" : "No";
    }
    if (value === "" || value === null || value === undefined) {
      return "(vuoto)";
    }
    return String(value);
  };

  const hasChanges = changes.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {title}
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                {changes.length}{" "}
                {changes.length === 1 ? "modifica" : "modifiche"}
              </Badge>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {hasChanges && (
          <ScrollArea className="max-h-96 w-full">
            <div className="space-y-4">
              {changes.map((change, index) => (
                <div key={index} className="border rounded-lg p-4 bg-muted/30">
                  <div className="font-medium text-sm text-foreground mb-3">
                    {change.label}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Valore precedente
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                        <span className="text-sm text-red-700 dark:text-red-300 font-mono">
                          {formatValue(change.oldValue)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Nuovo valore
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                        <span className="text-sm text-green-700 dark:text-green-300 font-mono">
                          {formatValue(change.newValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {!hasChanges && (
          <div className="py-8 text-center text-muted-foreground">
            <p>Nessuna modifica rilevata</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button size="sm" variant="outline">
              Annulla
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="sm"
              onClick={(event) => {
                event.preventDefault();
                setIsSendingToQueue(false);
                onConfirm(false);
              }}
              type="button"
              disabled={!hasChanges || isPending}
            >
              {isPending && !isSendingToQueue ? (
                <LoaderCircleIcon className="size-3.5 animate-spin opacity-60" />
              ) : (
                "Conferma"
              )}
            </Button>
          </AlertDialogAction>

          <AlertDialogAction asChild>
            <Button
              size="sm"
              onClick={(event) => {
                event.preventDefault();
                setIsSendingToQueue(true);
                onConfirm(true);
              }}
              type="button"
              variant="pagopaprimary"
              disabled={!hasChanges || isPending}
            >
              {isPending && isSendingToQueue ? (
                <LoaderCircleIcon className="size-3.5 animate-spin opacity-60" />
              ) : (
                "Conferma ed invia in coda"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
