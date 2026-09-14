import { Router, Response, NextFunction } from "express";
import { supplierService } from "../services";
import { AuthRequest, authenticateToken, requirePermission } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

// GET /api/v1/suppliers
router.get("/", requirePermission("suppliers:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const suppliers = await supplierService.getAll();
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/suppliers/:id
router.get("/:id", requirePermission("suppliers:read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await supplierService.getById(req.params.id);
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/suppliers
router.post("/", requirePermission("suppliers:create"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const created = await supplierService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
