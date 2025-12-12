"use client";

import { updateUserAction } from "@/lib/actions/users.actions";
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
import { useActionState, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import UserDialog from "../user-dialog";

export type User = {
  id: string;
  role: "SUB_DELEGATE" | "DELEGATE" | "OPERATOR" | "MANAGER";
  email: string;
  name: string;
  surname: string;
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItemForm
              status="SUSPENDED"
              userId={user.id}
              institutionId={institutionId}
              product={product}
            >
              Suspend
            </DropdownMenuItemForm>

            <DropdownMenuItemForm
              status="DELETED"
              userId={user.id}
              institutionId={institutionId}
              product={product}
            >
              Delete
            </DropdownMenuItemForm>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

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
              Final confirmation
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              This action cannot be undone. To confirm, please type{" "}
              <span className="text-foreground">CONFIRM</span> in the field
              below and click{" "}
              <span className="text-foreground">
                {status === "SUSPENDED" ? "Suspend" : "Delete"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
        </div>

        <form action={action} className="space-y-5">
          <div className="*:not-first:mt-2">
            <Label htmlFor={id}>Verification</Label>
            <Input
              id={id}
              type="text"
              placeholder="Type CONFIRM to continue"
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
                Cancel
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
                "Suspend"
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
