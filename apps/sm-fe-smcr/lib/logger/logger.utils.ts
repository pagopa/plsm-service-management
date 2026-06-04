type LogError = {
  name?: string | null;
  message?: string | null;
  stack?: string | null;
};

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

export function toLogMetadata(value: unknown): Record<string, unknown> {
  try {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
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
