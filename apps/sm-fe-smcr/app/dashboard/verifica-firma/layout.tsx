import { PermissionGate } from "@/components/auth/permission-gate";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <PermissionGate permission="firma.verifica.read" returnUrl="/dashboard/verifica-firma">
      {children}
    </PermissionGate>
  );
}
