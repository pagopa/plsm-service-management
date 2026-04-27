"use client";

import {
  updateUserAction,
  updateUserEmailAction,
} from "@/lib/actions/users.actions";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CircleAlertIcon,
  CopyIcon,
  LoaderCircleIcon,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import UserDialog from "../user-dialog";

export type User = {
  id: string;
  role: "SUB_DELEGATE" | "DELEGATE" | "OPERATOR" | "MANAGER";
  email: string;
  name?: string;
  surname?: string;
  roles: ("admin" | "operator")[];
};

export const getProvisioningUsersColumns: (
  institutionId: string,
  product: string,
  isPNPG?: boolean,
) => ColumnDef<User>[] = (institutionId, product, isPNPG) => [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return (
        <div className="inline-flex items-center gap-2 group">
          <UserDialog institutionId={institutionId} userId={row.original.id}>
            {row.original.email}
          </UserDialog>

          <CopyIcon
            onClick={() => {
              navigator.clipboard.writeText(row.original.email);
              toast.success("Copied!", {
                description: `${row.original.email} copied to your clipboard.`,
              });
            }}
            className="size-3.5 opacity-0 group-hover:opacity-60 transition-opacity cursor-pointer"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "surname",
    header: "Cognome",
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <ArrowUpDown className="size-3.5 opacity-60" />
          Role
        </Button>
      );
    },

    cell({ row }) {
      return <Badge variant="secondary">{row.getValue("role")}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      if (isPNPG) {
        return null;
      }
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Azioni</DropdownMenuLabel>
            <DropdownMenuEmailForm
              email={user.email}
              userId={user.id}
              name={user.name}
              surname={user.surname}
            />

            <DropdownMenuItemForm
              status="SUSPENDED"
              userId={user.id}
              institutionId={institutionId}
              product={product}
            >
              Sospendi
            </DropdownMenuItemForm>

            <DropdownMenuItemForm
              status="DELETED"
              userId={user.id}
              institutionId={institutionId}
              product={product}
            >
              Elimina
            </DropdownMenuItemForm>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function DropdownMenuEmailForm({
  email,
  userId,
  name,
  surname,
}: {
  email: string;
  userId: string;
  name?: string;
  surname?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full items-start justify-start text-start"
        >
          Modifica email
        </Button>
      </DialogTrigger>

      {open ? (
        <EditEmailDialogContent
          email={email}
          userId={userId}
          name={name}
          surname={surname}
          onSuccess={() => setOpen(false)}
        />
      ) : null}
    </Dialog>
  );
}

function EditEmailDialogContent({
  email,
  userId,
  name,
  surname,
  onSuccess,
}: {
  email: string;
  userId: string;
  name?: string;
  surname?: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const id = useId();
  const [nextEmail, setNextEmail] = useState(email);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [state, action, isPending] = useActionState(updateUserEmailAction, {
    fields: {
      email,
      name: name ?? "",
      surname: surname ?? "",
      userId,
    },
    success: false,
  });

  const missingRegistryData = !name?.trim() || !surname?.trim();
  const normalizedCurrentEmail = email.trim().toLowerCase();
  const normalizedNextEmail = nextEmail.trim().toLowerCase();
  const canSubmit =
    !missingRegistryData &&
    !isPending &&
    nextEmail.trim().length > 0 &&
    normalizedCurrentEmail !== normalizedNextEmail;

  useEffect(() => {
    if (!hasSubmitted || isPending) {
      return;
    }

    if (state.errors?.root) {
      toast.error("Aggiornamento email non riuscito", {
        description: state.errors.root,
      });
      return;
    }

    if (state.success) {
      toast.success("Email aggiornata", {
        description: "La mail dell'utente e' stata aggiornata con successo.",
      });
      onSuccess();
      router.refresh();
    }
  }, [
    hasSubmitted,
    isPending,
    onSuccess,
    router,
    state.errors?.root,
    state.success,
  ]);

  return (
    <DialogContent
      className="w-sm"
      onEscapeKeyDown={(event) => {
        if (isPending) {
          event.preventDefault();
        }
      }}
      onInteractOutside={(event) => {
        if (isPending) {
          event.preventDefault();
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>Modifica email</DialogTitle>
        <DialogDescription>
          Aggiorna la mail dell&apos;utente nel registro anagrafico.
        </DialogDescription>
      </DialogHeader>

      <form action={action} onSubmit={() => setHasSubmitted(true)} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Email attuale</span>
            <p className="break-all text-sm">{email}</p>
          </div>

          {missingRegistryData ? (
            <p className="text-xs text-destructive">
              Impossibile aggiornare l&apos;email: nome o cognome dell&apos;utente
              mancanti nella riga selezionata.
            </p>
          ) : null}

          <div className="*:not-first:mt-2">
            <Label htmlFor={id}>Nuova email</Label>
            <Input
              id={id}
              name="email"
              type="email"
              value={nextEmail}
              autoFocus
              placeholder="mario@pagopa.it"
              onChange={(event) => {
                if (hasSubmitted) {
                  setHasSubmitted(false);
                }

                setNextEmail(event.target.value);
              }}
              disabled={isPending || missingRegistryData}
            />

            {hasSubmitted && state.errors?.email ? (
              <p className="text-xs text-destructive">{state.errors.email}</p>
            ) : null}
          </div>

          {hasSubmitted && state.errors?.root ? (
            <p className="text-xs text-destructive">{state.errors.root}</p>
          ) : null}
        </div>

        <input type="hidden" name="name" value={name ?? ""} />
        <input type="hidden" name="surname" value={surname ?? ""} />
        <input type="hidden" name="userId" value={userId} />

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
          </DialogClose>

          <Button type="submit" className="flex-1" disabled={!canSubmit}>
            {isPending ? (
              <LoaderCircleIcon className="size-3.5 animate-spin" />
            ) : (
              "Salva"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DropdownMenuItemForm({
  status,
  userId,
  institutionId,
  product,
  children,
}: {
  status: "SUSPENDED" | "DELETED";
  userId: string;
  institutionId: string;
  product: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const [inputValue, setInputValue] = useState("");
  const [state, action, isPending] = useActionState(updateUserAction, {
    fields: {
      institutionId,
      product,
      userId,
      status,
    },
  });

  useEffect(() => {
    if (!isPending && state.errors?.root) {
      toast.error("Unexpected error!", { description: state.errors.root });
    }
  }, [isPending, state]);

  useEffect(() => {
    if (!isPending && state.errors?.root) {
      toast.error("Unexpected error!", { description: state.errors.root });
    }
  }, [isPending, state]);

  return (
    <Dialog>
      <DialogTrigger asChild className="flex flex-col">
        <Button
          variant="ghost"
          size="sm"
          className="items-start text-start w-full"
        >
          {children}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-sm">
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <CircleAlertIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              Conferma finale
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              Questa azione non puo&apos; essere annullata. Per confermare,
              digita <span className="text-foreground">CONFIRM</span> nel
              campo sottostante e fai clic su{" "}
              <span className="text-foreground">
                {status === "SUSPENDED" ? "Sospendi" : "Elimina"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
        </div>

        <form action={action} className="space-y-5">
          <div className="*:not-first:mt-2">
            <Label htmlFor={id}>Verifica</Label>
            <Input
              id={id}
              type="text"
              placeholder="Digita CONFIRM per continuare"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="institutionId" value={institutionId} />
          <input type="hidden" name="product" value={product} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Annulla
              </Button>
            </DialogClose>

            <Button
              type="submit"
              className="flex-1"
              disabled={inputValue !== "CONFIRM" || isPending}
            >
              {isPending ? (
                <LoaderCircleIcon className="size-3.5 animate-spin" />
              ) : status === "SUSPENDED" ? (
                "Sospendi"
              ) : (
                "Elimina"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
