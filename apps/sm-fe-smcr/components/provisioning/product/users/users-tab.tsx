import { TabWrapper } from "@/components/layout/tab-wrapper";
import {
  getUsersByInstitutionId,
  getUsersPNPGByInstitutionId,
} from "@/lib/services/users.service";
import { PRODUCT_MAP } from "@/lib/types/product";
import AddUserDialog from "../../add-user/dialog";
import { Users } from "./table";

type Props = {
  taxCode: string;
  institution: string;
  product: string;
  isPNPG?: boolean;
};

export default async function UsersTab({
  institution,
  product,
  isPNPG = false,
}: Props) {
  const data = isPNPG
    ? await getUsersPNPGByInstitutionId(institution)
    : await getUsersByInstitutionId(institution, product);

  return (
    <TabWrapper>
      <div className="inline-flex items-center justify-between">
        <p className="font-medium text-lg">
          Utenti per il prodotto {PRODUCT_MAP[product]}
        </p>

        <AddUserDialog
          institution={institution}
          product={product}
          isPNPG={isPNPG}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Users
          data={data!}
          institutionId={institution}
          product={product}
          isPNPG={isPNPG}
        />
      </div>
    </TabWrapper>
  );
}
