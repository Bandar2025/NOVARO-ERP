import { Router, Request, Response, NextFunction } from "express";
import { customerService } from "../services";

const router = Router();

// GET /api/v1/customers
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await customerService.getAll();
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/customers/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.getById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/customers
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await customerService.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
