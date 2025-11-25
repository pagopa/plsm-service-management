"use client";

import { Institution } from "@/lib/services/institution.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export const PRODUCT_MAP: Record<string, string> = {
  "prod-fd": "prod-fd",
  "prod-interop": "Interoperabilità",
  "prod-interop-atst": "Interoperabilità Attestazione",
  "prod-interop-coll": "Interoperabilità Collaudo",
  "prod-io": "IO",
  "prod-io-premium": "IO Premium",
  "prod-io-sign": "Firma con IO",
  "prod-pagopa": "Piattaforma pagoPA",
  "prod-pn": "SEND",
  "prod-fd-garantito": "Fidejussioni ditali G",
} as const;

type Props = {
  institutions: { data: Array<Institution>; error: string | null };
};

export default function InstitutionInfo({
  institutions: { data, error },
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeInstitution, setActiveInstitution] = useState(data.at(0));

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="w-full p-4 flex flex-col gap-2">
      <Select
        value={activeInstitution?.id || ""}
        onValueChange={(value) => {
          setActiveInstitution(data.find((current) => current.id === value));
        }}
      >
        <SelectTrigger className="w-56 inline-flex items-center">
          <SelectValue placeholder="Select an institution" />
        </SelectTrigger>

        <SelectContent>
          {data.map((item: any) => (
            <SelectItem key={item.id} value={item.id}>
              {item.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <InstitutionName institution={activeInstitution} />

      <div className="w-full grid grid-cols-4 gap-x-8 gap-y-2 items-center">
        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Codice fiscale
          </label>

          <p className="text-sm">
            {activeInstitution?.taxCode || "Non presente"}
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Type
          </label>

          <p className="text-sm">
            {activeInstitution?.institutionType || "Non presente"}
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">
            ID
          </label>

          <p className="text-sm">{activeInstitution?.id || "Non presente"}</p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">
            PEC
          </label>

          <p className="text-sm">
            {activeInstitution?.digitalAddress || "Non presente"}
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Address
          </label>

          <p className="text-sm">
            {activeInstitution?.address || "Non presente"}
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">
            ZIP
          </label>

          <p className="text-sm">
            {activeInstitution?.zipCode || "Non presente"}
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Origin
          </label>

          <p className="text-sm">
            {activeInstitution?.origin || "Non presente"}
          </p>
        </div>

        <div>
          <Select
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("product", value);
              router.push(`?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Prodotto" />
            </SelectTrigger>
            <SelectContent>
              {data.at(0) &&
                data.at(0)?.onboarding.map((product: any) => (
                  <SelectItem key={product.productId} value={product.productId}>
                    {PRODUCT_MAP[product.productId] || product.productId}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

function InstitutionName({ institution }: { institution: any }) {
  return (
    <h1 className="font-medium text-lg">
      {institution.description}
      {institution.rootParent && (
        <span>&nbsp;-&nbsp;{institution.rootParent?.description}</span>
      )}
    </h1>
  );
}
