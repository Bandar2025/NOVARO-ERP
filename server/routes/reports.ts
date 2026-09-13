import { Router, Request, Response, NextFunction } from "express";
import { accountRepo, journalEntryRepo } from "../services";
import { TrialBalanceService } from "../../src/core/application/accounting/TrialBalanceService";

const router = Router();

// GET /api/v1/reports/trial-balance
router.get("/trial-balance", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOfDate = req.query.asOfDate as string | undefined;
    const accounts = await accountRepo.getAll();
    let journalEntries = await journalEntryRepo.getAll();

    if (asOfDate) {
      journalEntries = journalEntries.filter(e => e.date <= asOfDate);
    }

    const report = TrialBalanceService.getTrialBalance(accounts, journalEntries);
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/income-statement
router.get("/income-statement", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const accounts = await accountRepo.getAll();
    let journalEntries = await journalEntryRepo.getAll();

    if (startDate) {
      journalEntries = journalEntries.filter(e => e.date >= startDate);
    }
    if (endDate) {
      journalEntries = journalEntries.filter(e => e.date <= endDate);
    }

    const report = TrialBalanceService.generateIncomeStatement(accounts, journalEntries);
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/balance-sheet
router.get("/balance-sheet", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOfDate = req.query.asOfDate as string | undefined;
    const accounts = await accountRepo.getAll();
    let journalEntries = await journalEntryRepo.getAll();

    if (asOfDate) {
      journalEntries = journalEntries.filter(e => e.date <= asOfDate);
    }

    const report = TrialBalanceService.generateBalanceSheet(accounts, journalEntries);
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
});

export default router;
