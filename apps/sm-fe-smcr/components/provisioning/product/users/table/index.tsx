"use client";

import { User } from "@/lib/services/users.service";
import { getProvisioningUsersColumns } from "./columns";
import { UsersTable } from "./table";

export function Users({
  data,
  institutionId,
  product,
  isPNPG = false,
}: {
  data: Array<User>;
  institutionId: string;
  product: string;
  isPNPG?: boolean;
}) {
  return (
    <UsersTable
      columns={
        getProvisioningUsersColumns(institutionId, product, isPNPG) as any
      }
      data={data!}
    />
  );
}
