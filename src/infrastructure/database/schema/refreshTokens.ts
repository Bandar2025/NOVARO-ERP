import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_refresh_tokens_user").on(table.userId),
  tenantIdx: index("idx_refresh_tokens_tenant").on(table.tenantId),
  tokenHashIdx: index("idx_refresh_tokens_hash").on(table.tokenHash),
}));
