import { Router, Request, Response } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: "NOVARO ERP",
    status: "healthy",
    version: "2.0"
  });
});

export default router;
