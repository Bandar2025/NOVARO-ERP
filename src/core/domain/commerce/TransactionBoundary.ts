// NOVARO ERP Domain Model: Transaction Boundary & Atomic Execution Results

export interface TransactionStepResult<T = unknown> {
  stepName: string;
  success: boolean;
  error?: string;
  data?: T;
}

export interface AtomicTransactionResult<T = unknown> {
  transactionId: string;
  committed: boolean;
  success: boolean;
  errors: string[];
  error?: string;
  steps: TransactionStepResult[];
  data?: T;
}

export class TransactionBoundary {
  private steps: TransactionStepResult[] = [];
  private hasFailed = false;
  private transactionId: string;

  constructor(transactionPrefix = "TX") {
    this.transactionId = `${transactionPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  get id(): string {
    return this.transactionId;
  }

  executeStep<T>(stepName: string, stepFn: () => { success: boolean; error?: string; data?: T }): boolean {
    if (this.hasFailed) {
      this.steps.push({
        stepName,
        success: false,
        error: "Aborted: Previous step in atomic boundary failed."
      });
      return false;
    }

    try {
      const result = stepFn();
      if (!result.success) {
        this.hasFailed = true;
        this.steps.push({
          stepName,
          success: false,
          error: result.error || "Step execution returned false"
        });
        return false;
      }

      this.steps.push({
        stepName,
        success: true,
        data: result.data
      });
      return true;
    } catch (err: unknown) {
      this.hasFailed = true;
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.steps.push({
        stepName,
        success: false,
        error: errorMsg
      });
      return false;
    }
  }

  complete<T>(finalData?: T): AtomicTransactionResult<T> {
    const errors = this.steps.filter(s => !s.success).map(s => `${s.stepName}: ${s.error}`);
    return {
      transactionId: this.transactionId,
      committed: !this.hasFailed,
      success: !this.hasFailed,
      errors,
      error: errors.length > 0 ? errors.join("; ") : undefined,
      steps: this.steps,
      data: !this.hasFailed ? finalData : undefined
    };
  }
}
