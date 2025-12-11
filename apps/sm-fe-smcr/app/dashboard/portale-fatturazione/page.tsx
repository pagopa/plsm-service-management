import { UploadFileSection } from "@/components/file-upload";
import { FolderOpenIcon } from "lucide-react";

export default function FileBrowserPage() {
  return (
    <div className="h-full w-full p-2">
      <div className="inline-flex items-center justify-between w-full border-b p-2">
        <div className="inline-flex gap-2 items-center">
          <FolderOpenIcon className="size-4 opacity-60" />
          <h1 className="font-medium text-lg">
            Carica il manuale su Portale Fatturazione
          </h1>
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <UploadFileSection />
      </div>
    </div>
  );
}
