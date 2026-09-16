export interface SanitizedConnectionMeta {
  provider: string;
  host: string;
  port: string;
  database: string;
  ssl: boolean;
}

/**
 * Extracts and returns sanitized connection metadata without leaking credentials, passwords, or tokens.
 */
export function getSanitizedConnectionMeta(rawUrl?: string): SanitizedConnectionMeta {
  if (!rawUrl) {
    return {
      provider: "unknown",
      host: "none",
      port: "none",
      database: "none",
      ssl: false,
    };
  }

  try {
    const parsed = new URL(rawUrl);
    return {
      provider: parsed.protocol.replace(":", ""),
      host: parsed.hostname || "unknown",
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || "unknown",
      ssl: parsed.searchParams.get("sslmode") !== null || parsed.searchParams.get("ssl") === "true",
    };
  } catch {
    // Robust regex fallback if protocol format is not standard URL
    const match = rawUrl.match(/^(?:([^:]+):\/\/)?(?:[^@]+@)?([^:\/?#]+)(?::(\d+))?(?:\/([^?#]*))?/);
    return {
      provider: match?.[1] || "postgres",
      host: match?.[2] || "unknown",
      port: match?.[3] || "5432",
      database: match?.[4] || "unknown",
      ssl: rawUrl.includes("sslmode=require") || rawUrl.includes("ssl=true"),
    };
  }
}

/**
 * Redacts credentials from error messages, stack traces, or connection strings.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return "";
  return message
    .replace(
      /(postgres(?:ql)?:\/\/)([^:@\s]+):([^@\s]+)@([^\s"'`]+)/gi,
      "$1[REDACTED_USER]:[REDACTED_SECRET]@$4"
    )
    .replace(/password=([^;\s]+)/gi, "password=[REDACTED_SECRET]")
    .replace(/user=([^;\s]+)/gi, "user=[REDACTED_USER]");
}
