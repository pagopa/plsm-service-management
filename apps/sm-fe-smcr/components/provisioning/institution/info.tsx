"use client";

import {
  updateOverviewInstitutionAction,
  updatePnpgInstitutionAction,
} from "@/lib/actions/institution.action";
import { Institution, Product } from "@/lib/services/institution.service";
import { useInstitutionStore } from "@/lib/store/institution.store";
import { PRODUCT_MAP } from "@/lib/types/product";
import { cn } from "@/lib/utils";
import { apiOriginValues } from "@/features/onboarding/utils/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  ClipboardList,
  ClipboardType,
  Fingerprint,
  Landmark,
  LoaderCircleIcon,
  Locate,
  Mail,
  MapPin,
  Settings,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useActionState,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import ConfirmChanges from "./confirm-changes";
import InfoItem, { editableFieldValue } from "./info-item";
import { Badge } from "@/components/ui/badge";

type Props = {
  institutions: Array<Institution>;
  canEditInstitution: boolean;
  isPNPG?: boolean;
};

function resolveInstitution(
  institutions: Array<Institution>,
  institutionId: string | null,
) {
  if (institutionId) {
    const match = institutions.find((item) => item.id === institutionId);
    if (match) return match;
  }

  return institutions.at(0) ?? null;
}

function resolveProduct(
  institution: Institution | null,
  productId: string | null,
) {
  if (!institution) return null;

  if (productId) {
    const match = institution.onboarding.find(
      (item) => item.productId === productId,
    );
    if (match) return match;
  }

  return institution.onboarding.at(0) ?? null;
}

const editableFields: Array<{
  field: string;
  label: string;
  source?: "product";
}> = [
  {
    field: "description",
    label: "Ente",
  },
  {
    field: "zipCode",
    label: "ZIP",
  },
  {
    field: "digitalAddress",
    label: "PEC",
  },
  {
    field: "address",
    label: "Indirizzo",
  },
  {
    field: "origin",
    label: "Origin",
    source: "product",
  },
  {
    field: "originId",
    label: "Origin ID",
    source: "product",
  },
];

