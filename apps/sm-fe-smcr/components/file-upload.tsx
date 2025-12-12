"use client";
import { uploadManualAction } from "@/app/dashboard/file-browser/actions";
import { CloudUpload, FileIcon, UploadIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { UploadedFilesTable } from "./UploadedFilesTable";

export function UploadFileSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tableKey, setTableKey] = useState(0);

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
    else {
      toast.success(res.data ?? "File caricato con successo");
      const LOCAL_STORAGE_KEY = "uploaded-files";
      const prev = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      const newFile = {
        name: file.name,
        size: file.size,
        date: new Date().toLocaleString(),
      };
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify([newFile, ...prev].slice(0, 10)),
      );
      setTableKey((k) => k + 1); // force table re-render
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        className="border rounded-md p-4 bg-gray-50"
        onSubmit={handleSubmit}
      >
        <h2 className="font-semibold mb-2 text-2xl">
          <CloudUpload className="inline-block size-7 mr-2" />
          Caricamento Manuale su Portale Fatturazione
        </h2>
        <div
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-6 mb-4 transition-colors ${dragActive ? "border-pagopa-primary bg-bg-dashboard" : "border-gray-300 bg-white"}`}
          onClick={handleUpload}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              setFile(e.dataTransfer.files[0]);
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <UploadIcon className="size-8 text-pagopa-primary mb-2" />
          <span className="text-gray-600">
            Trascina un file qui o clicca per selezionare
          </span>
          {file && (
            <div className="border rounded-md p-4 bg-gray-50 w-full">
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row items-center gap-4">
                  <FileIcon className="size-4 text-pagopa-primary" />
                  <span>{file.name} </span>
                </div>
                <div className="flex flex-row gap-4 items-center">
                  <span>{(file.size / 1048576).toFixed(2)} MB</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                      e.stopPropagation();
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            className="w-full inline-flex items-center gap-2 px-4 py-2 bg-pagopa-primary text-white rounded-md hover:bg-pagopa-primary/80 disabled:opacity-50"
            disabled={!file || uploading}
          >
            <UploadIcon className="size-4" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ? e.target.files[0] : null);
          }}
        />
      </form>
      <UploadedFilesTable key={tableKey} />
    </div>
  );
}
