import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import z from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeWords(input: string): string {
  return input
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type RawInput = Record<string, FormDataEntryValue>; // string | File

type ValidationResult<T> =
  | { input: T; errors: null }
  | { input: RawInput; errors: Record<string, string> };

export function validateFormData<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  formData: FormData,
): ValidationResult<z.infer<TSchema>> {
  const raw = Object.fromEntries(formData.entries()) as RawInput;

  const result = schema.safeParse(raw);

  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    return { input: raw, errors };
  }

  return { input: result.data, errors: null };
}
