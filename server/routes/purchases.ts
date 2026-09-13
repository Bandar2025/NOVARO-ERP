import { Router, Request, Response, NextFunction } from "express";
import { purchaseService } from "../services";

const router = Router();

// GET /api/v1/purchases
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const purchases = await purchaseService.getAll();
    res.json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/purchases/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await purchaseService.getById(req.params.id);
    res.json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/purchases
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await purchaseService.createPurchase(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/purchases/:id/receive
router.post("/:id/receive", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const received = await purchaseService.receivePurchase({
      purchaseOrderId: req.params.id,
      receivedDate: req.body?.receivedDate || new Date().toISOString().split("T")[0],
      warehouseId: req.body?.warehouseId || "wh-raw"
    });
    res.json({ success: true, data: received });
  } catch (err) {
    next(err);
  }
});

export default router;
