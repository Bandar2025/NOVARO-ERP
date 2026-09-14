import { Router, Response, NextFunction } from "express";
import { journalEntryService } from "../services";
import { AuthRequest, authenticateToken, requirePermission } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

// GET /api/v1/journal-entries
router.get("/", requirePermission("journal:read"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entries = await journalEntryService.getAll();
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/journal-entries/:id
router.get("/:id", requirePermission("journal:read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.getById(req.params.id);
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/journal-entries
router.post("/", requirePermission("journal:create"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.createDraft(req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/journal-entries/:id/post
router.post("/:id/post", requirePermission("journal:post"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const posted = await journalEntryService.post(req.params.id, req.body);
    res.json({ success: true, data: posted });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/journal-entries/:id/reverse
router.post("/:id/reverse", requirePermission("journal:reverse"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reason = req.body?.reason || "API Reversal Request";
    const result = await journalEntryService.reverse(req.params.id, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/journal-entries/:id
router.put("/:id", requirePermission("journal:update"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await journalEntryService.updateDraft(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;

