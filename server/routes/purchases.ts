import { Router, Response, NextFunction } from "express";
import { purchaseService } from "../services";
import { AuthRequest, authenticateToken, requirePermission } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

// GET /api/v1/purchases
router.get("/", requirePermission("purchases:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const purchases = await purchaseService.getAll();
    res.json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/purchases/:id
router.get("/:id", requirePermission("purchases:read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const po = await purchaseService.getById(req.params.id);
    res.json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/purchases
router.post("/", requirePermission("purchases:create"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const created = await purchaseService.createPurchase(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/purchases/:id/receive
router.post("/:id/receive", requirePermission("purchases:create"), async (req: AuthRequest, res: Response, next: NextFunction) => {
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
