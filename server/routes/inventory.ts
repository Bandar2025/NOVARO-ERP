import { Router, Response, NextFunction } from "express";
import { inventoryService } from "../services";
import { AuthRequest, authenticateToken, requirePermission } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

// GET /api/v1/inventory (items list)
router.get("/", requirePermission("inventory:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await inventoryService.getItems();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/items/:id
router.get("/items/:id", requirePermission("inventory:read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.getItemById(req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/movements
router.get("/movements", requirePermission("inventory:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const movements = await inventoryService.getMovements();
    res.json({ success: true, data: movements });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/cost-layers
router.get("/cost-layers", requirePermission("inventory:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const layers = await inventoryService.getCostLayers();
    res.json({ success: true, data: layers });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/batches
router.get("/batches", requirePermission("inventory:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const batches = await inventoryService.getBatches();
    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
});

export default router;
