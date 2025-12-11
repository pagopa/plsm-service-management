"use client";
import { uploadManualAction } from "@/app/dashboard/file-browser/actions";
import { UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { FileBrowser } from "./file-browser";
import { toast } from "sonner";

export function UploadFileSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    inputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    const res = await uploadManualAction(formData);
    setUploading(false);
    if (res.error) toast.error(res.error);
    else toast.success(res.data ?? "File caricato con successo");
  };

  return (
    <div className="flex flex-col gap-4">
      <form className="border rounded p-4 bg-gray-50" onSubmit={handleSubmit}>
        <h2 className="font-semibold mb-2">Upload File</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleUpload}
          >
            <UploadIcon className="size-4" />
            Seleziona file
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={!file || uploading}
          >
            <UploadIcon className="size-4" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (!e.target.files) return;
            setFile(e.target.files[0] ?? null);
          }}
        />
      </form>
      {file && <FileBrowser file={file} />}
    </div>
  );
}
