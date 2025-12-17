"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ImageTeam from "@/components/admin/teams/image-teams";
import { useRouter } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function UpdateTeamImage({ teamId }: { teamId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isWorkingPreview, setIsWorkingPreview] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("image") as File;

    if (!file) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/teams/${teamId}/update-image`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(
          "Errore durante l'aggiornamento dell'immagine del team",
        );
      }
      setImageKey((prev) => prev + 1);
      setIsWorkingPreview(false);

      router.refresh();
    } catch (error) {
      console.error(
        "Errore durante l'aggiornamento dell'immagine del team:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-4">
      <input type="file" name="image" className="hidden" id="image-upload" />
      <ImageTeam
        key={imageKey}
        onImageSelected={(file) => {
          const dataTransfer = new DataTransfer();
          if (file) {
            dataTransfer.items.add(file);
          }
          const fileInput = document.getElementById(
            "image-upload",
          ) as HTMLInputElement;
          if (fileInput) {
            fileInput.files = dataTransfer.files;
            setIsWorkingPreview(true);
          }
        }}
        onError={(error) => {
          console.error(error);
          setIsWorkingPreview(false);
        }}
      />
      <Button
        type="submit"
        variant="default"
        size="sm"
        disabled={isLoading || !isWorkingPreview}
      >
        {isLoading ? "Aggiornamento..." : "Aggiorna"}
      </Button>
    </form>
  );
}
