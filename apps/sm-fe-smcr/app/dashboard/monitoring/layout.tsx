import { PermissionGate } from "@/components/auth/permission-gate";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <PermissionGate
      permission="call.management.read"
      returnUrl="/dashboard/monitoring/calls"
    >
      {children}
    </PermissionGate>
  );
}
