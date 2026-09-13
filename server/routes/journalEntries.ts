import { Router, Request, Response, NextFunction } from "express";
import { journalEntryService } from "../services";
import { AppError } from "../../src/core/application/errors/ApiError";

const router = Router();

// GET /api/v1/journal-entries
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await journalEntryService.getAll();
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/journal-entries/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.getById(req.params.id);
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/journal-entries
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.createDraft(req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/journal-entries/:id/post
router.post("/:id/post", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posted = await journalEntryService.post(req.params.id, req.body);
    res.json({ success: true, data: posted });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/journal-entries/:id/reverse
router.post("/:id/reverse", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reason = req.body?.reason || "API Reversal Request";
    const result = await journalEntryService.reverse(req.params.id, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/journal-entries/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await journalEntryService.updateDraft(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
