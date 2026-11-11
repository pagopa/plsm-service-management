type LogError = {
  name?: string | null;
  message?: string | null;
  stack?: string | null;
};

// Only compact the envelope: values inside metadata can be meaningful even
// when they are null, false, zero or an empty array.
export function compactLogFields<T extends Record<string, unknown>>(
  fields: T | null | undefined,
): Partial<T> | undefined {
  if (!fields) {
    return undefined;
  }

  const entries = Object.entries(fields).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value).length > 0;
    }
    return true;
  });

  return entries.length
    ? (Object.fromEntries(entries) as Partial<T>)
    : undefined;
}

export function toLogError(error: unknown): LogError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "Error",
    message: typeof error === "string" ? error : safeStringify(error),
  };
}

export function toLogMetadata(
  value: unknown,
): Record<string, unknown> | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  try {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const metadata = JSON.parse(JSON.stringify(value)) as Record<
        string,
        unknown
      >;
      return Object.keys(metadata).length ? metadata : undefined;
    }
  } catch {
    return { value: String(value) };
  }

  return { value };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
