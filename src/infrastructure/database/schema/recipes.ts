import { pgTable, text, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { items } from "./items";

export const recipes = pgTable("recipes", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description"),
  outputItemId: text("output_item_id").notNull().references(() => items.id, { onDelete: "restrict" }),
  outputItemName: text("output_item_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_recipes_tenant").on(table.tenantId),
  companyIdx: index("idx_recipes_company").on(table.companyId),
}));

export const recipeMaterials = pgTable("recipe_materials", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "restrict" }),
  itemName: text("item_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_recipe_mat_tenant").on(table.tenantId),
  companyIdx: index("idx_recipe_mat_company").on(table.companyId),
  recipeIdx: index("idx_recipe_mat_recipe").on(table.recipeId),
}));
