import { PermissionGate } from "@/components/auth/permission-gate";
import { PermissionDenied } from "@/components/auth/permission-denied";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <PermissionGate
      denied={<PermissionDenied feature="Overview" />}
      permission="overview.read"
      returnUrl="/dashboard/overview"
    >
      {children}
    </PermissionGate>
  );
}
