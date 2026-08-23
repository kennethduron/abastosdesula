const sensitiveEnvironmentNames = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function stringField(record: Record<string, unknown> | null, name: string) {
  const value = record?.[name];
  return typeof value === "string" ? value : undefined;
}

function sanitizeText(value: unknown) {
  let sanitized = String(value ?? "unknown");
  for (const name of sensitiveEnvironmentNames) {
    const secret = process.env[name];
    if (secret) sanitized = sanitized.replaceAll(secret, "[REDACTED]");
  }
  return sanitized
    .replace(
      /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g,
      "[REDACTED_PRIVATE_KEY]",
    )
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/\b[A-Za-z0-9_-]{80,}\b/g, "[REDACTED_TOKEN]");
}

export function getSanitizedServerError(error: unknown, stage: string) {
  const record = asRecord(error);
  const errorInfo = asRecord(record?.errorInfo);
  const cause = asRecord(record?.cause);
  const code =
    stringField(record, "code") ??
    stringField(errorInfo, "code") ??
    stringField(cause, "code") ??
    "unknown";
  const name = stringField(record, "name") ?? "UnknownError";
  const message =
    stringField(record, "message") ??
    stringField(cause, "message") ??
    "unknown";
  const stack = stringField(record, "stack")
    ?.split("\n")
    .slice(0, 10)
    .map(sanitizeText);

  return {
    stage,
    code: sanitizeText(code),
    name: sanitizeText(name),
    message: sanitizeText(message),
    causeCode: sanitizeText(stringField(cause, "code") ?? "unknown"),
    causeMessage: sanitizeText(stringField(cause, "message") ?? "unknown"),
    stack,
  };
}
