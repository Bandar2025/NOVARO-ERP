import { Router, Response, NextFunction } from "express";
import { salesService } from "../services";
import { AuthRequest, authenticateToken, requirePermission } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

// GET /api/v1/sales
router.get("/", requirePermission("sales:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sales = await salesService.getAll();
    res.json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sales/:id
router.get("/:id", requirePermission("sales:read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sale = await salesService.getById(req.params.id);
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sales
router.post("/", requirePermission("sales:create"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const created = await salesService.createSale(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
