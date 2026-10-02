"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InstitutionStoreValues,
  useInstitutionStore,
} from "@/lib/store/institution.store";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, CopyIcon, PencilIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMPTY_FIELD_PLACEHOLDER = "—";
const NON_VALUES = new Set(["non presente", EMPTY_FIELD_PLACEHOLDER]);

export function editableFieldValue(value?: string | null) {
  if (value == null) return "";
  if (NON_VALUES.has(value.trim().toLowerCase())) return "";
  return value;
}

function displayedFieldValue(value?: string | null) {
  return editableFieldValue(value) || EMPTY_FIELD_PLACEHOLDER;
}

type Props = {
  name: string;
  label: string;
  value?: string;
  valueClassName?: string;
  isEditable?: boolean;
  isCopyable?: boolean;
  options?: ReadonlyArray<string>;
  icon?: React.ReactNode;
} & React.ComponentProps<"div">;

export default function InfoItem({
  name,
  label,
  value,
  valueClassName,
  isEditable = false,
  className,
  children,
  isCopyable = false,
  options,
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
          valueClassName={valueClassName}
          isEditable={isEditable}
          isCopyable={isCopyable}
          options={options}
        />
      )}
    </div>
  );
}

function InfoItemContent({
  name,
  value,
  valueClassName,
  isEditable = false,
  isCopyable = false,
  options,
}: {
  name: string;
  value?: string;
  valueClassName?: string;
  isEditable?: boolean;
  isCopyable?: boolean;
  options?: ReadonlyArray<string>;
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
    updateValue(name, editableFieldValue(value));
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

  const storedValue = editableFieldValue(
    values[name as InstitutionStoreValues] ?? value,
  );

  if (isEditable && isEditing && options) {
    const currentValue = storedValue;
    const availableOptions = options.includes(currentValue)
      ? options
      : [...options, currentValue].filter(Boolean);

    return (
      <div className="inline-flex items-center">
        <button ref={buttonRef} type="submit" className="hidden" />

        <Select
          value={currentValue}
          onValueChange={(newValue) => {
            updateValue(name, newValue);
          }}
        >
          <SelectTrigger className="h-8 w-full border-none shadow-none focus-visible:ring-0 px-0">
            <SelectValue placeholder={name} />
          </SelectTrigger>

          <SelectContent>
            {availableOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="size-8"
          onClick={() => {
            setIsEditing(false);
            buttonRef.current?.click();
          }}
        >
          <CheckIcon className="size-3.5 opacity-60" />
        </Button>
      </div>
    );
  }

  if (isEditable && isEditing) {
    return (
      <div className="inline-flex">
        <button ref={buttonRef} type="submit" className="hidden" />

        <Input
          ref={inputRef}
          onBlur={() => handleFocusLoss()}
          defaultValue={storedValue}
          className="h-fit text-base! p-0 *:ring-0 focus-visible:border-none focus-visible:ring-0 border-none! w-full rounded-none shadow-none"
          placeholder={EMPTY_FIELD_PLACEHOLDER}
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
      <span
        className={cn(
          "w-full",
          storedValue ? valueClassName : "text-muted-foreground",
        )}
      >
        {displayedFieldValue(storedValue)}
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
            navigator.clipboard.writeText(storedValue);
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
