import { Router, Response, NextFunction } from "express";
import { accountService } from "../services";
import { AuthRequest, authenticateToken, requirePermission } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

// GET /api/v1/accounts
router.get("/", requirePermission("accounts:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accounts = await accountService.getAll();
    res.json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/accounts/:id
router.get("/:id", requirePermission("accounts:read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const account = await accountService.getById(req.params.id);
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/accounts
router.post("/", requirePermission("accounts:create"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const created = await accountService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
