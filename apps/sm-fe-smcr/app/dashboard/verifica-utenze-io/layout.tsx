import { PermissionGate } from "@/components/auth/permission-gate";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <PermissionGate permission="utenze.io.read" returnUrl="/dashboard/verifica-utenze-io">
      {children}
    </PermissionGate>
  );
}