export default function InstitutionInfo({
  institutions,
  canEditInstitution,
  isPNPG = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [history, saveHistory] = useLocalStorage<{
    items: Array<{ id: string; name: string; taxCode: string }>;
  }>(`${isPNPG ? "institution-history-pnpg" : "institution-history"}`, {
    items: [],
  });

  const valuesFromStore = useInstitutionStore((state) => state.values);

  const institutionFromQuery = searchParams.get("institution");
  const productFromQuery = searchParams.get("product");
  const [currentInstitution, setCurrentInstitution] = useState(() =>
    resolveInstitution(institutions, institutionFromQuery),
  );
  const [currentProduct, setCurrentProduct] = useState(() =>
    resolveProduct(
      resolveInstitution(institutions, institutionFromQuery),
      productFromQuery,
    ),
  );
  const [confirmChangesDialogOpen, setConfigChangesDialogOpen] =
    useState(false);

  const [state, action] = useActionState(
    isPNPG ? updatePnpgInstitutionAction : updateOverviewInstitutionAction,
    {},
  );
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (canEditInstitution) {
      setConfigChangesDialogOpen(true);
    }
  }

  const createQueryString = useCallback(
    (items: Array<{ key: string; value: string }>) => {
      const params = new URLSearchParams(searchParams.toString());
      items.forEach((item) => {
        params.set(item.key, item.value);
      });

      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    if (currentInstitution) {
      saveHistory({
        items: [
          {
            id: currentInstitution.id,
            name:
              currentInstitution.description ?? currentInstitution.origin ?? "",
            taxCode: currentInstitution.taxCode,
          },
          ...history.items
            .slice(0, 4)
            .filter((item) => item.id !== currentInstitution.id),
        ],
      });
    }
  }, []);

  useEffect(() => {
    if (!currentInstitution?.id || !currentProduct?.productId) {
      return;
    }

    // Same-URL push refreshes the dynamic page in Next.js and retriggers this
    // effect, so skip the navigation when the query already matches.
    if (
      searchParams.get("institution") === currentInstitution.id &&
      searchParams.get("product") === currentProduct.productId
    ) {
      return;
    }

    const query = createQueryString([
      { key: "institution", value: currentInstitution.id },
      { key: "product", value: currentProduct.productId },
    ]);

    router.push(`${pathname}?${query}`);
  }, [
    pathname,
    router,
    createQueryString,
    currentInstitution,
    currentProduct,
    searchParams,
  ]);

  useEffect(() => {
    if (!state.errors) return;

    toast.error(state.errors.root ?? "Controlla i dati inseriti e riprova.");
  }, [state]);

  if (!institutions || institutions.length < 1) {
    return <div>Not found</div>;
  }

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex flex-row items-center gap-4">
        <InstitutionSelect
          institutions={institutions}
          currentInstitution={currentInstitution}
          setCurrentInstitution={setCurrentInstitution}
          onUpdateProduct={(product) => setCurrentProduct(product)}
        />

        <ProductSelect
          products={currentInstitution?.onboarding}
          currentProduct={currentProduct}
          setCurrentProduct={setCurrentProduct}
        />
        {currentProduct?.status === "DELETED" && (
          <Badge
            variant="destructive"
            className="col-span-5 px-2 py-1 text-white font-medium"
          >
            DELETED
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoItem
          name="selectedInstitutionId"
          label="ID ente"
          value={currentInstitution?.id || "-"}
          valueClassName="font-mono text-sm break-all"
          isCopyable={Boolean(currentInstitution?.id)}
          className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
        />
        <InfoItem
          name="selectedProductTokenId"
          label="ID prodotto"
          value={currentProduct?.tokenId || "-"}
          valueClassName="font-mono text-sm break-all"
          isCopyable={Boolean(currentProduct?.tokenId)}
          className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
        />
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 grid grid-cols-5 gap-4"
      >
        {canEditInstitution && <input type="submit" hidden />}
        <InfoItem
          name="description"
          label="Ente"
          value={currentInstitution?.description}
          className="col-span-2"
          isEditable={canEditInstitution}
          icon={<Landmark className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="zipCode"
          label="ZIP"
          value={currentInstitution?.zipCode}
          isEditable={canEditInstitution}
          icon={<ClipboardList className="size-4 mr-2 text-muted-foreground" />}
        />

        <InfoItem
          name="type"
          label="Tipo"
          value={
            currentInstitution?.onboarding.find(
              (onboard) => onboard.productId === currentProduct?.productId,
            )?.institutionType || ""
          }
          icon={<Settings className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="vatNumber"
          label="Codice fiscale"
          value={currentInstitution?.taxCode}
          icon={<ClipboardType className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="digitalAddress"
          label="PEC"
          value={currentInstitution?.digitalAddress}
          className="col-span-2"
          isEditable={canEditInstitution}
          icon={<Mail className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="address"
          label="Indirizzo"
          value={currentInstitution?.address}
          isEditable={canEditInstitution}
          icon={<MapPin className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="origin"
          label="Origin"
          value={currentProduct?.origin || ""}
          isEditable={canEditInstitution}
          options={apiOriginValues}
          icon={<Locate className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="originId"
          label="Origin ID"
          value={currentProduct?.originId || ""}
          isEditable={canEditInstitution}
          icon={<Fingerprint className="size-4 mr-2 text-muted-foreground" />}
        />
        {currentInstitution?.paymentServiceProvider && (
          <>
            <InfoItem
              name="legalRegisterName"
              label="Legal Register Name"
              className="col-span-2"
              value={
                currentInstitution?.paymentServiceProvider?.legalRegisterName
              }
            />
            <InfoItem
              name="abicode"
              label="ABI Code"
              value={currentInstitution?.paymentServiceProvider?.abiCode}
            />
            <InfoItem
              name="businessRegisterNumber"
              label="Business Register Number"
              value={
                currentInstitution?.paymentServiceProvider
                  ?.businessRegisterNumber
              }
            />
            <InfoItem
              name="legalRegisterNumber"
              label="Legal Register Number"
              value={
                currentInstitution?.paymentServiceProvider?.legalRegisterNumber
              }
            />

            <InfoItem
              name="vatNumberGroup"
              label="VAT Number Group"
              value={
                currentInstitution?.paymentServiceProvider?.vatNumberGroup
                  ? "true"
                  : "false"
              }
            />
          </>
        )}
        {currentInstitution?.onboarding.find(
          (onboard) => onboard.productId === currentProduct?.productId,
        )?.isAggregator && (
          <Badge
            variant="default"
            className="col-span-5 px-2 py-1 mt-2 bg-pagopa-primary text-white font-medium"
          >
            Ente Aggregatore
          </Badge>
        )}

        {canEditInstitution && (
          <ConfirmChanges
            open={confirmChangesDialogOpen}
            onOpenChange={setConfigChangesDialogOpen}
            isPending={isPending}
            onConfirm={(sendToQueue) => {
              const redirectUrl = isPNPG
                ? `/dashboard/pnpg/${currentInstitution?.taxCode}?institution=${currentInstitution?.id}&product=${currentProduct?.productId}`
                : `/dashboard/overview/${currentInstitution?.taxCode}?institution=${currentInstitution?.id}&product=${currentProduct?.productId}`;
              const formData = new FormData();
              formData.append("redirect", redirectUrl);
              formData.append("institutionId", currentInstitution?.id || "");
              formData.append(
                "address",
                editableFieldValue(valuesFromStore.address),
              );
              formData.append(
                "description",
                editableFieldValue(valuesFromStore.description),
              );
              formData.append(
                "digitalAddress",
                editableFieldValue(valuesFromStore.digitalAddress),
              );
              formData.append(
                "zipCode",
                editableFieldValue(valuesFromStore.zipCode),
              );
              formData.append("sendToQueue", String(sendToQueue));
              formData.append("onboarding", currentProduct?.tokenId || "");
              formData.append(
                "onboardings",
                JSON.stringify(
                  currentInstitution?.onboarding.map((item) => ({
                    productId: item.productId as string,
                    vatNumber: item.billing?.vatNumber as string,
                    origin:
                      item.productId === currentProduct?.productId
                        ? editableFieldValue(valuesFromStore.origin)
                        : (item.origin as string),
                    originId:
                      item.productId === currentProduct?.productId
                        ? editableFieldValue(valuesFromStore.originId)
                        : (item.originId as string),
                  })) || [],
                ),
              );

              startTransition(() => action(formData));
            }}
            changes={editableFields
              .map((item) => {
                const source =
                  item.source === "product"
                    ? currentProduct
                    : currentInstitution;
                const oldValue = editableFieldValue(
                  (source as unknown as Record<string, string> | null)?.[
                    item.field
                  ],
                );
                const newValue = editableFieldValue(
                  (valuesFromStore as unknown as Record<string, string>)[
                    item.field
                  ],
                );

                if (!oldValue && !newValue) {
                  return undefined;
                }

                if (oldValue !== newValue) {
                  return {
                    field: item.field,
                    label: item.label,
                    oldValue,
                    newValue,
                  };
                }
              })
              .filter((item) => !!item)}
          />
        )}
      </form>
    </section>
  );
}

function InstitutionSelect({
  institutions,
  currentInstitution,
  setCurrentInstitution,
  onUpdateProduct = () => {},
}: {
  institutions: Array<Institution>;
  currentInstitution: Institution | null;
  setCurrentInstitution: Dispatch<SetStateAction<Institution | null>>;
  onUpdateProduct: (product: Product) => void;
}) {
  return (
    <Select
      onValueChange={(value) => {
        const institution =
          institutions.find((institution) => institution.id === value) || null;
        if (institution) {
          setCurrentInstitution(institution);
          onUpdateProduct(institution.onboarding.at(0) as Product);
        }
      }}
    >
      <SelectTrigger className="shadow-none p-0 focus-visible:ring-0 bg-neutral-100 px-3 border border-neutral-200!">
        <p className="text-lg max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
          {currentInstitution?.description}
        </p>
      </SelectTrigger>

      <SelectContent>
        {institutions.map((institution) => (
          <SelectItem key={institution.id} value={institution.id}>
            <p className="max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
              {institution.description}
            </p>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProductSelect({
  products = [],
  currentProduct,
  setCurrentProduct,
  isPending = false,
}: {
  products?: Array<Product>;
  currentProduct: Product | null;
  setCurrentProduct: Dispatch<SetStateAction<Product | null>>;
  isPending?: boolean;
}) {
  return (
    <Select
      onValueChange={(value) => {
        setCurrentProduct(
          products.find(
            (product) =>
              product.productId === value.split(" ")[0] &&
              product.tokenId === value.split(" ")[1],
          ) || null,
        );
      }}
    >
      <SelectTrigger
        className={cn(
          "shadow-none p-0 focus-visible:ring-0 bg-neutral-100 px-2 border border-neutral-200! min-w-[170px]",
          isPending && "[&>svg:nth-of-type(2)]:hidden",
        )}
        disabled={isPending}
      >
        <p className="text-base">
          {currentProduct?.productId
            ? PRODUCT_MAP[currentProduct?.productId] ||
              currentProduct?.productId
            : currentProduct?.productId}
        </p>

        {isPending && (
          <LoaderCircleIcon className="size-3.5 opacity-60 animate-spin" />
        )}
      </SelectTrigger>

      <SelectContent align="center">
        {products.map((product) => (
          <SelectItem
            key={`${product.productId} ${product.tokenId}`}
            value={`${product.productId} ${product.tokenId}`}
          >
            {PRODUCT_MAP[product.productId] || product.productId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
