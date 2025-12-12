"use client";

import { updateInstitutionAction } from "@/lib/actions/institution.action";
import { Institution, Product } from "@/lib/services/institution.service";
import { useInstitutionStore } from "@/lib/store/institution.store";
import { PRODUCT_MAP } from "@/lib/types/product";
import { cn } from "@/lib/utils";
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
  Landmark,
  LoaderCircleIcon,
  Locate,
  Mail,
  MapPin,
  ScanLine,
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
import InfoItem from "./info-item";
import { Badge } from "@/components/ui/badge";

type Props = { institutions: Array<Institution>; isPNPG?: boolean };

const editableFields = [
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
];

export default function InstitutionInfo({
  institutions,
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
  const resetValues = useInstitutionStore((state) => state.resetValues);

  const [currentInstitution, setCurrentInstitution] = useState(
    institutions.at(0) || null,
  );
  const [currentProduct, setCurentProduct] = useState(
    institutions.at(0)?.onboarding.at(0) || null,
  );
  const [confirmChangesDialogOpen, setConfigChangesDialogOpen] =
    useState(false);

  const [state, action] = useActionState(updateInstitutionAction, {});
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setConfigChangesDialogOpen(true);
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
            name: currentInstitution.description ?? currentInstitution.origin,
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
    if (currentInstitution?.id && currentProduct?.productId) {
      const query = createQueryString([
        { key: "institution", value: currentInstitution.id },
        { key: "product", value: currentProduct.productId },
      ]);

      router.push(`${pathname}?${query}`);
    }
  }, [pathname, router, createQueryString, currentInstitution, currentProduct]);

  useEffect(() => {
    if (state.fields) {
      if (state?.errors?.root) {
        toast.success("Errore imprevisto.", {
          description:
            "Si è verificato un errore imprevisto, riprova più tardi.",
        });
      } else {
        toast.success("Informazioni aggiornate.", {
          description: `Le informazioni dell'ente sono state aggiornate con successo.`,
        });

        router.refresh();

        setConfigChangesDialogOpen(false);
      }

      resetValues({
        description: currentInstitution?.description || "",
        address: currentInstitution?.address || "",
        digitalAddress: currentInstitution?.digitalAddress || "",
        zipCode: currentInstitution?.zipCode || "",
      });
    }
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
        />

        <ProductSelect
          products={currentInstitution?.onboarding}
          currentProduct={currentProduct}
          setCurrentProduct={setCurentProduct}
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

      <form
        onSubmit={onSubmit}
        className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 grid grid-cols-5 gap-4"
      >
        <input type="submit" hidden />
        <InfoItem
          name="description"
          label="Ente"
          value={currentInstitution?.description}
          className="col-span-2"
          isEditable
          icon={<Landmark className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="zipCode"
          label="ZIP"
          value={currentInstitution?.zipCode}
          isEditable
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
          isEditable
          icon={<Mail className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="address"
          label="Indirizzo"
          value={currentInstitution?.address}
          isEditable
          icon={<MapPin className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="origin"
          label="Origin"
          value={currentInstitution?.origin}
          icon={<Locate className="size-4 mr-2 text-muted-foreground" />}
        />
        <InfoItem
          name="product"
          label="Prodotto"
          value={
            currentProduct?.productId
              ? PRODUCT_MAP[currentProduct?.productId]
              : currentProduct?.productId
          }
          icon={<ScanLine className="size-4 mr-2 text-muted-foreground" />}
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
            formData.append("address", valuesFromStore.address);
            formData.append("description", valuesFromStore.description);
            formData.append("digitalAddress", valuesFromStore.digitalAddress);
            formData.append("zipCode", valuesFromStore.zipCode);
            formData.append("sendToQueue", String(sendToQueue));
            formData.append("onboarding", currentProduct?.tokenId || "");
            formData.append("isPNPG", String(isPNPG));
            formData.append(
              "onboardings",
              JSON.stringify(
                currentInstitution?.onboarding.map((item) => ({
                  productId: item.productId as string,
                  vatNumber: item.billing?.vatNumber as string,
                })) || [],
              ),
            );

            startTransition(() => action(formData));
          }}
          changes={editableFields
            .map((item) => {
              const oldValue =
                currentInstitution &&
                (currentInstitution as unknown as Record<string, string>)[
                  item.field
                ];
              const newValue = (
                valuesFromStore as unknown as Record<string, string>
              )[item.field];

              if (!oldValue || !newValue) {
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
      </form>
    </section>
  );
}

function InstitutionSelect({
  institutions,
  currentInstitution,
  setCurrentInstitution,
}: {
  institutions: Array<Institution>;
  currentInstitution: Institution | null;
  setCurrentInstitution: Dispatch<SetStateAction<Institution | null>>;
}) {
  return (
    <Select
      onValueChange={(value) =>
        setCurrentInstitution(
          institutions.find((institution) => institution.id === value) || null,
        )
      }
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
