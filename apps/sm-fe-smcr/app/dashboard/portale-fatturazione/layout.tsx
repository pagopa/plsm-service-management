import { PermissionGate } from "@/components/auth/permission-gate";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <PermissionGate permission="portale.fatturazione.read" returnUrl="/dashboard/portale-fatturazione">
      {children}
    </PermissionGate>
  );
}
