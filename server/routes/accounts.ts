import { Router, Request, Response, NextFunction } from "express";
import { accountService } from "../services";

const router = Router();

// GET /api/v1/accounts
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await accountService.getAll();
    res.json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/accounts/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await accountService.getById(req.params.id);
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/accounts
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await accountService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
