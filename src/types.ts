export enum AccountType {
  Asset = "Asset",
  Liability = "Liability",
  Equity = "Equity",
  Income = "Income",
  Expense = "Expense"
}

export interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: AccountType;
  parent?: string;
  balance: number;
}

export interface JournalEntryItem {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  notes?: string;
}

export type DocumentWorkflowStatus = "Draft" | "Pending Review" | "Approved" | "Posted" | "Cancelled" | "Rejected" | "Archived";

export enum Currency {
  YER = "YER",
  SAR = "SAR",
  USD = "USD"
}

export interface ExchangeRate {
  id: string;
  date: string;
  from: Currency;
  to: Currency;
  rate: number;
}

export interface CompanySettings {
  name: string;
  nameAr: string;
  commercialRegistration: string;
  taxNumber: string;
  logo: string;
  address: string;
  country: string;
  defaultLanguage: "ar" | "en";
  defaultCurrency: Currency;
  fiscalYear: string;
  taxConfiguration: {
    vatRate: number; // e.g., 0.15 for 15%
  };
  invoiceFormat: string; // e.g., INV-{YYYY}-{SEQ}
  receiptFormat: string; // e.g., REC-{YYYY}-{SEQ}
  warehouseFormat: string; // e.g., WH-{SEQ}
  barcodeSettings: {
    prefix: string;
    length: number;
  };
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  notes: string;
  items: JournalEntryItem[];
  posted: boolean;
  workflowStatus?: DocumentWorkflowStatus;
  currency?: Currency;
  exchangeRate?: number;
  isRecurring?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
}

export interface Supplier {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
}

export interface Warehouse {
  id: string;
  name: string;
  nameAr: string;
  location: string;
}

export enum ItemCategory {
  GreenCoffee = "Green Coffee (بن خام)",
  RawSpices = "Raw Spices (بهارات خام)",
  RoastedCoffee = "Roasted Coffee (بن محمص)",
  GroundCoffee = "Ground Coffee (بن مطحون)",
  ProcessedSpices = "Processed Spices (بهارات مصنعة)",
  PackagingMaterial = "Packaging Material (مواد تعبئة)",
  FinishedProduct = "Finished Product (منتج نهائي)"
}

export interface Item {
  id: string;
  name: string;
  nameAr: string;
  sku: string;
  category: ItemCategory;
  unit: string;
  price: number; // Wholesale/Retail selling price
  cost: number;  // Weighted average cost or standard cost
  barcode: string;
  currentStock: number;
}

export interface Batch {
  id: string;
  batchNumber: string;
  itemId: string;
  itemName: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  supplierId?: string;
  costPerUnit: number;
  warehouseId: string;
}

export interface RecipeMaterial {
  itemId: string;
  itemName: string;
  quantity: number; // Qty of raw material needed per 1 unit/kg of output
}

export interface Recipe {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  outputItemId: string;
  outputItemName: string;
  rawMaterials: RecipeMaterial[];
}

export enum JobStatus {
  Pending = "Pending",
  Completed = "Completed"
}

export interface RoastingJob {
  id: string;
  jobDate: string;
  batchNumber: string;
  recipeId: string;
  recipeName: string;
  inputItemId: string; // Green Coffee / Raw Spices
  inputQuantity: number; // in kg
  outputItemId: string; // Roasted Coffee / Spices
  outputQuantity: number; // in kg
  roastTimeMinutes: number;
  tempCelsius: number;
  weightLossPct: number; // calculated as ((input - output) / input) * 100
  status: JobStatus;
  workerName: string;

  // UI Compatibility & Domain Aliases
  batchId?: string;
  greenItemId?: string;
  greenItemName?: string;
  greenQty?: number;
  roastedItemId?: string;
  roastedItemName?: string;
  roastedQty?: number;
  roastProfile?: string;
  kilnTemperature?: number;
  durationMinutes?: number;
  operator?: string;
}

export interface GrindingJob {
  id: string;
  jobDate: string;
  inputBatchNumber: string;
  inputItemId: string;
  inputQuantity: number; // in kg
  outputItemId: string; // Ground Coffee
  outputQuantity: number; // in kg
  status: JobStatus;

  // UI Compatibility & Domain Aliases
  batchId?: string;
  roastedItemId?: string;
  roastedItemName?: string;
  roastedQty?: number;
  groundItemId?: string;
  groundItemName?: string;
  groundQty?: number;
  finenessSetting?: string;
  operator?: string;
}

export interface PackagingJob {
  id: string;
  jobDate: string;
  inputBatchNumber: string;
  inputItemId: string;
  inputQuantity: number; // in kg or units
  packagingItemId: string; // e.g. bags, boxes
  packagingQtyUsed: number;
  finishedItemId: string; // Final product (e.g. Cardboard box of 250g ground coffee)
  finishedQty: number; // number of finished packs
  status: JobStatus;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: "Draft" | "Approved" | "Received";
  workflowStatus?: DocumentWorkflowStatus;
  currency?: Currency;
  exchangeRate?: number;
  items: PurchaseOrderItem[];
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
}

export interface SalesInvoiceItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  status: "Paid" | "Unpaid";
  workflowStatus?: DocumentWorkflowStatus;
  currency?: Currency;
  exchangeRate?: number;
  items: SalesInvoiceItem[];
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  type: "Wholesale" | "Retail" | "POS";
}

export interface POSSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  startingCash: number;
  salesCount: number;
  totalCashSales: number;
  totalCardSales: number;
  status: "Open" | "Closed";
}

export interface BankTransaction {
  id: string;
  date: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  description: string;
  accountName: "Cash" | "Al-Rajhi Bank" | "SABB Bank";
}

export type UserRole = 
  | "Admin" 
  | "Owner" 
  | "Accountant" 
  | "Warehouse Manager" 
  | "Production Manager" 
  | "Cashier" 
  | "Sales" 
  | "Purchasing" 
  | "Auditor" 
  | "Viewer"
  | "POS Operator";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface InventoryAdjustment {
  id: string;
  date: string;
  warehouseId: string;
  itemId: string;
  itemName: string;
  type: "Addition" | "Deduction";
  quantity: number;
  costPerUnit: number;
  notes: string;
  workflowStatus: DocumentWorkflowStatus;
}

export interface StockTransfer {
  id: string;
  date: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  notes: string;
  workflowStatus: DocumentWorkflowStatus;
}

export interface RecurringEntry {
  id: string;
  name: string;
  frequency: "Monthly" | "Weekly" | "Quarterly";
  referenceEntryId: string;
  nextPostingDate: string;
  active: boolean;
}

export interface Backup {
  id: string;
  filename: string;
  createdAt: string;
  size: string;
}

export interface RoasteryExpense {
  id: string;
  date: string;
  type: string;
  amount: number;
  notes: string;
}

export interface GrindingExpense {
  id: string;
  date: string;
  type: string;
  amount: number;
  notes: string;
}

export interface CashboxTransaction {
  id: string;
  date: string;
  type: "receipt" | "payment" | "expense";
  amount: number;
  description: string;
  category: string;
  recipient: string;
  paymentMethod: string;
}

export interface CustomerMovement {
  id: string;
  customerId: string;
  date: string;
  type: "sale" | "payment" | "return" | "transfer";
  amount: number;
  reference: string;
  notes: string;
}

