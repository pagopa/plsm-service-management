"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InstitutionStoreValues,
  useInstitutionStore,
} from "@/lib/store/institution.store";
import { cn, Label } from "@repo/ui";
import { CheckIcon, CopyIcon, PencilIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  name: string;
  label: string;
  value?: string;
  isEditable?: boolean;
  isCopyable?: boolean;
  icon?: React.ReactNode;
} & React.ComponentProps<"div">;

export default function InfoItem({
  name,
  label,
  value = "Non presente",
  isEditable = false,
  className,
  children,
  isCopyable = false,
  icon,
  ...props
}: Props) {
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      <Label
        htmlFor={id}
        className="text-muted-foreground text-xs flex flex-row items-center"
      >
        {label}
        {icon}
      </Label>

      {children || (
        <InfoItemContent
          name={name}
          value={value}
          isEditable={isEditable}
          isCopyable={isCopyable}
        />
      )}
    </div>
  );
}

function InfoItemContent({
  name,
  value,
  isEditable = false,
  isCopyable = false,
}: {
  name: string;
  value: string;
  isEditable?: boolean;
  isCopyable?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [mouseDownOnCheck, setMouseDownOnCheck] = useState(false);
  const updateValue = useInstitutionStore((state) => state.updateValue);
  const values = useInstitutionStore((state) => state.values);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isCopyConfirmed, setIsCopyConfirmed] = useState(false);

  useEffect(() => {
    if (isCopyConfirmed) {
      setTimeout(() => {
        setIsCopyConfirmed(false);
      }, 2000);
    }
  }, [isCopyConfirmed]);

  useEffect(() => {
    updateValue(name, value);
  }, [updateValue, name, value]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  function handleFocusLoss() {
    if (mouseDownOnCheck) return;
    setIsEditing(false);
  }

  if (isEditable && isEditing) {
    return (
      <div className="inline-flex">
        <button ref={buttonRef} type="submit" className="hidden" />

        <Input
          ref={inputRef}
          onBlur={() => handleFocusLoss()}
          defaultValue={value}
          className="h-fit text-base! p-0 *:ring-0 focus-visible:border-none focus-visible:ring-0 border-none! w-full rounded-none shadow-none"
          placeholder={name}
          onChange={(event) => {
            updateValue(name, event.target.value);
          }}
        />

        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="size-8"
          onMouseDown={() => setMouseDownOnCheck(true)}
          onMouseUp={() => {
            setMouseDownOnCheck(false);
          }}
          onClick={() => {
            if (buttonRef.current) {
              buttonRef.current.click();
            }
          }}
        >
          <CheckIcon className="size-3.5 opacity-60" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2 group min-h-8 h-fit")}>
      <span className="w-full">
        {values[name as InstitutionStoreValues] || value}
      </span>

      {isEditable && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          type="button"
          onClick={() => {
            setIsEditing(true);
          }}
        >
          <PencilIcon className="size-3.5 opacity-60" />
        </Button>
      )}

      {isCopyable && !isCopyConfirmed && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(
              values[name as InstitutionStoreValues] || value,
            );
            setIsCopyConfirmed(true);
            toast.success("Copiato negli appunti");
          }}
        >
          <CopyIcon className="size-3.5 opacity-60" />
        </Button>
      )}

      {isCopyConfirmed && (
        <Button variant="ghost" size="icon" className="size-8" type="button">
          <CheckIcon className="size-3.5 opacity-60" />
        </Button>
      )}
    </div>
  );
}
