import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { hasCurrentPermission } from "@/lib/auth/dashboard-access";
import { requireServerSession } from "@/lib/auth/server";

type PermissionGateProps = {
  children: ReactNode;
  denied?: ReactNode;
  permission: string;
  returnUrl: string;
};

export async function PermissionGate({
  children,
  denied,
  permission,
  returnUrl,
}: PermissionGateProps) {
  await requireServerSession(returnUrl);

  if (!(await hasCurrentPermission(permission))) {
    if (denied) {
      return denied;
    }

    redirect("/dashboard");
  }

  return children;
}
