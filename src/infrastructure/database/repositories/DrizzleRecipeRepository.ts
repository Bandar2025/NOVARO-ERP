import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { recipes, recipeMaterials } from "../schema/recipes";
import { TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { Recipe } from "../../../types";
import { extractTenantContext } from "./contextUtils";

export class DrizzleRecipeRepository {
  async findById(id: string, context?: TenantContext): Promise<Recipe | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const headers = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.id, id),
          eq(recipes.tenantId, tenantId),
          eq(recipes.companyId, companyId)
        )
      )
      .limit(1);

    if (headers.length === 0) return null;

    const materials = await db
      .select()
      .from(recipeMaterials)
      .where(
        and(
          eq(recipeMaterials.recipeId, id),
          eq(recipeMaterials.tenantId, tenantId),
          eq(recipeMaterials.companyId, companyId)
        )
      );

    return this.mapToDomain(headers[0], materials);
  }

  async getAll(options?: QueryOptions): Promise<Recipe[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    const headers = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.tenantId, tenantId),
          eq(recipes.companyId, companyId)
        )
      );

    const result: Recipe[] = [];
    for (const h of headers) {
      const materials = await db
        .select()
        .from(recipeMaterials)
        .where(
          and(
            eq(recipeMaterials.recipeId, h.id),
            eq(recipeMaterials.tenantId, tenantId),
            eq(recipeMaterials.companyId, companyId)
          )
        );
      result.push(this.mapToDomain(h, materials));
    }
    return result;
  }

  async save(recipe: Recipe, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);

    await db
      .insert(recipes)
      .values({
        id: recipe.id,
        tenantId,
        companyId,
        name: recipe.name,
        nameAr: recipe.nameAr,
        description: recipe.description || null,
        outputItemId: recipe.outputItemId,
        outputItemName: recipe.outputItemName,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: recipes.id,
        set: {
          name: recipe.name,
          nameAr: recipe.nameAr,
          description: recipe.description || null,
          outputItemId: recipe.outputItemId,
          outputItemName: recipe.outputItemName,
          updatedAt: new Date(),
        },
      });

    await db
      .delete(recipeMaterials)
      .where(
        and(
          eq(recipeMaterials.recipeId, recipe.id),
          eq(recipeMaterials.tenantId, tenantId),
          eq(recipeMaterials.companyId, companyId)
        )
      );

    if (recipe.rawMaterials && recipe.rawMaterials.length > 0) {
      await db.insert(recipeMaterials).values(
        recipe.rawMaterials.map((rm, idx) => ({
          id: `${recipe.id}-mat-${idx + 1}`,
          tenantId,
          companyId,
          recipeId: recipe.id,
          itemId: rm.itemId,
          itemName: rm.itemName,
          quantity: (rm.quantity ?? 0).toFixed(4),
        }))
      );
    }
  }

  private mapToDomain(
    header: typeof recipes.$inferSelect,
    materials: (typeof recipeMaterials.$inferSelect)[]
  ): Recipe {
    return {
      id: header.id,
      name: header.name,
      nameAr: header.nameAr,
      description: header.description || "",
      outputItemId: header.outputItemId,
      outputItemName: header.outputItemName,
      rawMaterials: materials.map(m => ({
        itemId: m.itemId,
        itemName: m.itemName,
        quantity: parseFloat(m.quantity),
      })),
    };
  }
}
