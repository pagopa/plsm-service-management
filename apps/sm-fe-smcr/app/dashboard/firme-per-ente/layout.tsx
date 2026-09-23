import { PermissionGate } from "@/components/auth/permission-gate";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <PermissionGate permission="firma.ente.read" returnUrl="/dashboard/firme-per-ente">
      {children}
    </PermissionGate>
  );
}
