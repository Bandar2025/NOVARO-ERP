export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PERIOD_LOCKED"
  | "POSTED_ENTRY_IMMUTABLE"
  | "INSUFFICIENT_STOCK"
  | "JOURNAL_ENTRY_UNBALANCED"
  | "INTERNAL_ERROR";

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail[] | unknown[];
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: ApiErrorDetail[] | unknown[]
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static validation(message: string, details?: unknown[]): AppError {
    return new AppError("VALIDATION_ERROR", message, 400, details);
  }

  static notFound(resource: string, id?: string): AppError {
    return new AppError("NOT_FOUND", `${resource}${id ? ` with id '${id}'` : ""} not found.`, 404);
  }

  static conflict(message: string): AppError {
    return new AppError("CONFLICT", message, 409);
  }

  static periodLocked(periodName: string): AppError {
    return new AppError("PERIOD_LOCKED", `Cannot post entry: fiscal period '${periodName}' is locked/closed.`, 400);
  }

  static postedEntryImmutable(id: string): AppError {
    return new AppError("POSTED_ENTRY_IMMUTABLE", `Journal entry '${id}' is posted and cannot be modified. Use reversal instead.`, 409);
  }

  static insufficientStock(item: string, requested: number, available: number): AppError {
    return new AppError("INSUFFICIENT_STOCK", `Insufficient stock for '${item}'. Requested: ${requested}, Available: ${available}`, 400);
  }

  static unbalancedEntry(discrepancy: number): AppError {
    return new AppError("JOURNAL_ENTRY_UNBALANCED", `Journal entry is not balanced. Total debit must equal total credit (Discrepancy: SAR ${discrepancy.toFixed(2)}).`, 400);
  }

  static internal(message: string = "An internal server error occurred."): AppError {
    return new AppError("INTERNAL_ERROR", message, 500);
  }
}
