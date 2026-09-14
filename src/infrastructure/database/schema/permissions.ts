import { pgTable, text, timestamp, index, unique } from "drizzle-orm/pg-core";

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. "journal.read", "sales.create"
  name: text("name").notNull(),
  module: text("module").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
