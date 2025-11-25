"use client";

import { createUserAction } from "@/lib/actions/users.actions";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { PlusIcon, LoaderCircleIcon } from "lucide-react";
import React, { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

const PRODUCT_ROLES = [
  { label: "Admin", value: "admin", roleLabel: "Amministratore" },
  { label: "Operator", value: "operator", roleLabel: "Operatore" },
] as const;

const ROLES = {
  admin: [
    {
      label: "Delegate",
      value: "DELEGATE",
    },
    {
      label: "Sub Delegate",
      value: "SUB_DELEGATE",
    },
  ],
  operator: [
    {
      label: "Operator",
      value: "OPERATOR",
    },
  ],
} as const;

type Props = {
  institution: string;
  product: string;
  isPNPG?: boolean;
};

export default function CreateUserForm({
  institution,
  product,
  isPNPG = false,
}: Props) {
  const [productRole, setProductRole] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [state, action, isPending] = useActionState(createUserAction, {
    fields: {
      institution,
      product,
      firstName: "",
      lastName: "",
      email: "",
      taxCode: "",
      productRole: "",
      role: "",
      roleLabel: "",
      isPNPG,
    },
  });

  useEffect(() => {
    if (state.fields.taxCode) {
      if (state.errors) {
        if (state.errors.root) {
          toast.error(
            state.errors.root || "An error occured, please try again later.",
          );
        }
      } else {
        toast.success(
          `${state.fields.firstName} ${state.fields.lastName} has been added successfully!`,
        );
      }
    }
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input
        name="institution"
        value={state.fields.institution || institution}
        type="hidden"
      />
      <input
        name="product"
        value={state.fields.product || product}
        type="hidden"
      />
      <input name="isPNPG" value={isPNPG.toString()} type="hidden" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Mario"
            defaultValue={(state?.fields.firstName as string) || ""}
          />

          {state?.errors?.firstName ? (
            <Label className="text-destructive">
              {state.errors?.firstName}
            </Label>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Cognome</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Rossi"
            defaultValue={(state?.fields.lastName as string) || ""}
          />

          {state?.errors?.lastName ? (
            <Label className="text-destructive">{state.errors?.lastName}</Label>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="mario@pagopa.it"
          defaultValue={(state?.fields.email as string) || ""}
        />

        {state?.errors?.email ? (
          <Label className="text-destructive">{state.errors?.email}</Label>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxCode">Codice Fiscale</Label>
        <Input
          id="taxCode"
          name="taxCode"
          placeholder="Codice Fiscale"
          defaultValue={(state?.fields.taxCode as string) || ""}
        />

        {state?.errors?.taxCode ? (
          <Label className="text-destructive">{state.errors?.taxCode}</Label>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="productRole">Product Role</Label>

        <Select
          name="productRole"
          value={productRole?.value}
          onValueChange={(value) => {
            setProductRole(
              PRODUCT_ROLES.find((role) => role.value === value) || null,
            );
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>

          <SelectContent>
            {PRODUCT_ROLES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {state?.errors?.productRole ? (
          <Label className="text-destructive">
            {state.errors?.productRole}
          </Label>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>

          <Select name="role" disabled={!productRole}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>

            <SelectContent>
              {productRole &&
                ROLES[productRole.value as "admin" | "operator"].map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {state?.errors?.role ? (
            <Label className="text-destructive">{state.errors?.role}</Label>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleLabel">Role Label</Label>

          <Input
            id="roleLabel"
            name="roleLabel"
            placeholder="Role Label"
            defaultValue={
              PRODUCT_ROLES.find((item) => item.value === productRole?.value)
                ?.roleLabel ||
              (state?.fields.roleLabel as string) ||
              ""
            }
          />

          {state?.errors?.roleLabel ? (
            <Label className="text-destructive">
              {state.errors?.roleLabel}
            </Label>
          ) : null}
        </div>
      </div>

      <div className="w-full inline-flex items-center justify-end">
        <Button
          variant="pagopaprimary"
          size="sm"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircleIcon
              className="animate-spin size-3.5 -ms-1 opacity-60"
              aria-hidden="true"
            />
          ) : (
            <PlusIcon
              className="size-3.5 -ms-1 opacity-60"
              aria-hidden="true"
            />
          )}
          Salva
        </Button>
      </div>
    </form>
  );
}
