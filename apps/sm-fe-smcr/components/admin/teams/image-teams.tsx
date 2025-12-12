"use client";

import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";

type ImageTeamProps = {
  onImageSelected?: (file: File | null) => void;
  onError?: (error: string) => void;
  initialPreview?: string | null;
  maxWidth?: number;
  maxHeight?: number;
};

export default function ImageTeam({
  onImageSelected,
  onError,
  initialPreview = null,
  maxWidth = 256,
  maxHeight = 256,
}: ImageTeamProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      onImageSelected?.(null);
      setPreview(null);
      return;
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      if (img.width > maxWidth || img.height > maxHeight) {
        const errorMsg = `L'immagine deve essere al massimo ${maxWidth}x${maxHeight} pixel`;
        onError?.(errorMsg);
        toast.error("Errore durante il caricamento dell'immagine", {
          description: `L'immagine deve essere al massimo ${maxWidth}x${maxHeight} pixel.`,
          duration: 4000,
        });
        setPreview(null);
      } else {
        toast.success("Immagine caricata in preview", {
          description: `L'immagine è stata correttamente caricata in preview`,
          duration: 4000,
        });
        onImageSelected?.(file);
        setPreview(objectUrl);
      }
    };

    img.onerror = () => {
      const errorMsg = "Impossibile caricare l'immagine";
      onError?.(errorMsg);
      setPreview(null);
    };

    img.src = objectUrl;
  };

  const handleRemoveImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onImageSelected?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          {preview && (
            <Image
              src={preview}
              alt="Team logo preview"
              fill
              className={`object-cover ${isImageLoading ? "opacity-50" : "opacity-100"}`}
              unoptimized={true}
              onLoad={() => setIsImageLoading(false)}
              onLoadStart={() => setIsImageLoading(true)}
            />
          )}
          {!preview && <UploadIcon className="text-gray-400" size={24} />}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Seleziona Immagine
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="text-destructive"
            >
              Rimuovi
            </Button>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
