import { Router, Request, Response, NextFunction } from "express";
import { inventoryService } from "../services";

const router = Router();

// GET /api/v1/inventory (items list)
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await inventoryService.getItems();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/items/:id
router.get("/items/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.getItemById(req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/movements
router.get("/movements", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const movements = await inventoryService.getMovements();
    res.json({ success: true, data: movements });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/cost-layers
router.get("/cost-layers", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const layers = await inventoryService.getCostLayers();
    res.json({ success: true, data: layers });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/batches
router.get("/batches", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const batches = await inventoryService.getBatches();
    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
});

export default router;
