"use client";

import { Button } from "@repo/ui";
import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  filename: string;
};

export default function DownloadConctract({ filename: customFileName }: Props) {
  const params = useSearchParams();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    const url = `/api/contract/download?institutionId=${params.get("institution")}&productId=${params.get("product")}&filename=${customFileName}`;
    const response = await fetch(url);

    if (!response.ok) {
      setIsPending(false);
      if (response.status === 404) {
        toast.error("Contratto non presente.");
        return;
      }

      toast.error("Si è verificato un errore.");
      return;
    }

    const disposition = response.headers.get("content-disposition");
    let filename = "contratto.pdf";
    if (disposition && disposition.includes("filename=")) {
      filename = disposition
        .split("filename=")[1]
        ?.replace(/["']/g, "")
        .split(";")[0] as string as string;
    }

    const blob = await response.blob();
    const fileUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setIsPending(false);
    setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      <span>Scarica contratto</span>
      {isPending ? (
        <LoaderCircleIcon className="animate-spin opacity-60 size-3.5" />
      ) : (
        <DownloadIcon className="opacity-60 size-3.5" />
      )}
    </Button>
  );
}
