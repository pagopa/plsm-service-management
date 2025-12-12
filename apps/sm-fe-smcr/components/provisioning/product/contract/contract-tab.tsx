import { getUserGroups } from "@/lib/services/institution.service";
import { verifyContract } from "@/lib/services/product.service";
import { PRODUCT_MAP } from "@/lib/types/product";
import { Badge } from "@/components/ui/badge";
import { BadgeCheckIcon } from "lucide-react";
import DownloadConctract from "./download-contract";
import SendToQueue from "./send-to-queue";

type Props = {
  institution: string;
  product: string;
  onboarding: string;
  institutionDescription: string;
};

export default async function ContractTab({
  institution,
  product,
  onboarding,
  institutionDescription,
}: Props) {
  const groups = await getUserGroups({ institution });
  const hasContract = await verifyContract(onboarding);

  if (groups.error || !groups.data) {
    console.error(groups);
    throw new Error(groups.error || "Errore imprevisto");
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <section className="w-full inline-flex justify-between items-center">
        <div className="inline-flex items-center gap-2">
          <p>{PRODUCT_MAP[product]}</p>

          {hasContract && (
            <Badge
              variant="secondary"
              className="bg-green-50 text-green-500 border border-green-100!"
            >
              <BadgeCheckIcon className="size-3" />
              Firmato in cades
            </Badge>
          )}
        </div>

        <div className="inline-flex items-center gap-4">
          <DownloadConctract
            filename={`${institutionDescription} - ${PRODUCT_MAP[product]}`}
          />
          <SendToQueue onboarding={onboarding} />
        </div>
      </section>
    </div>
  );
}
