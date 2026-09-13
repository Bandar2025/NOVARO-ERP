import { Request, Response, NextFunction } from "express";
import { AppError } from "../../src/core/application/errors/ApiError";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || []
      }
    });
    return;
  }

  console.error("Unhandled API Error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: err?.message || "Internal server error occurred.",
      details: []
    }
  });
}
