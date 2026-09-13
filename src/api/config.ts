export type PersistenceMode = "local" | "api";

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs: number;
  persistenceMode: PersistenceMode;
}

export const defaultApiConfig: ApiClientConfig = {
  baseUrl: "/api/v1",
  timeoutMs: 10000,
  // Safe default: "local" mode as required by Phase 2A master prompt
  persistenceMode: (typeof process !== "undefined" && process.env?.VITE_PERSISTENCE_MODE === "api") 
    ? "api" 
    : "local"
};
