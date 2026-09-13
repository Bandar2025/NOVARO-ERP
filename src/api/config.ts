export type PersistenceMode = "local" | "api";

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs: number;
  persistenceMode: PersistenceMode;
}

function resolvePersistenceMode(): PersistenceMode {
  try {
    // Vite client-side environment
    if (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_PERSISTENCE_MODE === "api") {
      return "api";
    }
  } catch {
    // fallback
  }
  try {
    // Node.js / test environment
    if (typeof process !== "undefined" && process.env?.VITE_PERSISTENCE_MODE === "api") {
      return "api";
    }
  } catch {
    // fallback
  }
  return "local";
}

export const defaultApiConfig: ApiClientConfig = {
  baseUrl: "/api/v1",
  timeoutMs: 10000,
  // Safe default: "local" mode as required by Phase 2A master prompt
  persistenceMode: resolvePersistenceMode()
};
