import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Account, Customer, Supplier, Warehouse, Item, Batch, Recipe, 
  RoastingJob, GrindingJob, PackagingJob, PurchaseOrder, SalesInvoice, 
  POSSession, BankTransaction, User, AuditLog, Backup, JournalEntry, 
  AccountType, JobStatus, ItemCategory, DocumentWorkflowStatus, Currency, 
  UserRole, CompanySettings, InventoryAdjustment, StockTransfer, RecurringEntry,
  ExchangeRate, RoasteryExpense, GrindingExpense, CashboxTransaction, CustomerMovement,
  ZatcaDocumentRecord, SalesQuotation, SalesOrder, DeliveryNote, SalesReturn,
  PurchaseRequest, PurchaseReturn, FixedAsset, Employee, PayrollRun, CrmLead, CostCenter
} from "../types";
import { 
  initialAccounts, initialWarehouses, initialItems, initialRecipes, 
  initialCustomers, initialSuppliers, initialJournalEntries, initialBatches, 
  initialRoastingJobs, initialGrindingJobs, initialPackagingJobs, initialPurchaseOrders, 
  initialSalesInvoices, initialPOSSessions, initialBankTransactions, initialUsers, 
  initialAuditLogs, initialBackups, initialSalesQuotations, initialSalesOrders,
  initialDeliveryNotes, initialSalesReturns, initialPurchaseRequests, initialPurchaseReturns,
  initialFixedAssets, initialEmployees, initialPayrollRuns, initialCrmLeads, initialCostCenters
} from "../data/novaroInitialData";
import { AccountingEngine } from "../core/application/accounting/AccountingEngine";
import { 
  TrialBalanceService, 
  TrialBalanceResult, 
  IncomeStatementResult, 
  BalanceSheetResult 
} from "../core/application/accounting/TrialBalanceService";
import { InventoryEngine } from "../core/application/inventory/InventoryEngine";
import { CommerceService } from "../core/application/commerce/CommerceService";
import { ManufacturingEngine } from "../core/application/manufacturing/ManufacturingEngine";
import { 
  PostingAccountConfiguration, 
  defaultPostingAccountConfiguration 
} from "../core/domain/accounting/PostingAccountConfiguration";
import { FiscalPeriod } from "../core/domain/accounting/FiscalPeriod";
import { CostLayer } from "../core/domain/inventory/CostLayer";
import { DomainStockMovement } from "../core/domain/inventory/StockMovement";
import { DomainCustomerMovement } from "../core/domain/commerce/CustomerLedger";
import { DomainSupplierMovement } from "../core/domain/commerce/SupplierLedger";
import { DataIntegrityChecker, DataIntegrityReport } from "../core/diagnostics/DataIntegrityChecker";
import { runCertificationSuite, MasterCertificationReport } from "../core/certification/suite";
import { ZatcaEngine, ZATCA_GENESIS_PIH } from "../core/domain/zatca/ZatcaEngine";

export interface Toast {
  id: string;
  type: "success" | "warning" | "error" | "info";
  message: string;
  messageEn?: string;
  undoAction?: () => void;
  undoLabel?: string;
  undoLabelEn?: string;
}

interface StateContextType {
  accounts: Account[];
  warehouses: Warehouse[];
  items: Item[];
  recipes: Recipe[];
  customers: Customer[];
  suppliers: Supplier[];
  journalEntries: JournalEntry[];
  batches: Batch[];
  roastingJobs: RoastingJob[];
  grindingJobs: GrindingJob[];
  packagingJobs: PackagingJob[];
  purchaseOrders: PurchaseOrder[];
  salesInvoices: SalesInvoice[];
  posSessions: POSSession[];
  bankTransactions: BankTransaction[];
  users: User[];
  auditLogs: AuditLog[];
  backups: Backup[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  
  // Enterprise Core States
  companySettings: CompanySettings;
  setCompanySettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  exchangeRates: ExchangeRate[];
  setExchangeRates: React.Dispatch<React.SetStateAction<ExchangeRate[]>>;
  inventoryAdjustments: InventoryAdjustment[];
  stockTransfers: StockTransfer[];
  recurringEntries: RecurringEntry[];

  // Foundation Hardening & Financial Integrity
  postingConfig: PostingAccountConfiguration;
  setPostingConfig: React.Dispatch<React.SetStateAction<PostingAccountConfiguration>>;
  costLayers: CostLayer[];
  stockMovements: DomainStockMovement[];
  fiscalPeriods: FiscalPeriod[];
  supplierMovements: DomainSupplierMovement[];

  // Extended Enterprise Domains (Phase 2J-2M)
  zatcaRecords: ZatcaDocumentRecord[];
  salesQuotations: SalesQuotation[];
  salesOrders: SalesOrder[];
  deliveryNotes: DeliveryNote[];
  salesReturns: SalesReturn[];
  purchaseRequests: PurchaseRequest[];
  purchaseReturns: PurchaseReturn[];
  fixedAssets: FixedAsset[];
  employees: Employee[];
  payrollRuns: PayrollRun[];
  crmLeads: CrmLead[];
  costCenters: CostCenter[];

  // Ledger-derived reports & Auditing
  getTrialBalance: (asOfDate?: string) => TrialBalanceResult;
  getIncomeStatement: (startDate?: string, endDate?: string) => IncomeStatementResult;
  getBalanceSheet: (asOfDate?: string) => BalanceSheetResult;
  runDataIntegrityAudit: () => DataIntegrityReport;
  runMasterCertification: () => MasterCertificationReport;

  // Double-Entry Accounting
  postJournalEntry: (entry: Omit<JournalEntry, "id" | "posted">) => { success: boolean; error?: string };
  reverseJournalEntry: (entryId: string, reason: string) => { success: boolean; error?: string };
  addRecurringEntry: (rec: Omit<RecurringEntry, "id" | "nextPostingDate">) => void;
  postRecurringEntry: (id: string) => { success: boolean; error?: string };
  fiscalYearClosing: (closingNotes: string) => { success: boolean; error?: string };
  toggleFiscalPeriodLock: (periodId: string) => void;

  // Document Workflows Status Orchestrator
  updateDocumentWorkflowStatus: (
    docType: "journalEntry" | "purchaseOrder" | "salesInvoice" | "inventoryAdjustment" | "stockTransfer",
    docId: string,
    status: DocumentWorkflowStatus,
    reason?: string
  ) => { success: boolean; error?: string };

  // Warehouse Accounting Adjustments & Transfers
  addInventoryAdjustment: (adj: Omit<InventoryAdjustment, "id" | "workflowStatus">) => { success: boolean; error?: string };
  addStockTransfer: (trans: Omit<StockTransfer, "id" | "workflowStatus">) => { success: boolean; error?: string };
  addWarehouse: (wh: Omit<Warehouse, "id">) => void;

  // Production and FIFO Costing calculations
  addRecipe: (recipe: Omit<Recipe, "id">) => void;
  deleteRecipe: (id: string) => void;
  addRoastingJob: (job: Omit<RoastingJob, "id" | "weightLossPct">) => { success: boolean; error?: string };
  addGrindingJob: (job: Omit<GrindingJob, "id">) => { success: boolean; error?: string };
  addPackagingJob: (job: Omit<PackagingJob, "id">) => { success: boolean; error?: string };
  calculateProductionCost: (
    recipeId: string, 
    extra: { labor: number; electricity: number; fuel: number; machine: number; extraPackaging: number },
    inputQty: number,
    outputQty: number
  ) => { 
    rawCost: number; roastingCost: number; grindingCost: number; packagingCost: number; 
    laborCost: number; machineCost: number; electricityCost: number; fuelCost: number; 
    wastePct: number; yieldPct: number; finalCostPerUnit: number; totalCost: number;
  };

  // Trade (SRM & POS & Full Lifecycles)
  addPurchaseOrder: (po: Omit<PurchaseOrder, "id">) => void;
  receivePurchaseOrder: (poId: string) => { success: boolean; error?: string };
  addSalesInvoice: (invoice: Omit<SalesInvoice, "id" | "date">, type: "Wholesale" | "Retail" | "POS") => { success: boolean; error?: string; invoiceId?: string };
  openPOSSession: (startingCash: number) => void;
  closePOSSession: (actualCashCounted?: number) => void;

  // Extended Sales & Procurement Lifecycles
  addSalesQuotation: (qt: Omit<SalesQuotation, "id">) => void;
  convertQuotationToOrder: (quotationId: string) => { success: boolean; error?: string };
  addSalesOrder: (so: Omit<SalesOrder, "id">) => void;
  fulfillSalesOrderToInvoice: (salesOrderId: string, isPaid: boolean) => { success: boolean; error?: string };
  addDeliveryNote: (dn: Omit<DeliveryNote, "id">) => void;
  addSalesReturn: (ret: Omit<SalesReturn, "id" | "status" | "zatcaUuid">) => { success: boolean; error?: string };
  addPurchaseRequest: (pr: Omit<PurchaseRequest, "id">) => void;
  approvePurchaseRequestToPO: (prId: string, supplierId: string) => { success: boolean; error?: string };
  addPurchaseReturn: (ret: Omit<PurchaseReturn, "id" | "status">) => { success: boolean; error?: string };

  // Treasury, Fixed Assets, HR Payroll, CRM & Cost Centers
  addBankTransaction: (tx: Omit<BankTransaction, "id">, counterAccountId?: string) => { success: boolean; error?: string };
  addFixedAsset: (asset: Omit<FixedAsset, "id" | "accumulatedDepreciation" | "bookValue" | "status">) => void;
  runDepreciationCycle: (periodLabel: string) => { success: boolean; error?: string; totalDepreciated?: number };
  addEmployee: (emp: Omit<Employee, "id">) => void;
  processPayrollRun: (periodMonth: string, paymentMethod: "Bank" | "Cash") => { success: boolean; error?: string };
  addCrmLead: (lead: Omit<CrmLead, "id">) => void;
  updateCrmLeadStage: (id: string, stage: CrmLead["stage"]) => void;
  addCostCenter: (cc: Omit<CostCenter, "id">) => void;
  
  // Audits and Backups
  addAuditLog: (action: string, details: string, oldValue?: string, newValue?: string, reason?: string) => void;
  createBackup: () => void;
  resetToDefault: () => void;
  
  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  
  // Custom Coffee Roasting and Grinding Business Workflow State & Methods
  roasteryExpenses: RoasteryExpense[];
  grindingExpenses: GrindingExpense[];
  cashboxTransactions: CashboxTransaction[];
  customerMovements: CustomerMovement[];
  addRoasteryExpense: (e: Omit<RoasteryExpense, "id">) => void;
  deleteRoasteryExpense: (id: string) => void;
  addGrindingExpense: (e: Omit<GrindingExpense, "id">) => void;
  deleteGrindingExpense: (id: string) => void;
  addCashboxTransaction: (tx: Omit<CashboxTransaction, "id">) => void;
  deleteCashboxTransaction: (id: string) => void;
  addCustomerMovement: (m: Omit<CustomerMovement, "id">) => void;

  // CRUD entities
  addCustomer: (c: Omit<Customer, "id" | "balance">) => void;
  addSupplier: (s: Omit<Supplier, "id" | "balance">) => void;
  addItem: (i: Omit<Item, "id" | "currentStock">) => void;
  addAccount: (a: Omit<Account, "id" | "balance">) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  updateItem: (id: string, i: Partial<Item>) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteCustomer: (id: string) => void;
  deleteSupplier: (id: string) => void;
  deleteItem: (id: string) => void;
  deleteAccount: (id: string) => void;

  // RBAC Access Control
  permissionsByRole: Record<UserRole, { pages: string[]; actions: string[] }>;
  checkUserPermission: (page: string, action: string) => boolean;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or fall back to seed data
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem("novaro_accounts");
    if (saved) {
      const parsed: Account[] = JSON.parse(saved);
      if (!parsed.some(a => a.id === "acc-1320")) {
        parsed.push({
          id: "acc-1320",
          code: "1320",
          name: "Work in Progress (WIP)",
          nameAr: "مخزون تحت التشغيل (تحميص وطحن)",
          type: AccountType.Asset,
          balance: 0
        });
      }
      return parsed;
    }
    return initialAccounts;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem("novaro_warehouses");
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem("novaro_items");
    return saved ? JSON.parse(saved) : initialItems;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem("novaro_recipes");
    return saved ? JSON.parse(saved) : initialRecipes;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem("novaro_customers");
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem("novaro_suppliers");
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem("novaro_journal_entries");
    return saved ? JSON.parse(saved) : initialJournalEntries;
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem("novaro_batches");
    return saved ? JSON.parse(saved) : initialBatches;
  });

  const [roastingJobs, setRoastingJobs] = useState<RoastingJob[]>(() => {
    const saved = localStorage.getItem("novaro_roasting_jobs");
    return saved ? JSON.parse(saved) : initialRoastingJobs;
  });

  const [grindingJobs, setGrindingJobs] = useState<GrindingJob[]>(() => {
    const saved = localStorage.getItem("novaro_grinding_jobs");
    return saved ? JSON.parse(saved) : initialGrindingJobs;
  });

  const [packagingJobs, setPackagingJobs] = useState<PackagingJob[]>(() => {
    const saved = localStorage.getItem("novaro_packaging_jobs");
    return saved ? JSON.parse(saved) : initialPackagingJobs;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem("novaro_purchase_orders");
    return saved ? JSON.parse(saved) : initialPurchaseOrders;
  });

  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(() => {
    const saved = localStorage.getItem("novaro_sales_invoices");
    return saved ? JSON.parse(saved) : initialSalesInvoices;
  });

  const [posSessions, setPOSSessions] = useState<POSSession[]>(() => {
    const saved = localStorage.getItem("novaro_pos_sessions");
    return saved ? JSON.parse(saved) : initialPOSSessions;
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem("novaro_bank_transactions");
    return saved ? JSON.parse(saved) : initialBankTransactions;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("novaro_users");
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("novaro_audit_logs");
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [backups, setBackups] = useState<Backup[]>(() => {
    const saved = localStorage.getItem("novaro_backups");
    return saved ? JSON.parse(saved) : initialBackups;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem("novaro_current_user");
    return saved ? JSON.parse(saved) : initialUsers[0];
  });

  // Enterprise Core Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem("novaro_company_settings");
    return saved ? JSON.parse(saved) : {
      name: "Novaro Food Co.",
      nameAr: "نوفارو للمواد الغذائية والبن",
      commercialRegistration: "1010620392",
      taxNumber: "310492039200003",
      logo: "",
      address: "المنطقة الصناعية الثانية، الدمام، المملكة العربية السعودية",
      country: "Saudi Arabia",
      defaultLanguage: "ar",
      defaultCurrency: Currency.SAR,
      fiscalYear: "2026",
      taxConfiguration: { vatRate: 0.15 },
      invoiceFormat: "INV-{YYYY}-{SEQ}",
      receiptFormat: "REC-{YYYY}-{SEQ}",
      warehouseFormat: "WH-{SEQ}",
      barcodeSettings: { prefix: "628", length: 11 }
    };
  });

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(() => {
    const saved = localStorage.getItem("novaro_exchange_rates");
    return saved ? JSON.parse(saved) : [
      { id: "rate-1", date: "2026-07-09", from: Currency.USD, to: Currency.SAR, rate: 3.75 },
      { id: "rate-2", date: "2026-07-09", from: Currency.SAR, to: Currency.USD, rate: 0.267 },
      { id: "rate-3", date: "2026-07-09", from: Currency.USD, to: Currency.YER, rate: 250.0 },
      { id: "rate-4", date: "2026-07-09", from: Currency.SAR, to: Currency.YER, rate: 66.6 },
      { id: "rate-5", date: "2026-07-09", from: Currency.YER, to: Currency.SAR, rate: 0.015 },
      { id: "rate-6", date: "2026-07-09", from: Currency.YER, to: Currency.USD, rate: 0.004 }
    ];
  });

  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>(() => {
    const saved = localStorage.getItem("novaro_inventory_adjustments");
    return saved ? JSON.parse(saved) : [];
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem("novaro_stock_transfers");
    return saved ? JSON.parse(saved) : [];
  });

  const [recurringEntries, setRecurringEntries] = useState<RecurringEntry[]>(() => {
    const saved = localStorage.getItem("novaro_recurring_entries");
    return saved ? JSON.parse(saved) : [
      { id: "rec-1", name: "إيجار صالة المعرض الشهري المجدول", frequency: "Monthly", referenceEntryId: "JE-2026-0002", nextPostingDate: "2026-08-01", active: true }
    ];
  });

  const [roasteryExpenses, setRoasteryExpenses] = useState<RoasteryExpense[]>(() => {
    const saved = localStorage.getItem("novaro_roastery_expenses");
    return saved ? JSON.parse(saved) : [
      { id: "re-1", date: "2026-07-05", type: "شراء وقود غاز", amount: 450, notes: "شراء غاز للمحمصة الرئيسية" },
      { id: "re-2", date: "2026-07-08", type: "صيانة دورية", amount: 1200, notes: "صيانة محمص بروبات بريميوم" }
    ];
  });

  const [grindingExpenses, setGrindingExpenses] = useState<GrindingExpense[]>(() => {
    const saved = localStorage.getItem("novaro_grinding_expenses");
    return saved ? JSON.parse(saved) : [
      { id: "ge-1", date: "2026-07-06", type: "استهلاك طاقة كهربائية", amount: 600, notes: "فاتورة كهرباء تشغيل الطواحين الصناعية" },
      { id: "ge-2", date: "2026-07-09", type: "شراء قطع صيانة أحجار طحن", amount: 1800, notes: "استبدال شفرات المطحنة التركية" }
    ];
  });

  const [cashboxTransactions, setCashboxTransactions] = useState<CashboxTransaction[]>(() => {
    const saved = localStorage.getItem("novaro_cashbox_transactions");
    return saved ? JSON.parse(saved) : [
      { id: "tx-101", date: "2026-07-09", type: "receipt", amount: 3200, description: "توريد مبيعات يومية نقدي", category: "مبيعات", recipient: "أمين الصندوق الرئيسي", paymentMethod: "نقدي" },
      { id: "tx-102", date: "2026-07-09", type: "expense", amount: 150, description: "شراء مياه وضيافة للمحمصة", category: "مصروفات عامة", recipient: "موزع الضيافة", paymentMethod: "نقدي" }
    ];
  });

  const [customerMovements, setCustomerMovements] = useState<CustomerMovement[]>(() => {
    const saved = localStorage.getItem("novaro_customer_movements");
    return saved ? JSON.parse(saved) : [
      { id: "mov-1", customerId: "cust-1", date: "2026-07-01", type: "sale", amount: 24500, reference: "SI-2026-0001", notes: "فاتورة مبيعات آجل - أسواق العثيم" },
      { id: "mov-2", customerId: "cust-2", date: "2026-07-03", type: "sale", amount: 20500, reference: "SI-2026-0002", notes: "فاتورة مبيعات آجل - أسواق التميمي" }
    ];
  });

  // Foundation Hardening & Ledger-Derived Collections
  const [postingConfig, setPostingConfig] = useState<PostingAccountConfiguration>(() => {
    const saved = localStorage.getItem("novaro_posting_config");
    return saved ? JSON.parse(saved) : defaultPostingAccountConfiguration;
  });

  const [costLayers, setCostLayers] = useState<CostLayer[]>(() => {
    const saved = localStorage.getItem("novaro_cost_layers");
    if (saved) return JSON.parse(saved);
    return initialBatches.map(b => ({
      id: `layer-${b.id}`,
      batchId: b.id,
      batchNumber: b.batchNumber,
      itemId: b.itemId,
      warehouseId: b.warehouseId,
      receivedDate: b.manufactureDate,
      initialQuantity: b.quantity,
      remainingQuantity: b.quantity,
      unitCost: b.costPerUnit,
      currency: Currency.SAR,
      isExhausted: b.quantity <= 0,
      sourceDocumentType: "PurchaseOrder" as const,
      sourceDocumentId: "OB-2026"
    }));
  });

  const [stockMovements, setStockMovements] = useState<DomainStockMovement[]>(() => {
    const saved = localStorage.getItem("novaro_stock_movements");
    return saved ? JSON.parse(saved) : [];
  });

  const defaultFiscalPeriods: FiscalPeriod[] = [
    { id: "FP-2026-Q1", name: "الربع الأول 2026 (Q1)", code: "2026-Q1", fiscalYear: "2026", startDate: "2026-01-01", endDate: "2026-03-31", status: "OPEN", isClosed: false },
    { id: "FP-2026-Q2", name: "الربع الثاني 2026 (Q2)", code: "2026-Q2", fiscalYear: "2026", startDate: "2026-04-01", endDate: "2026-06-30", status: "OPEN", isClosed: false },
    { id: "FP-2026-Q3", name: "الربع الثالث 2026 (Q3)", code: "2026-Q3", fiscalYear: "2026", startDate: "2026-07-01", endDate: "2026-09-30", status: "OPEN", isClosed: false },
    { id: "FP-2026-Q4", name: "الربع الرابع 2026 (Q4)", code: "2026-Q4", fiscalYear: "2026", startDate: "2026-10-01", endDate: "2026-12-31", status: "OPEN", isClosed: false }
  ];

  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>(() => {
    const saved = localStorage.getItem("novaro_fiscal_periods");
    if (saved) {
      const parsed: FiscalPeriod[] = JSON.parse(saved);
      return parsed.map((fp, idx) => ({
        ...defaultFiscalPeriods[idx],
        ...fp,
        name: fp.name || fp.code || `Period ${idx + 1}`,
        status: fp.isClosed || fp.status === "CLOSED" || fp.status === "LOCKED" || fp.status === "Closed" || fp.status === "Locked" ? "CLOSED" : "OPEN",
        isClosed: Boolean(fp.isClosed || fp.status === "CLOSED" || fp.status === "LOCKED" || fp.status === "Closed" || fp.status === "Locked")
      }));
    }
    return defaultFiscalPeriods;
  });

  const [supplierMovements, setSupplierMovements] = useState<DomainSupplierMovement[]>(() => {
    const saved = localStorage.getItem("novaro_supplier_movements");
    return saved ? JSON.parse(saved) : [];
  });

  // Extended Enterprise Collections
  const [zatcaRecords, setZatcaRecords] = useState<ZatcaDocumentRecord[]>(() => {
    const saved = localStorage.getItem("novaro_zatca_records");
    if (saved) return JSON.parse(saved);
    // Generate initial ZATCA record for seed invoice SI-2026-0001
    const seedInv = initialSalesInvoices[0];
    const stamp = ZatcaEngine.generateStamp({
      invoiceId: seedInv.id,
      documentType: "SalesInvoice",
      invoiceTypeCode: "388",
      subType: "0100000",
      sellerName: "نوفارو للمواد الغذائية والبن",
      vatNumber: "310492039200003",
      issueTimestamp: "2026-07-08T10:15:00Z",
      subtotal: 6391.30,
      vatAmount: 958.70,
      totalAmount: 7350.00,
      currency: "SAR",
      customerName: seedInv.customerName,
      icv: 1,
      previousInvoiceHash: ZATCA_GENESIS_PIH,
      items: seedInv.items
    });
    return [
      {
        id: "ZATCA-0001",
        documentId: seedInv.id,
        documentType: "SalesInvoice",
        invoiceTypeCode: "388",
        subType: "0100000",
        uuid: stamp.uuid,
        icv: 1,
        previousInvoiceHash: stamp.previousInvoiceHash,
        invoiceHash: stamp.invoiceHash,
        invoiceHashHex: stamp.invoiceHashHex,
        digitalSignature: stamp.digitalSignature,
        publicKeyStamp: stamp.publicKeyStamp,
        tlvBase64: stamp.tlvBase64,
        xmlContent: stamp.xmlContent,
        sellerName: "نوفارو للمواد الغذائية والبن",
        vatNumber: "310492039200003",
        customerName: seedInv.customerName,
        issueTimestamp: "2026-07-08T10:15:00Z",
        subtotal: 6391.30,
        vatAmount: 958.70,
        totalAmount: 7350.00,
        status: "CLEARED"
      }
    ];
  });

  const [salesQuotations, setSalesQuotations] = useState<SalesQuotation[]>(() => {
    const saved = localStorage.getItem("novaro_sales_quotations");
    return saved ? JSON.parse(saved) : initialSalesQuotations;
  });

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
    const saved = localStorage.getItem("novaro_sales_orders");
    return saved ? JSON.parse(saved) : initialSalesOrders;
  });

  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(() => {
    const saved = localStorage.getItem("novaro_delivery_notes");
    return saved ? JSON.parse(saved) : initialDeliveryNotes;
  });

  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem("novaro_sales_returns");
    return saved ? JSON.parse(saved) : initialSalesReturns;
  });

  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem("novaro_purchase_requests");
    return saved ? JSON.parse(saved) : initialPurchaseRequests;
  });

  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    const saved = localStorage.getItem("novaro_purchase_returns");
    return saved ? JSON.parse(saved) : initialPurchaseReturns;
  });

  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(() => {
    const saved = localStorage.getItem("novaro_fixed_assets");
    return saved ? JSON.parse(saved) : initialFixedAssets;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem("novaro_employees");
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => {
    const saved = localStorage.getItem("novaro_payroll_runs");
    return saved ? JSON.parse(saved) : initialPayrollRuns;
  });

  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(() => {
    const saved = localStorage.getItem("novaro_crm_leads");
    return saved ? JSON.parse(saved) : initialCrmLeads;
  });

  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => {
    const saved = localStorage.getItem("novaro_cost_centers");
    return saved ? JSON.parse(saved) : initialCostCenters;
  });

  // Sync to local storage when state changes
  useEffect(() => { localStorage.setItem("novaro_accounts", JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem("novaro_warehouses", JSON.stringify(warehouses)); }, [warehouses]);
  useEffect(() => { localStorage.setItem("novaro_items", JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem("novaro_recipes", JSON.stringify(recipes)); }, [recipes]);
  useEffect(() => { localStorage.setItem("novaro_customers", JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem("novaro_suppliers", JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem("novaro_journal_entries", JSON.stringify(journalEntries)); }, [journalEntries]);
  useEffect(() => { localStorage.setItem("novaro_batches", JSON.stringify(batches)); }, [batches]);
  useEffect(() => { localStorage.setItem("novaro_roasting_jobs", JSON.stringify(roastingJobs)); }, [roastingJobs]);
  useEffect(() => { localStorage.setItem("novaro_grinding_jobs", JSON.stringify(grindingJobs)); }, [grindingJobs]);
  useEffect(() => { localStorage.setItem("novaro_packaging_jobs", JSON.stringify(packagingJobs)); }, [packagingJobs]);
  useEffect(() => { localStorage.setItem("novaro_purchase_orders", JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem("novaro_sales_invoices", JSON.stringify(salesInvoices)); }, [salesInvoices]);
  useEffect(() => { localStorage.setItem("novaro_pos_sessions", JSON.stringify(posSessions)); }, [posSessions]);
  useEffect(() => { localStorage.setItem("novaro_bank_transactions", JSON.stringify(bankTransactions)); }, [bankTransactions]);
  useEffect(() => { localStorage.setItem("novaro_users", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("novaro_audit_logs", JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem("novaro_backups", JSON.stringify(backups)); }, [backups]);
  useEffect(() => { localStorage.setItem("novaro_current_user", JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem("novaro_company_settings", JSON.stringify(companySettings)); }, [companySettings]);
  useEffect(() => { localStorage.setItem("novaro_exchange_rates", JSON.stringify(exchangeRates)); }, [exchangeRates]);
  useEffect(() => { localStorage.setItem("novaro_inventory_adjustments", JSON.stringify(inventoryAdjustments)); }, [inventoryAdjustments]);
  useEffect(() => { localStorage.setItem("novaro_stock_transfers", JSON.stringify(stockTransfers)); }, [stockTransfers]);
  useEffect(() => { localStorage.setItem("novaro_recurring_entries", JSON.stringify(recurringEntries)); }, [recurringEntries]);
  useEffect(() => { localStorage.setItem("novaro_roastery_expenses", JSON.stringify(roasteryExpenses)); }, [roasteryExpenses]);
  useEffect(() => { localStorage.setItem("novaro_grinding_expenses", JSON.stringify(grindingExpenses)); }, [grindingExpenses]);
  useEffect(() => { localStorage.setItem("novaro_cashbox_transactions", JSON.stringify(cashboxTransactions)); }, [cashboxTransactions]);
  useEffect(() => { localStorage.setItem("novaro_customer_movements", JSON.stringify(customerMovements)); }, [customerMovements]);
  useEffect(() => { localStorage.setItem("novaro_posting_config", JSON.stringify(postingConfig)); }, [postingConfig]);
  useEffect(() => { localStorage.setItem("novaro_cost_layers", JSON.stringify(costLayers)); }, [costLayers]);
  useEffect(() => { localStorage.setItem("novaro_stock_movements", JSON.stringify(stockMovements)); }, [stockMovements]);
  useEffect(() => { localStorage.setItem("novaro_fiscal_periods", JSON.stringify(fiscalPeriods)); }, [fiscalPeriods]);
  useEffect(() => { localStorage.setItem("novaro_supplier_movements", JSON.stringify(supplierMovements)); }, [supplierMovements]);
  useEffect(() => { localStorage.setItem("novaro_zatca_records", JSON.stringify(zatcaRecords)); }, [zatcaRecords]);
  useEffect(() => { localStorage.setItem("novaro_sales_quotations", JSON.stringify(salesQuotations)); }, [salesQuotations]);
  useEffect(() => { localStorage.setItem("novaro_sales_orders", JSON.stringify(salesOrders)); }, [salesOrders]);
  useEffect(() => { localStorage.setItem("novaro_delivery_notes", JSON.stringify(deliveryNotes)); }, [deliveryNotes]);
  useEffect(() => { localStorage.setItem("novaro_sales_returns", JSON.stringify(salesReturns)); }, [salesReturns]);
  useEffect(() => { localStorage.setItem("novaro_purchase_requests", JSON.stringify(purchaseRequests)); }, [purchaseRequests]);
  useEffect(() => { localStorage.setItem("novaro_purchase_returns", JSON.stringify(purchaseReturns)); }, [purchaseReturns]);
  useEffect(() => { localStorage.setItem("novaro_fixed_assets", JSON.stringify(fixedAssets)); }, [fixedAssets]);
  useEffect(() => { localStorage.setItem("novaro_employees", JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem("novaro_payroll_runs", JSON.stringify(payrollRuns)); }, [payrollRuns]);
  useEffect(() => { localStorage.setItem("novaro_crm_leads", JSON.stringify(crmLeads)); }, [crmLeads]);
  useEffect(() => { localStorage.setItem("novaro_cost_centers", JSON.stringify(costCenters)); }, [costCenters]);

  // Recalculate account balances based on journal entries via AccountingEngine
  useEffect(() => {
    const updatedAccounts = AccountingEngine.calculateAllAccountBalances(accounts, journalEntries);
    const hasChanged = JSON.stringify(updatedAccounts) !== JSON.stringify(accounts);
    if (hasChanged) {
      setAccounts(updatedAccounts);
    }
  }, [journalEntries]);

  // Recalculate Item Stocks based on inventory batches via InventoryEngine
  useEffect(() => {
    const updatedItems = InventoryEngine.calculateItemStockBalances(items, batches);
    const hasChanged = JSON.stringify(updatedItems) !== JSON.stringify(items);
    if (hasChanged) {
      setItems(updatedItems);
    }
  }, [batches]);

  // Helper: Create Audit Log
  const addAuditLog = (action: string, details: string, oldValue?: string, newValue?: string, reason?: string) => {
    const newLog: AuditLog = {
      id: `log-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      action,
      details,
      oldValue,
      newValue,
      reason
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper: Append ZATCA Cryptographic Record to Chain
  const issueZatcaDocument = (params: {
    documentId: string;
    documentType: ZatcaDocumentRecord["documentType"];
    invoiceTypeCode: ZatcaDocumentRecord["invoiceTypeCode"];
    subType: ZatcaDocumentRecord["subType"];
    customerName: string;
    subtotal: number;
    vatAmount: number;
    totalAmount: number;
    items: { itemId: string; itemName: string; quantity: number; price: number; total: number }[];
  }): ZatcaDocumentRecord => {
    const nextIcv = zatcaRecords.length > 0 ? Math.max(...zatcaRecords.map(r => r.icv)) + 1 : 1;
    const prevHash = zatcaRecords.length > 0 ? zatcaRecords[0].invoiceHash : ZATCA_GENESIS_PIH;
    const issueTimestamp = new Date().toISOString().split(".")[0] + "Z";
    const sellerName = companySettings.nameAr || "نوفارو للمواد الغذائية والبن";
    const vatNumber = companySettings.taxNumber || "310492039200003";

    const stamp = ZatcaEngine.generateStamp({
      invoiceId: params.documentId,
      documentType: params.documentType,
      invoiceTypeCode: params.invoiceTypeCode,
      subType: params.subType,
      sellerName,
      vatNumber,
      issueTimestamp,
      subtotal: params.subtotal,
      vatAmount: params.vatAmount,
      totalAmount: params.totalAmount,
      currency: "SAR",
      customerName: params.customerName,
      icv: nextIcv,
      previousInvoiceHash: prevHash,
      items: params.items
    });

    const record: ZatcaDocumentRecord = {
      id: `ZATCA-${String(nextIcv).padStart(4, "0")}`,
      documentId: params.documentId,
      documentType: params.documentType,
      invoiceTypeCode: params.invoiceTypeCode,
      subType: params.subType,
      uuid: stamp.uuid,
      icv: nextIcv,
      previousInvoiceHash: stamp.previousInvoiceHash,
      invoiceHash: stamp.invoiceHash,
      invoiceHashHex: stamp.invoiceHashHex,
      digitalSignature: stamp.digitalSignature,
      publicKeyStamp: stamp.publicKeyStamp,
      tlvBase64: stamp.tlvBase64,
      xmlContent: stamp.xmlContent,
      sellerName,
      vatNumber,
      customerName: params.customerName,
      issueTimestamp,
      subtotal: params.subtotal,
      vatAmount: params.vatAmount,
      totalAmount: params.totalAmount,
      status: params.subType === "0100000" ? "CLEARED" : "REPORTED"
    };

    setZatcaRecords(prev => [record, ...prev]);
    return record;
  };

  // 1. Post Journal Entry (Double-Entry Bookkeeping Rules enforced by AccountingEngine)
  const postJournalEntry = (entry: Omit<JournalEntry, "id" | "posted">) => {
    const postResult = AccountingEngine.postEntry(entry, journalEntries, fiscalPeriods);
    if (!postResult.success || !postResult.entry) {
      return { success: false, error: postResult.error || "Journal entry posting failed." };
    }

    setJournalEntries(prev => [postResult.entry!, ...prev]);
    const totalDebit = postResult.entry.items.reduce((acc, item) => acc + item.debit, 0);
    addAuditLog("Post Journal Entry", `Posted double-entry voucher ${postResult.entry.id} (Total: SAR ${totalDebit.toFixed(2)}) - ${entry.notes}`);
    
    return { success: true };
  };

  // Reverse Journal Entry (Enforced by AccountingEngine & FiscalPeriod Lock)
  const reverseJournalEntry = (entryId: string, reason: string) => {
    const reversalResult = AccountingEngine.reverseEntry(
      entryId,
      journalEntries,
      reason,
      undefined,
      currentUser.username,
      fiscalPeriods
    );
    if (!reversalResult.success || !reversalResult.reversalEntry) {
      return { success: false, error: reversalResult.error || "Journal entry reversal failed." };
    }

    setJournalEntries(prev => [
      reversalResult.reversalEntry!,
      ...prev.map(j => j.id === entryId ? { ...j, workflowStatus: "Cancelled" as const } : j)
    ]);

    addAuditLog(
      "Reverse Journal Entry", 
      `Successfully reversed journal voucher ${entryId} via balanced reversal voucher ${reversalResult.reversalEntry.id}.`, 
      "Posted", 
      "Cancelled", 
      reason
    );

    return { success: true };
  };

  // Recurring entry formula creators
  const addRecurringEntry = (rec: Omit<RecurringEntry, "id" | "nextPostingDate">) => {
    const newEntry: RecurringEntry = {
      ...rec,
      id: `rec-${Math.floor(100 + Math.random() * 900)}`,
      nextPostingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0]
    };
    setRecurringEntries(prev => [...prev, newEntry]);
    addAuditLog("Create Recurring Entry", `Setup scheduled posting template ${rec.name} frequency ${rec.frequency}`);
  };

  const postRecurringEntry = (id: string) => {
    const rec = recurringEntries.find(r => r.id === id);
    if (!rec) return { success: false, error: "Scheduled item formula not found." };
    if (!rec.active) return { success: false, error: "Formula is marked inactive." };

    const refEntry = journalEntries.find(j => j.id === rec.referenceEntryId);
    if (!refEntry) return { success: false, error: "Template reference voucher not found." };

    const today = new Date().toISOString().split("T")[0];
    const duplicatedItems = refEntry.items.map(item => ({
      ...item,
      id: `jei-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: `Recurring automatic allocation - ${item.notes || ""}`
    }));

    const result = postJournalEntry({
      date: today,
      reference: `REC-${rec.id}`,
      notes: `قيد مكرر تلقائي: ${rec.name}`,
      items: duplicatedItems,
      workflowStatus: "Posted",
      currency: refEntry.currency || Currency.SAR,
      exchangeRate: refEntry.exchangeRate || 1
    });

    if (result.success) {
      const nextDate = new Date();
      if (rec.frequency === "Monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (rec.frequency === "Weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (rec.frequency === "Quarterly") {
        nextDate.setMonth(nextDate.getMonth() + 3);
      }
      
      setRecurringEntries(prev => prev.map(r => {
        if (r.id === id) {
          return { ...r, nextPostingDate: nextDate.toISOString().split("T")[0] };
        }
        return r;
      }));
    }

    return result;
  };

  // Toggle Fiscal Period Lock
  const toggleFiscalPeriodLock = (periodId: string) => {
    setFiscalPeriods(prev => prev.map(fp => {
      if (fp.id === periodId) {
        const nextClosed = !fp.isClosed;
        addAuditLog(
          "Fiscal Period Lock",
          `${nextClosed ? "Locked" : "Unlocked"} fiscal period ${fp.code || fp.id}`,
          fp.isClosed ? "Closed" : "Open",
          nextClosed ? "Closed" : "Open"
        );
        return {
          ...fp,
          isClosed: nextClosed,
          status: nextClosed ? "CLOSED" : "OPEN",
          closedAt: nextClosed ? new Date().toISOString() : undefined
        };
      }
      return fp;
    }));
  };

  // Fiscal Year Closing
  const fiscalYearClosing = (closingNotes: string) => {
    const incomeAccounts = accounts.filter(a => a.type === AccountType.Income);
    const expenseAccounts = accounts.filter(a => a.type === AccountType.Expense);

    const totalIncome = incomeAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalExpense = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
    const netSurplus = totalIncome - totalExpense;

    if (netSurplus === 0 && totalIncome === 0 && totalExpense === 0) {
      return { success: false, error: "No earnings/loss to close for the current fiscal period." };
    }

    const jeLineItems: any[] = [];

    incomeAccounts.forEach(acc => {
      if (Math.abs(acc.balance) > 0.001) {
        jeLineItems.push({
          id: `jei-${Math.random()}`,
          accountId: acc.id,
          accountName: acc.name,
          debit: acc.balance > 0 ? acc.balance : 0,
          credit: acc.balance < 0 ? Math.abs(acc.balance) : 0,
          notes: "إغلاق أرصدة الإيرادات السنوية"
        });
      }
    });

    expenseAccounts.forEach(acc => {
      if (Math.abs(acc.balance) > 0.001) {
        jeLineItems.push({
          id: `jei-${Math.random()}`,
          accountId: acc.id,
          accountName: acc.name,
          debit: acc.balance < 0 ? Math.abs(acc.balance) : 0,
          credit: acc.balance > 0 ? acc.balance : 0,
          notes: "إغلاق أرصدة المصاريف السنوية"
        });
      }
    });

    if (Math.abs(netSurplus) > 0.001) {
      jeLineItems.push({
        id: `jei-earnings`,
        accountId: "acc-3100",
        accountName: "Retained Earnings",
        debit: netSurplus < 0 ? Math.abs(netSurplus) : 0,
        credit: netSurplus > 0 ? netSurplus : 0,
        notes: netSurplus > 0 ? "قيد ترحيل الأرباح السنوية المحققة للمركز المالي" : "قيد ترحيل الخسائر السنوية المحققة للمركز المالي"
      });
    }

    const result = postJournalEntry({
      date: new Date().toISOString().split("T")[0],
      reference: "YEAR-CLOSE-2026",
      notes: `إقفال الفترة المالية السنوية وإثبات الأرباح المبقاة: ${closingNotes}`,
      items: jeLineItems,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1
    });

    if (result.success) {
      addAuditLog("Fiscal Year Closing", "Issued balanced Closing Voucher to seal income statements and carry retained earnings to Balance Sheet.", "Open", "Closed", closingNotes);
    }

    return result;
  };

  // Add / Delete BOM Recipe
  const addRecipe = (recipe: Omit<Recipe, "id">) => {
    const newRec: Recipe = {
      ...recipe,
      id: `rec-${Date.now().toString().slice(-4)}`
    };
    setRecipes(prev => [newRec, ...prev]);
    addAuditLog("BOM Recipe Created", `Created manufacturing recipe ${recipe.nameAr} (${recipe.name})`);
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    addAuditLog("BOM Recipe Deleted", `Removed recipe ${id}`);
  };

  // 2. Add Roasting Job (Delegates to ManufacturingEngine with atomic inventory & layer updates)
  const addRoastingJob = (job: Omit<RoastingJob, "id" | "weightLossPct">) => {
    const res = ManufacturingEngine.executeRoasting(
      {
        batchNumber: job.batchNumber,
        recipeId: job.recipeId,
        recipeName: job.recipeName,
        inputItemId: job.inputItemId,
        inputQuantity: job.inputQuantity,
        outputItemId: job.outputItemId,
        outputQuantity: job.outputQuantity,
        roastTimeMinutes: job.roastTimeMinutes,
        tempCelsius: job.tempCelsius,
        workerName: job.workerName,
        jobDate: job.jobDate,
        roastProfile: job.roastProfile,
        operator: job.operator
      },
      items,
      batches,
      costLayers,
      stockMovements
    );

    if (!res.success || !res.job || !res.batches || !res.layers || !res.movements) {
      return { success: false, error: res.error || "Roasting operation failed." };
    }

    setBatches(res.batches);
    setCostLayers(res.layers);
    setStockMovements(res.movements);
    setRoastingJobs(prev => [res.job!, ...prev]);

    const inputItem = items.find(i => i.id === job.inputItemId);
    const outputItem = items.find(i => i.id === job.outputItemId);
    const estValue = Math.round((inputItem?.cost || 25) * job.inputQuantity * 100) / 100;
    if (estValue > 0) {
      postJournalEntry({
        date: job.jobDate || new Date().toISOString().split("T")[0],
        reference: res.job.id,
        notes: `تحويل مخزون خام إلى تحت التشغيل/محمص (${job.batchNumber})`,
        workflowStatus: "Posted",
        currency: Currency.SAR,
        exchangeRate: 1,
        items: [
          { id: `jei-rst-dr-${Date.now()}`, accountId: postingConfig.wipInventoryAccountId, accountName: "Work in Progress (WIP)", debit: estValue, credit: 0 },
          { id: `jei-rst-cr-${Date.now()}`, accountId: postingConfig.rawMaterialsInventoryAccountId, accountName: "Raw Material Stock", debit: 0, credit: estValue }
        ]
      });
    }

    addAuditLog("Roasting Job", `Completed Roasting Job ${res.job.id}. Roasted ${job.inputQuantity}kg of ${inputItem?.name} into ${job.outputQuantity}kg of ${outputItem?.name}.`);

    return { success: true };
  };

  // 3. Add Grinding Job (Delegates to ManufacturingEngine with atomic inventory & layer updates)
  const addGrindingJob = (job: Omit<GrindingJob, "id">) => {
    const res = ManufacturingEngine.executeGrinding(
      {
        jobDate: job.jobDate,
        inputBatchNumber: job.inputBatchNumber,
        inputItemId: job.inputItemId,
        inputQuantity: job.inputQuantity,
        outputItemId: job.outputItemId,
        outputQuantity: job.outputQuantity,
        finenessSetting: job.finenessSetting,
        operator: job.operator
      },
      items,
      batches,
      costLayers,
      stockMovements
    );

    if (!res.success || !res.job || !res.batches || !res.layers || !res.movements) {
      return { success: false, error: res.error || "Grinding operation failed." };
    }

    setBatches(res.batches);
    setCostLayers(res.layers);
    setStockMovements(res.movements);
    setGrindingJobs(prev => [res.job!, ...prev]);

    addAuditLog("Grinding Job", `Grinding Job ${res.job.id} Completed: Ground ${job.inputQuantity}kg beans into ${job.outputQuantity}kg ground powder.`);

    return { success: true };
  };

  // 4. Add Packaging Job (Deduct ground powder + bags/pouches, add final retail product & GL entry)
  const addPackagingJob = (job: Omit<PackagingJob, "id">) => {
    const powderBatchIndex = batches.findIndex(b => b.batchNumber === job.inputBatchNumber && b.itemId === job.inputItemId);
    if (powderBatchIndex === -1) {
      return { success: false, error: `التشغيلة المدخلة '${job.inputBatchNumber}' غير صحيحة.` };
    }
    const powderBatch = batches[powderBatchIndex];
    if (powderBatch.quantity < job.inputQuantity) {
      return { success: false, error: `كمية المسحوق بالمشغل غير كافية. المتاح: ${powderBatch.quantity} كغم.` };
    }

    const pkgItemIndex = items.findIndex(i => i.id === job.packagingItemId);
    if (pkgItemIndex === -1) {
      return { success: false, error: "رمز مواد التعبئة غير مسجل بكتالوج المواد." };
    }
    const pkgItem = items[pkgItemIndex];
    if (pkgItem.currentStock < job.packagingQtyUsed) {
      return { success: false, error: `رصيد مواد التغليف غير كافٍ. المتوفر: ${pkgItem.currentStock} كيس، المطلوب: ${job.packagingQtyUsed} كيس.` };
    }

    // Deduct packaging pouch from FIFO batches
    let remainingPkg = job.packagingQtyUsed;
    let updatedBatches = batches.map(b => {
      if (b.itemId === job.packagingItemId && b.quantity > 0 && remainingPkg > 0) {
        if (b.quantity >= remainingPkg) {
          const qty = b.quantity - remainingPkg;
          remainingPkg = 0;
          return { ...b, quantity: parseFloat(qty.toFixed(3)) };
        } else {
          remainingPkg -= b.quantity;
          return { ...b, quantity: 0 };
        }
      }
      return b;
    });

    // Deduct ground powder from its batch
    updatedBatches = updatedBatches.map((b, idx) => {
      if (idx === powderBatchIndex) {
        return { ...b, quantity: parseFloat((b.quantity - job.inputQuantity).toFixed(3)) };
      }
      return b;
    });

    const finishedItem = items.find(i => i.id === job.finishedItemId);
    const totalBatchValue = Math.round(((powderBatch.costPerUnit * job.inputQuantity) + (pkgItem.cost * job.packagingQtyUsed)) * 100) / 100;
    const unitCost = parseFloat((totalBatchValue / job.finishedQty).toFixed(2));
    const newBatchId = `bat-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBatchNumber = `P-${job.inputBatchNumber}`;

    const finalPacksBatch: Batch = {
      id: newBatchId,
      batchNumber: newBatchNumber,
      itemId: job.finishedItemId,
      itemName: finishedItem?.name || "",
      manufactureDate: job.jobDate,
      expiryDate: powderBatch.expiryDate,
      quantity: job.finishedQty,
      costPerUnit: unitCost,
      warehouseId: "wh-3"
    };

    const newLayer: CostLayer = {
      id: `layer-${newBatchId}`,
      batchId: newBatchId,
      batchNumber: newBatchNumber,
      itemId: job.finishedItemId,
      warehouseId: "wh-3",
      receivedDate: job.jobDate,
      initialQuantity: job.finishedQty,
      remainingQuantity: job.finishedQty,
      unitCost,
      currency: Currency.SAR,
      isExhausted: false,
      sourceDocumentType: "ProductionOrder",
      sourceDocumentId: newBatchNumber
    };

    const jobId = `PKG-JOB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPkgJob: PackagingJob = {
      ...job,
      id: jobId,
      status: JobStatus.Completed
    };

    setBatches([...updatedBatches, finalPacksBatch]);
    setCostLayers(prev => [...prev, newLayer]);
    setPackagingJobs(prev => [newPkgJob, ...prev]);

    if (totalBatchValue > 0) {
      postJournalEntry({
        date: job.jobDate || new Date().toISOString().split("T")[0],
        reference: jobId,
        notes: `استلام إنتاج تام معبأ للمستودع (${finishedItem?.nameAr || finishedItem?.name})`,
        workflowStatus: "Posted",
        currency: Currency.SAR,
        exchangeRate: 1,
        items: [
          { id: `jei-pkg-dr-${Date.now()}`, accountId: postingConfig.finishedGoodsInventoryAccountId, accountName: "Finished Product Stock", debit: totalBatchValue, credit: 0 },
          { id: `jei-pkg-cr-${Date.now()}`, accountId: postingConfig.wipInventoryAccountId, accountName: "Work in Progress (WIP)", debit: 0, credit: totalBatchValue }
        ]
      });
    }

    addAuditLog("Packaging Job", `Packaging Job ${jobId} Completed: Blended & Packaged ${job.inputQuantity}kg powder into ${job.finishedQty} retail pouches of ${finishedItem?.name}.`);
    
    return { success: true };
  };

  // Costing calculations dynamic formula
  const calculateProductionCost = (
    recipeId: string, 
    extra: { labor: number; electricity: number; fuel: number; machine: number; extraPackaging: number },
    inputQty: number,
    outputQty: number
  ) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
      return {
        rawCost: 0, roastingCost: 0, grindingCost: 0, packagingCost: 0,
        laborCost: extra.labor, machineCost: extra.machine, electricityCost: extra.electricity, fuelCost: extra.fuel,
        wastePct: 0, yieldPct: 100, finalCostPerUnit: 0, totalCost: 0
      };
    }

    let rawCost = 0;
    recipe.rawMaterials.forEach(rm => {
      const item = items.find(i => i.id === rm.itemId);
      const itemCost = item?.cost || 0;
      rawCost += itemCost * rm.quantity * (inputQty || 1);
    });

    const laborCost = extra.labor;
    const electricityCost = extra.electricity;
    const fuelCost = extra.fuel;
    const machineCost = extra.machine;
    const packagingCost = extra.extraPackaging;

    const totalCost = rawCost + laborCost + electricityCost + fuelCost + machineCost + packagingCost;
    const finalCostPerUnit = outputQty > 0 ? parseFloat((totalCost / outputQty).toFixed(2)) : 0;

    const wasteQty = Math.max(0, inputQty - outputQty);
    const wastePct = inputQty > 0 ? parseFloat(((wasteQty / inputQty) * 100).toFixed(2)) : 0;
    const yieldPct = inputQty > 0 ? parseFloat(((outputQty / inputQty) * 100).toFixed(2)) : 100;

    return {
      rawCost: parseFloat(rawCost.toFixed(2)),
      roastingCost: parseFloat((laborCost + fuelCost + machineCost).toFixed(2)),
      grindingCost: parseFloat((electricityCost + machineCost).toFixed(2)),
      packagingCost: parseFloat(packagingCost.toFixed(2)),
      laborCost,
      machineCost,
      electricityCost,
      fuelCost,
      wastePct,
      yieldPct,
      finalCostPerUnit,
      totalCost: parseFloat(totalCost.toFixed(2))
    };
  };

  // 5. Add Purchase Order (SRM Procurement)
  const addPurchaseOrder = (po: Omit<PurchaseOrder, "id">) => {
    const poId = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPO: PurchaseOrder = {
      ...po,
      id: poId,
      workflowStatus: "Draft"
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    addAuditLog("Create Purchase Order", `Created purchase order ${poId} for supplier ${po.supplierName} (Total: SAR ${po.totalAmount})`);
  };

  // 6. Receive Purchase Order (Delegates to CommerceService with atomic stock & GL postings)
  const receivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return { success: false, error: "Purchase Order not found." };
    if (po.status === "Received") return { success: false, error: "Purchase Order has already been received." };

    const res = CommerceService.processPurchaseReceipt({
      dto: {
        purchaseOrder: po,
        actor: currentUser.username || "system"
      },
      config: postingConfig,
      batches,
      costLayers,
      stockMovements,
      journalEntries,
      suppliers,
      supplierMovements,
      fiscalPeriods,
      getAccountName: (id: string) => accounts.find(a => a.id === id)?.name || "Account"
    });

    if (!res.success || !res.data) {
      return { success: false, error: res.error || "Purchase receipt failed." };
    }

    setPurchaseOrders(prev => prev.map(p => p.id === poId ? res.data!.purchaseOrder : p));
    setBatches(res.data.batches);
    setCostLayers(res.data.costLayers);
    setStockMovements(res.data.stockMovements);
    setJournalEntries(res.data.journalEntries);
    setSupplierMovements(res.data.supplierMovements);
    setSuppliers(prev => prev.map(s => {
      if (s.id === po.supplierId) {
        return { ...s, balance: s.balance + po.totalAmount };
      }
      return s;
    }));

    addAuditLog("Receive Purchase Order", `Received Goods for ${po.id}. Created inventory batches and processed matching General Ledger entries.`);
    return { success: true };
  };

  // 7. Add Sales Invoice (Delegates to CommerceService with atomic FIFO valuation, COGS, AR ledger, and ZATCA Stamp)
  const addSalesInvoice = (invoice: Omit<SalesInvoice, "id" | "date">, type: "Wholesale" | "Retail" | "POS") => {
    const isPaid = invoice.status === "Paid";
    const subtotal = invoice.subtotal !== undefined
      ? invoice.subtotal
      : Math.round((invoice.totalAmount / 1.15) * 100) / 100;
    const taxAmount = invoice.taxAmount !== undefined
      ? invoice.taxAmount
      : Math.round((invoice.totalAmount - subtotal) * 100) / 100;

    const res = CommerceService.processSalesInvoice({
      dto: {
        invoice: {
          ...invoice,
          subtotal,
          taxAmount,
          date: new Date().toISOString().split("T")[0]
        },
        type,
        isPaid,
        actor: currentUser.username || "system"
      },
      config: postingConfig,
      batches,
      costLayers,
      stockMovements,
      journalEntries,
      customers,
      customerMovements,
      fiscalPeriods,
      getAccountName: (id: string) => accounts.find(a => a.id === id)?.name || "Account"
    });

    if (!res.success || !res.data) {
      return { success: false, error: res.error || "Sales invoice processing failed." };
    }

    setBatches(res.data.batches);
    setCostLayers(res.data.costLayers);
    setStockMovements(res.data.stockMovements);
    setJournalEntries(res.data.journalEntries);
    setCustomerMovements(res.data.customerMovements);
    setSalesInvoices(prev => [res.data!.invoice, ...prev]);

    if (!isPaid) {
      setCustomers(prev => prev.map(c => {
        if (c.id === invoice.customerId) {
          return { ...c, balance: c.balance + invoice.totalAmount };
        }
        return c;
      }));
      setCustomerMovements(prev => [
        {
          id: `mov-${Date.now()}`,
          customerId: invoice.customerId,
          date: res.data!.invoice.date,
          type: "sale",
          amount: invoice.totalAmount,
          reference: res.data!.invoice.id,
          notes: `فاتورة مبيعات آجل (${type})`
        },
        ...prev
      ]);
    } else {
      const newTx: BankTransaction = {
        id: `tx-${Math.floor(100000 + Math.random() * 900000)}`,
        date: res.data.invoice.date,
        type: "Deposit",
        amount: invoice.totalAmount,
        description: `Customer payment received for Sales Invoice ${res.data.invoice.id}`,
        accountName: type === "POS" ? "Cash" : "Al-Rajhi Bank"
      };
      setBankTransactions(prev => [newTx, ...prev]);
    }

    if (type === "POS") {
      setPOSSessions(prev => prev.map(sess => {
        if (sess.status === "Open") {
          return {
            ...sess,
            salesCount: sess.salesCount + 1,
            totalCashSales: sess.totalCashSales + invoice.totalAmount
          };
        }
        return sess;
      }));
    }

    // Automatically issue ZATCA Phase 1 & Phase 2 cryptographic stamp
    issueZatcaDocument({
      documentId: res.data.invoice.id,
      documentType: type === "POS" ? "POSReceipt" : "SalesInvoice",
      invoiceTypeCode: "388",
      subType: type === "POS" ? "0200000" : "0100000",
      customerName: invoice.customerName,
      subtotal,
      vatAmount: taxAmount,
      totalAmount: invoice.totalAmount,
      items: invoice.items
    });

    addAuditLog("Sales Invoice", `Dispatched Sales Invoice ${res.data.invoice.id} (${type}) with ZATCA Stamp. Deducted warehouse lots, posted matching COGS SAR ${res.data.totalCOGS.toFixed(2)}.`);
    return { success: true, invoiceId: res.data.invoice.id };
  };

  // 8. Open POS Session
  const openPOSSession = (startingCash: number) => {
    const newSession: POSSession = {
      id: `pos-${Math.floor(100 + Math.random() * 900)}`,
      openedAt: new Date().toISOString(),
      startingCash,
      salesCount: 0,
      totalCashSales: 0,
      totalCardSales: 0,
      status: "Open"
    };

    setPOSSessions(prev => [newSession, ...prev]);
    addAuditLog("POS Session", `Opened POS cash register. float: SAR ${startingCash}.`);
  };

  // 9. Close POS Session with Cash Over/Short Reconciliation
  const closePOSSession = (actualCashCounted?: number) => {
    const openSess = posSessions.find(s => s.status === "Open");
    if (openSess && actualCashCounted !== undefined) {
      const expectedCash = openSess.startingCash + openSess.totalCashSales;
      const variance = Math.round((actualCashCounted - expectedCash) * 100) / 100;
      if (Math.abs(variance) >= 0.01) {
        const absVar = Math.abs(variance);
        postJournalEntry({
          date: new Date().toISOString().split("T")[0],
          reference: `POS-REC-${openSess.id}`,
          notes: variance > 0 ? `فائض جرد صندوق الكاشير (${openSess.id})` : `عجز جرد صندوق الكاشير (${openSess.id})`,
          workflowStatus: "Posted",
          currency: Currency.SAR,
          exchangeRate: 1,
          items: variance > 0
            ? [
                { id: `jei-pos-dr-${Date.now()}`, accountId: postingConfig.cashAccountId, accountName: "Cash in Hand", debit: absVar, credit: 0 },
                { id: `jei-pos-cr-${Date.now()}`, accountId: postingConfig.retailRevenueAccountId, accountName: "Retail POS Revenue", debit: 0, credit: absVar }
              ]
            : [
                { id: `jei-pos-dr-${Date.now()}`, accountId: postingConfig.generalExpenseAccountId, accountName: "Operating Expenses", debit: absVar, credit: 0 },
                { id: `jei-pos-cr-${Date.now()}`, accountId: postingConfig.cashAccountId, accountName: "Cash in Hand", debit: 0, credit: absVar }
              ]
        });
      }
    }

    setPOSSessions(prev => prev.map(sess => {
      if (sess.status === "Open") {
        return {
          ...sess,
          closedAt: new Date().toISOString(),
          status: "Closed"
        };
      }
      return sess;
    }));
    addAuditLog("POS Session", "Closed and reconciled active POS register checkout session.");
  };

  // Extended Sales Lifecycle Methods
  const addSalesQuotation = (qt: Omit<SalesQuotation, "id">) => {
    const id = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newQt: SalesQuotation = { ...qt, id };
    setSalesQuotations(prev => [newQt, ...prev]);
    addAuditLog("Sales Quotation", `Issued Quotation ${id} for ${qt.customerName} (Total: SAR ${qt.totalAmount.toFixed(2)})`);
  };

  const convertQuotationToOrder = (quotationId: string) => {
    const qt = salesQuotations.find(q => q.id === quotationId);
    if (!qt) return { success: false, error: "Quotation not found" };
    if (qt.status === "Converted") return { success: false, error: "Quotation already converted" };

    const soId = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: SalesOrder = {
      id: soId,
      quotationId: qt.id,
      customerId: qt.customerId,
      customerName: qt.customerName,
      date: new Date().toISOString().split("T")[0],
      deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      items: qt.items,
      subtotal: qt.subtotal,
      taxAmount: qt.taxAmount,
      totalAmount: qt.totalAmount,
      status: "Confirmed",
      notes: `محول من عرض السعر ${qt.id}`
    };

    setSalesQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: "Converted" } : q));
    setSalesOrders(prev => [newOrder, ...prev]);
    addAuditLog("Convert Quotation", `Converted Quotation ${qt.id} to Sales Order ${soId}`);
    return { success: true };
  };

  const addSalesOrder = (so: Omit<SalesOrder, "id">) => {
    const id = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSalesOrders(prev => [{ ...so, id }, ...prev]);
    addAuditLog("Sales Order", `Created Sales Order ${id} for ${so.customerName}`);
  };

  const fulfillSalesOrderToInvoice = (salesOrderId: string, isPaid: boolean) => {
    const so = salesOrders.find(o => o.id === salesOrderId);
    if (!so) return { success: false, error: "Sales Order not found" };
    if (so.status === "Invoiced") return { success: false, error: "Sales Order already invoiced" };

    const invRes = addSalesInvoice(
      {
        customerId: so.customerId,
        customerName: so.customerName,
        status: isPaid ? "Paid" : "Unpaid",
        type: "Wholesale",
        items: so.items,
        subtotal: so.subtotal,
        taxAmount: so.taxAmount,
        totalAmount: so.totalAmount
      },
      "Wholesale"
    );

    if (!invRes.success) return invRes;

    const dnId = `DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDn: DeliveryNote = {
      id: dnId,
      salesOrderId: so.id,
      invoiceId: invRes.invoiceId,
      customerId: so.customerId,
      customerName: so.customerName,
      date: new Date().toISOString().split("T")[0],
      warehouseId: "wh-3",
      driverName: "فهد الدوسري",
      vehiclePlate: "أ ب ج 4821",
      items: so.items.map(i => ({ itemId: i.itemId, itemName: i.itemName, quantity: i.quantity })),
      status: "Delivered"
    };

    setDeliveryNotes(prev => [newDn, ...prev]);
    setSalesOrders(prev => prev.map(o => o.id === salesOrderId ? { ...o, status: "Invoiced" } : o));
    addAuditLog("Fulfill Sales Order", `Dispatched Delivery Note ${dnId} and issued Tax Invoice ${invRes.invoiceId} for Order ${so.id}`);
    return { success: true };
  };

  const addDeliveryNote = (dn: Omit<DeliveryNote, "id">) => {
    const id = `DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setDeliveryNotes(prev => [{ ...dn, id }, ...prev]);
    addAuditLog("Delivery Note", `Issued Delivery Note ${id} for ${dn.customerName}`);
  };

  // Sales Return (Credit Note 381) -> Restores Inventory + Reverses Revenue & VAT + Reverses COGS + Updates AR + Issues ZATCA Credit Note
  const addSalesReturn = (ret: Omit<SalesReturn, "id" | "status" | "zatcaUuid">) => {
    const cnId = `CN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let currentBatches = [...batches];
    let currentLayers = [...costLayers];
    let currentMovements = [...stockMovements];
    let totalRestoredCogs = 0;

    for (const line of ret.items) {
      const dbItem = items.find(i => i.id === line.itemId);
      const unitCost = dbItem?.cost || Math.round(line.price * 0.5 * 100) / 100;
      totalRestoredCogs += Math.round(unitCost * line.quantity * 100) / 100;

      const recRes = InventoryEngine.receiveStock(
        {
          itemId: line.itemId,
          itemName: line.itemName,
          warehouseId: "wh-3",
          batchNumber: `RET-${cnId}-${line.itemId.slice(-3)}`,
          quantity: line.quantity,
          unitCost,
          date: ret.date,
          referenceType: "SALES_RETURN",
          referenceId: cnId,
          createdBy: currentUser.username || "system"
        },
        currentBatches,
        currentLayers,
        currentMovements
      );

      if (recRes.success && recRes.data) {
        currentBatches = recRes.data.batches;
        currentLayers = recRes.data.layers;
        currentMovements = recRes.data.movements;
      }
    }

    setBatches(currentBatches);
    setCostLayers(currentLayers);
    setStockMovements(currentMovements);

    const creditAccount = ret.refundMethod === "Cash"
      ? postingConfig.cashAccountId
      : ret.refundMethod === "Bank"
      ? postingConfig.bankAccountId
      : postingConfig.accountsReceivableAccountId;

    // 1. Reverse Revenue & VAT Output
    postJournalEntry({
      date: ret.date,
      reference: cnId,
      notes: `إشعار دائن مرتجع مبيعات ${cnId} (فاتورة ${ret.originalInvoiceId}) - ${ret.reason}`,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: [
        { id: `jei-cn-rev-${Date.now()}`, accountId: postingConfig.wholesaleRevenueAccountId, accountName: "Wholesale Revenue", debit: ret.subtotal, credit: 0 },
        { id: `jei-cn-vat-${Date.now()}`, accountId: postingConfig.vatOutputAccountId, accountName: "Sales Tax Payable", debit: ret.taxAmount, credit: 0 },
        { id: `jei-cn-ar-${Date.now()}`, accountId: creditAccount, accountName: "Customer / Cash Refund", debit: 0, credit: ret.totalAmount }
      ]
    });

    // 2. Restore Inventory Asset & Reverse COGS
    if (totalRestoredCogs > 0) {
      postJournalEntry({
        date: ret.date,
        reference: `${cnId}-COGS`,
        notes: `عكس تكلفة البضاعة المباعة وإعادة المخزون للإشعار الدائن ${cnId}`,
        workflowStatus: "Posted",
        currency: Currency.SAR,
        exchangeRate: 1,
        items: [
          { id: `jei-cn-inv-${Date.now()}`, accountId: postingConfig.finishedGoodsInventoryAccountId, accountName: "Finished Product Stock", debit: totalRestoredCogs, credit: 0 },
          { id: `jei-cn-cogs-${Date.now()}`, accountId: postingConfig.cogsAccountId, accountName: "Cost of Goods Sold (COGS)", debit: 0, credit: totalRestoredCogs }
        ]
      });
    }

    if (ret.refundMethod === "CreditAccount") {
      setCustomers(prev => prev.map(c => c.id === ret.customerId ? { ...c, balance: Math.max(0, c.balance - ret.totalAmount) } : c));
      setCustomerMovements(prev => [
        {
          id: `mov-ret-${Date.now()}`,
          customerId: ret.customerId,
          date: ret.date,
          type: "return",
          amount: ret.totalAmount,
          reference: cnId,
          notes: `إشعار دائن مرتجع مبيعات (${ret.reason})`
        },
        ...prev
      ]);
    }

    const zatcaRec = issueZatcaDocument({
      documentId: cnId,
      documentType: "CreditNote",
      invoiceTypeCode: "381",
      subType: "0100000",
      customerName: ret.customerName,
      subtotal: ret.subtotal,
      vatAmount: ret.taxAmount,
      totalAmount: ret.totalAmount,
      items: ret.items
    });

    const newRet: SalesReturn = {
      ...ret,
      id: cnId,
      status: "Posted",
      zatcaUuid: zatcaRec.uuid
    };

    setSalesReturns(prev => [newRet, ...prev]);
    addAuditLog("Sales Return (Credit Note)", `Issued Credit Note ${cnId} for ${ret.customerName}, restored inventory, reversed GL & COGS.`);
    return { success: true };
  };

  // Extended Procurement Lifecycle Methods
  const addPurchaseRequest = (pr: Omit<PurchaseRequest, "id">) => {
    const id = `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setPurchaseRequests(prev => [{ ...pr, id }, ...prev]);
    addAuditLog("Purchase Request", `Created Material Requisition ${id} (${pr.department})`);
  };

  const approvePurchaseRequestToPO = (prId: string, supplierId: string) => {
    const pr = purchaseRequests.find(r => r.id === prId);
    if (!pr) return { success: false, error: "Purchase Request not found" };
    const supplier = suppliers.find(s => s.id === supplierId) || suppliers[0];
    if (!supplier) return { success: false, error: "Supplier not found" };

    const poItems = pr.items.map(i => ({
      itemId: i.itemId,
      itemName: i.itemName,
      quantity: i.quantity,
      price: i.estimatedCost,
      total: Math.round(i.quantity * i.estimatedCost * 100) / 100
    }));
    const subtotal = poItems.reduce((s, i) => s + i.total, 0);

    addPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.nameAr || supplier.name,
      date: new Date().toISOString().split("T")[0],
      status: "Draft",
      items: poItems,
      totalAmount: subtotal
    });

    setPurchaseRequests(prev => prev.map(r => r.id === prId ? { ...r, status: "ConvertedToPO" } : r));
    addAuditLog("Approve Purchase Request", `Approved PR ${prId} and converted to Purchase Order for ${supplier.nameAr}`);
    return { success: true };
  };

  // Purchase Return (Debit Note 383) -> Deducts FIFO Stock + Reverses AP & VAT Input + Issues ZATCA Debit Note
  const addPurchaseReturn = (ret: Omit<PurchaseReturn, "id" | "status">) => {
    const dnId = `DN-PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let currentBatches = [...batches];
    let currentLayers = [...costLayers];
    let currentMovements = [...stockMovements];

    for (const line of ret.items) {
      const issueRes = InventoryEngine.issueStock(
        {
          itemId: line.itemId,
          quantity: line.quantity,
          date: ret.date,
          referenceType: "PURCHASE_RETURN",
          referenceId: dnId,
          createdBy: currentUser.username || "system",
          notes: `Returned ${line.quantity} of ${line.itemName} to supplier ${ret.supplierName}`
        },
        currentBatches,
        currentLayers,
        currentMovements,
        line.itemName
      );

      if (!issueRes.success || !issueRes.data) {
        return { success: false, error: issueRes.error || `الرصيد المخزني غير كافٍ لإرجاع الصنف ${line.itemName}` };
      }
      currentBatches = issueRes.data.batches;
      currentLayers = issueRes.data.layers;
      currentMovements = issueRes.data.movements;
    }

    setBatches(currentBatches);
    setCostLayers(currentLayers);
    setStockMovements(currentMovements);

    postJournalEntry({
      date: ret.date,
      reference: dnId,
      notes: `إشعار مدين مرتجع مشتريات ${dnId} للمورد ${ret.supplierName} - ${ret.reason}`,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: [
        { id: `jei-dn-ap-${Date.now()}`, accountId: postingConfig.accountsPayableAccountId, accountName: "Accounts Payable", debit: ret.totalAmount, credit: 0 },
        { id: `jei-dn-inv-${Date.now()}`, accountId: postingConfig.rawMaterialsInventoryAccountId, accountName: "Raw Material Stock", debit: 0, credit: ret.subtotal },
        ...(ret.taxAmount > 0
          ? [{ id: `jei-dn-vat-${Date.now()}`, accountId: postingConfig.vatInputAccountId, accountName: "Sales Tax Payable", debit: 0, credit: ret.taxAmount }]
          : [])
      ]
    });

    setSuppliers(prev => prev.map(s => s.id === ret.supplierId ? { ...s, balance: Math.max(0, s.balance - ret.totalAmount) } : s));

    issueZatcaDocument({
      documentId: dnId,
      documentType: "DebitNote",
      invoiceTypeCode: "383",
      subType: "0100000",
      customerName: ret.supplierName,
      subtotal: ret.subtotal,
      vatAmount: ret.taxAmount,
      totalAmount: ret.totalAmount,
      items: ret.items
    });

    const newPurchaseRet: PurchaseReturn = {
      ...ret,
      id: dnId,
      status: "Posted"
    };
    setPurchaseReturns(prev => [newPurchaseRet, ...prev]);
    addAuditLog("Purchase Return (Debit Note)", `Issued Purchase Return ${dnId} to ${ret.supplierName} for SAR ${ret.totalAmount.toFixed(2)}`);
    return { success: true };
  };

  // Treasury & Bank Transactions with Double-Entry GL Posting
  const addBankTransaction = (tx: Omit<BankTransaction, "id">, counterAccountId?: string) => {
    if (tx.amount <= 0) return { success: false, error: "Invalid transaction amount" };
    const id = `BNK-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: BankTransaction = { ...tx, id };

    const targetCounterId = counterAccountId || (tx.type === "Deposit" ? postingConfig.accountsReceivableAccountId : postingConfig.generalExpenseAccountId);
    const targetCounterName = accounts.find(a => a.id === targetCounterId)?.name || "Counter Account";

    const glRes = postJournalEntry({
      date: tx.date,
      reference: id,
      notes: `حركة بنكية (${tx.type === "Deposit" ? "إيداع" : "سحب/تحويل"}): ${tx.description}`,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: tx.type === "Deposit"
        ? [
            { id: `jei-bnk-dr-${Date.now()}`, accountId: postingConfig.bankAccountId, accountName: "Al-Rajhi Bank", debit: tx.amount, credit: 0 },
            { id: `jei-bnk-cr-${Date.now()}`, accountId: targetCounterId, accountName: targetCounterName, debit: 0, credit: tx.amount }
          ]
        : [
            { id: `jei-bnk-dr-${Date.now()}`, accountId: targetCounterId, accountName: targetCounterName, debit: tx.amount, credit: 0 },
            { id: `jei-bnk-cr-${Date.now()}`, accountId: postingConfig.bankAccountId, accountName: "Al-Rajhi Bank", debit: 0, credit: tx.amount }
          ]
    });

    if (!glRes.success) return glRes;

    setBankTransactions(prev => [newTx, ...prev]);
    addAuditLog("Bank Transaction", `Posted Bank ${tx.type} ${id} of SAR ${tx.amount.toFixed(2)} - ${tx.description}`);
    return { success: true };
  };

  // Fixed Assets & Automated Depreciation Cycle
  const addFixedAsset = (asset: Omit<FixedAsset, "id" | "accumulatedDepreciation" | "bookValue" | "status">) => {
    const id = `fa-${Date.now().toString().slice(-4)}`;
    const newAsset: FixedAsset = {
      ...asset,
      id,
      accumulatedDepreciation: 0,
      bookValue: asset.acquisitionCost,
      status: "Active"
    };
    setFixedAssets(prev => [newAsset, ...prev]);
    addAuditLog("Fixed Asset Registered", `Added Fixed Asset ${asset.nameAr} (${asset.code}) at cost SAR ${asset.acquisitionCost}`);
  };

  const runDepreciationCycle = (periodLabel: string) => {
    let totalMonthlyDep = 0;
    const updatedAssets = fixedAssets.map(asset => {
      if (asset.status !== "Active" || asset.bookValue <= asset.salvageValue) return asset;
      const depreciableBase = Math.max(0, asset.acquisitionCost - asset.salvageValue);
      const monthlyDep = Math.round((depreciableBase / (asset.usefulLifeYears * 12)) * 100) / 100;
      const actualDep = Math.min(monthlyDep, asset.bookValue - asset.salvageValue);
      if (actualDep <= 0) return asset;

      totalMonthlyDep += actualDep;
      const newAccum = Math.round((asset.accumulatedDepreciation + actualDep) * 100) / 100;
      const newBook = Math.round((asset.acquisitionCost - newAccum) * 100) / 100;
      return {
        ...asset,
        accumulatedDepreciation: newAccum,
        bookValue: newBook,
        status: newBook <= asset.salvageValue ? ("FullyDepreciated" as const) : ("Active" as const)
      };
    });

    totalMonthlyDep = Math.round(totalMonthlyDep * 100) / 100;
    if (totalMonthlyDep <= 0) {
      return { success: false, error: "لا توجد أصول نشطة قابلة للإهلاك في هذه الفترة." };
    }

    const depRes = postJournalEntry({
      date: new Date().toISOString().split("T")[0],
      reference: `DEP-${periodLabel}`,
      notes: `قيد إهلاك الأصول الثابتة والمحامص للفترة ${periodLabel}`,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: [
        { id: `jei-dep-dr-${Date.now()}`, accountId: postingConfig.generalExpenseAccountId, accountName: "Depreciation & Utilities Expense", debit: totalMonthlyDep, credit: 0 },
        { id: `jei-dep-cr-${Date.now()}`, accountId: "acc-1400", accountName: "Machinery & Equipment", debit: 0, credit: totalMonthlyDep }
      ]
    });

    if (!depRes.success) return depRes;

    setFixedAssets(updatedAssets);
    addAuditLog("Asset Depreciation Run", `Executed depreciation schedule for ${periodLabel}. Posted SAR ${totalMonthlyDep.toFixed(2)} to General Ledger.`);
    return { success: true, totalDepreciated: totalMonthlyDep };
  };

  // HR & Payroll Processing with Double-Entry GL Posting
  const addEmployee = (emp: Omit<Employee, "id">) => {
    const id = `emp-${Date.now().toString().slice(-4)}`;
    setEmployees(prev => [...prev, { ...emp, id }]);
    addAuditLog("HR Employee Added", `Registered employee ${emp.nameAr} (${emp.code}) in ${emp.department}`);
  };

  const processPayrollRun = (periodMonth: string, paymentMethod: "Bank" | "Cash") => {
    if (payrollRuns.some(p => p.periodMonth === periodMonth)) {
      return { success: false, error: `تم صرف وترحيل مسير رواتب شهر ${periodMonth} مسبقاً.` };
    }
    const activeEmps = employees.filter(e => e.status === "Active");
    if (activeEmps.length === 0) {
      return { success: false, error: "لا يوجد موظفون نشطون لصرف الرواتب." };
    }

    const totalBasic = activeEmps.reduce((s, e) => s + e.basicSalary, 0);
    const totalAllowances = activeEmps.reduce((s, e) => s + e.housingAllowance + e.transportAllowance, 0);
    const totalDeductions = Math.round(totalBasic * 0.0975 * 100) / 100; // GOSI 9.75%
    const netPayable = Math.round((totalBasic + totalAllowances - totalDeductions) * 100) / 100;

    const payId = `PAY-${periodMonth}`;
    const creditAccId = paymentMethod === "Bank" ? postingConfig.bankAccountId : postingConfig.cashAccountId;
    const creditAccName = paymentMethod === "Bank" ? "Al-Rajhi Bank" : "Cash in Hand";

    const glRes = postJournalEntry({
      date: new Date().toISOString().split("T")[0],
      reference: payId,
      notes: `قيد استحقاق وصرف مسير رواتب وأجور شهر ${periodMonth} (${activeEmps.length} موظفين)`,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: [
        { id: `jei-pay-dr-${Date.now()}`, accountId: "acc-5300", accountName: "Wages & Salaries", debit: netPayable, credit: 0 },
        { id: `jei-pay-cr-${Date.now()}`, accountId: creditAccId, accountName: creditAccName, debit: 0, credit: netPayable }
      ]
    });

    if (!glRes.success) return glRes;

    const newRun: PayrollRun = {
      id: payId,
      periodMonth,
      runDate: new Date().toISOString().split("T")[0],
      employeeCount: activeEmps.length,
      totalBasic,
      totalAllowances,
      totalDeductions,
      netPayable,
      paymentMethod,
      journalEntryId: payId,
      status: "Posted"
    };

    setPayrollRuns(prev => [newRun, ...prev]);
    addAuditLog("Payroll Run Posted", `Processed Payroll ${payId} for ${activeEmps.length} employees. Net disbursed: SAR ${netPayable.toFixed(2)}`);
    return { success: true };
  };

  // CRM & Cost Centers
  const addCrmLead = (lead: Omit<CrmLead, "id">) => {
    const id = `lead-${Date.now().toString().slice(-4)}`;
    setCrmLeads(prev => [{ ...lead, id }, ...prev]);
    addAuditLog("CRM Lead Created", `Added B2B Lead ${lead.companyName} (Expected: SAR ${lead.expectedValue})`);
  };

  const updateCrmLeadStage = (id: string, stage: CrmLead["stage"]) => {
    setCrmLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
    addAuditLog("CRM Pipeline Update", `Moved lead ${id} to stage ${stage}`);
  };

  const addCostCenter = (cc: Omit<CostCenter, "id">) => {
    const id = `cc-${Date.now().toString().slice(-4)}`;
    setCostCenters(prev => [...prev, { ...cc, id }]);
    addAuditLog("Cost Center Created", `Created Cost Center ${cc.code} - ${cc.nameAr}`);
  };

  // Warehouse Adjustments & Transfers Creator
  const addWarehouse = (wh: Omit<Warehouse, "id">) => {
    const id = `wh-${warehouses.length + 1}-${Date.now().toString().slice(-3)}`;
    setWarehouses(prev => [...prev, { ...wh, id }]);
    addAuditLog("Warehouse Added", `Created Warehouse ${wh.nameAr} (${wh.location})`);
  };

  const addInventoryAdjustment = (adj: Omit<InventoryAdjustment, "id" | "workflowStatus">) => {
    const id = `ADJ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAdj: InventoryAdjustment = {
      ...adj,
      id,
      workflowStatus: "Draft"
    };
    setInventoryAdjustments(prev => [newAdj, ...prev]);
    addAuditLog("Create Inventory Adjustment", `Registered manual lot adjustment formula draft ${id} for ${adj.itemName}`);
    
    return { success: true };
  };

  const addStockTransfer = (trans: Omit<StockTransfer, "id" | "workflowStatus">) => {
    const id = `XFER-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTrans: StockTransfer = {
      ...trans,
      id,
      workflowStatus: "Draft"
    };
    setStockTransfers(prev => [newTrans, ...prev]);
    addAuditLog("Create Stock Transfer", `Created warehouse internal inventory transfer sheet ${id} for ${trans.itemName}`);
    
    return { success: true };
  };

  // Document status workflow state machine
  const updateDocumentWorkflowStatus = (
    docType: "journalEntry" | "purchaseOrder" | "salesInvoice" | "inventoryAdjustment" | "stockTransfer",
    docId: string,
    status: DocumentWorkflowStatus,
    reason?: string
  ) => {
    let oldStatus = "";
    
    if (docType === "journalEntry") {
      const entry = journalEntries.find(j => j.id === docId);
      if (!entry) return { success: false, error: "Journal Entry not found" };
      oldStatus = entry.workflowStatus || "Draft";
      
      if (oldStatus === "Posted" && currentUser.role !== "Admin" && currentUser.role !== "Owner") {
        return { success: false, error: "Posted transactions are locked and read-only. Only reverse transactions allowed." };
      }

      if (status === "Posted") {
        const validation = AccountingEngine.validateEntry(entry, fiscalPeriods);
        if (!validation.valid) {
          return { success: false, error: validation.errors.join(" | ") };
        }
      }

      setJournalEntries(prev => prev.map(j => {
        if (j.id === docId) {
          return { ...j, workflowStatus: status, posted: status === "Posted" };
        }
        return j;
      }));
    } else if (docType === "purchaseOrder") {
      const po = purchaseOrders.find(p => p.id === docId);
      if (!po) return { success: false, error: "Purchase Order not found" };
      oldStatus = po.workflowStatus || "Draft";

      if (oldStatus === "Posted" && currentUser.role !== "Admin") {
        return { success: false, error: "Posted documents are read-only." };
      }

      setPurchaseOrders(prev => prev.map(p => {
        if (p.id === docId) {
          const nextStatus = status === "Posted" ? "Received" as const : p.status;
          return { ...p, workflowStatus: status, status: nextStatus };
        }
        return p;
      }));

      if (status === "Posted" && oldStatus !== "Posted") {
        receivePurchaseOrder(docId);
      }
    } else if (docType === "salesInvoice") {
      const inv = salesInvoices.find(s => s.id === docId);
      if (!inv) return { success: false, error: "Sales Invoice not found" };
      oldStatus = inv.workflowStatus || "Draft";

      if (oldStatus === "Posted" && currentUser.role !== "Admin") {
        return { success: false, error: "Posted sales invoices are read-only." };
      }

      setSalesInvoices(prev => prev.map(s => {
        if (s.id === docId) {
          return { ...s, workflowStatus: status };
        }
        return s;
      }));
    } else if (docType === "inventoryAdjustment") {
      const adj = inventoryAdjustments.find(a => a.id === docId);
      if (!adj) return { success: false, error: "Adjustment not found" };
      oldStatus = adj.workflowStatus;

      setInventoryAdjustments(prev => prev.map(a => {
        if (a.id === docId) return { ...a, workflowStatus: status };
        return a;
      }));

      if (status === "Posted" && oldStatus !== "Posted") {
        if (adj.type === "Addition") {
          const newBatch: Batch = {
            id: `bat-${Math.floor(100000 + Math.random() * 900000)}`,
            batchNumber: `ADJ-${adj.id}-${new Date().toISOString().slice(2,10).replace(/-/g, "")}`,
            itemId: adj.itemId,
            itemName: adj.itemName,
            manufactureDate: adj.date,
            expiryDate: new Date(new Date(adj.date).setFullYear(new Date(adj.date).getFullYear() + 2)).toISOString().split('T')[0],
            quantity: adj.quantity,
            costPerUnit: adj.costPerUnit,
            warehouseId: adj.warehouseId
          };
          setBatches(prev => [...prev, newBatch]);

          const amount = adj.quantity * adj.costPerUnit;
          postJournalEntry({
            date: adj.date,
            reference: adj.id,
            notes: `Auto adjustment posting: ${adj.notes}`,
            workflowStatus: "Posted",
            currency: Currency.SAR,
            exchangeRate: 1,
            items: [
              { id: `jei-${Math.random()}`, accountId: "acc-1310", accountName: "Finished Product Stock", debit: amount, credit: 0 },
              { id: `jei-${Math.random()}`, accountId: "acc-4000", accountName: "Wholesale Revenue", debit: 0, credit: amount, notes: "Inventory adjustment gain" }
            ]
          });
        } else {
          let remaining = adj.quantity;
          let totalValue = 0;
          const updatedBatches = batches.map(b => {
            if (b.itemId === adj.itemId && b.quantity > 0 && remaining > 0) {
              const deduct = Math.min(b.quantity, remaining);
              remaining -= deduct;
              totalValue += deduct * b.costPerUnit;
              return { ...b, quantity: parseFloat((b.quantity - deduct).toFixed(3)) };
            }
            return b;
          });
          setBatches(updatedBatches);

          postJournalEntry({
            date: adj.date,
            reference: adj.id,
            notes: `Auto adjustment posting (deduction): ${adj.notes}`,
            workflowStatus: "Posted",
            currency: Currency.SAR,
            exchangeRate: 1,
            items: [
              { id: `jei-${Math.random()}`, accountId: "acc-5000", accountName: "Cost of Goods Sold (COGS)", debit: totalValue, credit: 0, notes: "Inventory adjustment loss" },
              { id: `jei-${Math.random()}`, accountId: "acc-1310", accountName: "Finished Product Stock", debit: 0, credit: totalValue }
            ]
          });
        }
      }
    } else if (docType === "stockTransfer") {
      const trans = stockTransfers.find(t => t.id === docId);
      if (!trans) return { success: false, error: "Transfer not found" };
      oldStatus = trans.workflowStatus;

      setStockTransfers(prev => prev.map(t => {
        if (t.id === docId) return { ...t, workflowStatus: status };
        return t;
      }));

      if (status === "Posted" && oldStatus !== "Posted") {
        let remaining = trans.quantity;
        const newTargetBatches: Batch[] = [];
        const updatedBatches = batches.map(b => {
          if (b.itemId === trans.itemId && b.warehouseId === trans.fromWarehouseId && b.quantity > 0 && remaining > 0) {
            const deduct = Math.min(b.quantity, remaining);
            remaining -= deduct;
            newTargetBatches.push({
              id: `bat-${Math.floor(100000 + Math.random() * 900000)}`,
              batchNumber: `TR-${b.batchNumber}`,
              itemId: trans.itemId,
              itemName: trans.itemName,
              manufactureDate: trans.date,
              expiryDate: b.expiryDate,
              quantity: deduct,
              costPerUnit: b.costPerUnit,
              warehouseId: trans.toWarehouseId
            });
            return { ...b, quantity: parseFloat((b.quantity - deduct).toFixed(3)) };
          }
          return b;
        });
        setBatches([...updatedBatches, ...newTargetBatches]);
      }
    }

    const logDetails = `Updated ${docType} ID ${docId} workflow status from ${oldStatus} to ${status}. Reason: ${reason || "N/A"}`;
    addAuditLog(`Workflow status update (${docType})`, logDetails, oldStatus, status, reason);

    return { success: true };
  };

  // RBAC Access controls
  const allEnterprisePages = [
    "overview", "accounting", "customers", "customer_ledger", "suppliers", "purchases", "sales",
    "wholesale_sales", "daily_sales", "inventory", "production", "roastery", "grinding", "pos",
    "reports", "cashbox", "zatca",
    "sales_quotations", "sales_orders", "delivery_notes", "sales_returns", "credit_notes", "customer_aging",
    "purchase_requests", "rfq_comparison", "goods_receipt", "purchase_returns", "debit_notes", "supplier_aging", "landed_cost",
    "stock_transfers", "stock_adjustments", "stock_count", "batch_traceability", "reorder_alerts",
    "treasury_vouchers", "bank_accounts", "bank_reconciliation", "cheques_notes",
    "fixed_assets", "depreciation", "cost_centers", "budgets",
    "hr_employees", "hr_attendance", "hr_leaves", "hr_advances", "hr_payroll", "hr_eosb",
    "crm_leads", "crm_opportunities", "crm_contracts", "crm_loyalty",
    "admin_companies", "admin_branches", "admin_fiscal_years", "admin_fiscal_periods",
    "admin_users", "admin_roles", "admin_numbering", "admin_audit_log", "admin_backup", "admin_sync_status"
  ];

  const permissionsByRole: Record<UserRole, { pages: string[]; actions: string[] }> = {
    Admin: {
      pages: allEnterprisePages,
      actions: ["create", "edit", "approve", "post", "cancel", "delete", "configure", "view"]
    },
    Owner: {
      pages: allEnterprisePages,
      actions: ["create", "edit", "approve", "post", "cancel", "configure", "view"]
    },
    Accountant: {
      pages: [
        "overview", "accounting", "customers", "customer_ledger", "suppliers", "purchases", "sales",
        "wholesale_sales", "daily_sales", "reports", "cashbox", "zatca",
        "sales_returns", "credit_notes", "customer_aging", "purchase_returns", "debit_notes", "supplier_aging", "landed_cost",
        "treasury_vouchers", "bank_accounts", "bank_reconciliation", "cheques_notes",
        "fixed_assets", "depreciation", "cost_centers", "budgets", "hr_payroll", "hr_eosb", "admin_fiscal_periods", "admin_audit_log"
      ],
      actions: ["create", "edit", "post", "cancel", "view"]
    },
    "Warehouse Manager": {
      pages: [
        "overview", "inventory", "suppliers", "purchases",
        "purchase_requests", "goods_receipt", "purchase_returns",
        "stock_transfers", "stock_adjustments", "stock_count", "batch_traceability", "reorder_alerts"
      ],
      actions: ["create", "edit", "transfer", "receive", "view"]
    },
    "Production Manager": {
      pages: [
        "overview", "production", "roastery", "grinding", "inventory",
        "stock_transfers", "batch_traceability", "reorder_alerts"
      ],
      actions: ["create", "edit", "roast", "grind", "package", "view"]
    },
    Cashier: {
      pages: ["pos", "daily_sales", "customers", "cashbox", "treasury_vouchers"],
      actions: ["create", "sell", "checkout", "view"]
    },
    "POS Operator": {
      pages: ["pos", "daily_sales", "customers", "cashbox"],
      actions: ["create", "sell", "checkout", "view"]
    },
    Sales: {
      pages: [
        "overview", "sales", "wholesale_sales", "daily_sales", "customers", "customer_ledger",
        "sales_quotations", "sales_orders", "delivery_notes", "sales_returns", "credit_notes", "customer_aging",
        "crm_leads", "crm_opportunities", "crm_contracts", "crm_loyalty"
      ],
      actions: ["create", "edit", "sell", "view"]
    },
    Purchasing: {
      pages: [
        "overview", "purchases", "suppliers",
        "purchase_requests", "rfq_comparison", "goods_receipt", "purchase_returns", "debit_notes", "supplier_aging", "landed_cost"
      ],
      actions: ["create", "edit", "buy", "receive", "view"]
    },
    Auditor: {
      pages: [
        "overview", "accounting", "reports", "zatca", "customer_ledger", "customer_aging", "supplier_aging",
        "bank_reconciliation", "fixed_assets", "depreciation", "cost_centers", "budgets",
        "admin_fiscal_periods", "admin_audit_log", "admin_sync_status"
      ],
      actions: ["view"]
    },
    Viewer: {
      pages: ["overview", "reports"],
      actions: ["view"]
    }
  };

  const checkUserPermission = (page: string, action: string) => {
    if (currentUser.role === "Admin" || currentUser.role === "Owner") return true;
    const rolePerms = permissionsByRole[currentUser.role];
    if (!rolePerms) return false;

    if (page && !rolePerms.pages.includes(page)) {
      return false;
    }

    if (action) {
      return rolePerms.actions.includes(action) || rolePerms.actions.includes("all");
    }

    return true;
  };

  // 10. Create SQL/JSON Database Backup File
  const createBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      accounts,
      warehouses,
      items,
      recipes,
      customers,
      suppliers,
      journalEntries,
      batches,
      roastingJobs,
      grindingJobs,
      packagingJobs,
      purchaseOrders,
      salesInvoices,
      posSessions,
      bankTransactions,
      users,
      auditLogs,
      companySettings,
      exchangeRates,
      inventoryAdjustments,
      stockTransfers,
      recurringEntries,
      zatcaRecords,
      salesQuotations,
      salesOrders,
      salesReturns,
      purchaseRequests,
      purchaseReturns,
      fixedAssets,
      employees,
      payrollRuns
    };

    const filename = `novaro_erp_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, "_")}_${Math.floor(1000 + Math.random() * 9000)}.json`;
    const newBackup: Backup = {
      id: `bak-${Math.floor(100000 + Math.random() * 900000)}`,
      filename,
      createdAt: new Date().toLocaleString(),
      size: `${(JSON.stringify(backupData).length / 1024 / 1024).toFixed(2)} MB`
    };

    setBackups(prev => [newBackup, ...prev]);
    addAuditLog("System Backup", `Generated complete relational JSON structure dump file: ${filename}`);
  };

  // 11. Reset database to defaults
  const resetToDefault = () => {
    localStorage.clear();
    setAccounts(initialAccounts);
    setWarehouses(initialWarehouses);
    setItems(initialItems);
    setRecipes(initialRecipes);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setJournalEntries(initialJournalEntries);
    setBatches(initialBatches);
    setRoastingJobs(initialRoastingJobs);
    setGrindingJobs(initialGrindingJobs);
    setPackagingJobs(initialPackagingJobs);
    setPurchaseOrders(initialPurchaseOrders);
    setSalesInvoices(initialSalesInvoices);
    setPOSSessions(initialPOSSessions);
    setBankTransactions(initialBankTransactions);
    setUsers(initialUsers);
    setAuditLogs(initialAuditLogs.slice(0, 2));
    setBackups(initialBackups.slice(0, 1));
    setCurrentUser(initialUsers[0]);
    setSalesQuotations(initialSalesQuotations);
    setSalesOrders(initialSalesOrders);
    setDeliveryNotes(initialDeliveryNotes);
    setSalesReturns(initialSalesReturns);
    setPurchaseRequests(initialPurchaseRequests);
    setPurchaseReturns(initialPurchaseReturns);
    setFixedAssets(initialFixedAssets);
    setEmployees(initialEmployees);
    setPayrollRuns(initialPayrollRuns);
    setCrmLeads(initialCrmLeads);
    setCostCenters(initialCostCenters);
    setPostingConfig(defaultPostingAccountConfiguration);
    setCostLayers(initialBatches.map(b => ({
      id: `layer-${b.id}`,
      batchId: b.id,
      batchNumber: b.batchNumber,
      itemId: b.itemId,
      warehouseId: b.warehouseId,
      receivedDate: b.manufactureDate,
      initialQuantity: b.quantity,
      remainingQuantity: b.quantity,
      unitCost: b.costPerUnit,
      currency: Currency.SAR,
      isExhausted: b.quantity <= 0,
      sourceDocumentType: "PurchaseOrder" as const,
      sourceDocumentId: "OB-2026"
    })));
    setStockMovements([]);
    setFiscalPeriods(defaultFiscalPeriods);
    setSupplierMovements([]);

    addAuditLog("Factory Reset", "Restored ERP database schemas to pristine initial seeds.");
  };

  // Ledger-derived reports & Auditing
  const getTrialBalance = (_asOfDate?: string): TrialBalanceResult => {
    return TrialBalanceService.getTrialBalance(accounts, journalEntries);
  };

  const getIncomeStatement = (_startDate?: string, _endDate?: string): IncomeStatementResult => {
    return TrialBalanceService.generateIncomeStatement(accounts, journalEntries);
  };

  const getBalanceSheet = (_asOfDate?: string): BalanceSheetResult => {
    return TrialBalanceService.generateBalanceSheet(accounts, journalEntries);
  };

  const runDataIntegrityAudit = (): DataIntegrityReport => {
    return DataIntegrityChecker.runFullAudit({
      accounts,
      journalEntries,
      batches,
      items,
      customers,
      suppliers,
      salesInvoices,
      purchaseOrders,
      postingConfig
    });
  };

  const runMasterCertification = (): MasterCertificationReport => {
    return runCertificationSuite();
  };

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = `toast-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      removeToast(id);
    }, toast.undoAction ? 8000 : 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // CRUD actions
  const addCustomer = (c: Omit<Customer, "id" | "balance">) => {
    const newCustomer: Customer = {
      ...c,
      id: `cust-${Math.floor(100 + Math.random() * 900)}`,
      balance: 0
    };
    setCustomers(prev => [...prev, newCustomer]);
    addAuditLog("إضافة عميل", `تم تسجيل العميل الجديد ${c.name} (${c.nameAr})`);
    addToast({
      type: "success",
      message: `تم إضافة العميل الجديد: ${c.nameAr}`,
      messageEn: `New customer added: ${c.name}`
    });
  };

  const addSupplier = (s: Omit<Supplier, "id" | "balance">) => {
    const newSupplier: Supplier = {
      ...s,
      id: `supp-${Math.floor(100 + Math.random() * 900)}`,
      balance: 0
    };
    setSuppliers(prev => [...prev, newSupplier]);
    addAuditLog("إضافة مورد", `تم تسجيل المورد الجديد ${s.name} (${s.nameAr})`);
    addToast({
      type: "success",
      message: `تم إضافة المورد الجديد: ${s.nameAr}`,
      messageEn: `New supplier added: ${s.name}`
    });
  };

  const addItem = (i: Omit<Item, "id" | "currentStock">) => {
    const newItem: Item = {
      ...i,
      id: `itm-${Math.floor(1000 + Math.random() * 9000)}`,
      currentStock: 0
    };
    setItems(prev => [...prev, newItem]);
    addAuditLog("إضافة صنف مخزني", `تم تسجيل الصنف الجديد ${i.name} (${i.nameAr})`);
    addToast({
      type: "success",
      message: `تم إضافة الصنف الجديد: ${i.nameAr}`,
      messageEn: `New item cataloged: ${i.name}`
    });
  };

  const addAccount = (a: Omit<Account, "id" | "balance">) => {
    const newAccount: Account = {
      ...a,
      id: `acc-${Math.floor(1000 + Math.random() * 9000)}`,
      balance: 0
    };
    setAccounts(prev => [...prev, newAccount]);
    addAuditLog("إضافة حساب دليل", `تم تسجيل الحساب المالي الجديد ${a.name} (${a.nameAr})`);
    addToast({
      type: "success",
      message: `تم إضافة الحساب المالي: ${a.nameAr}`,
      messageEn: `New chart of accounts ledger: ${a.name}`
    });
  };

  const updateCustomer = (id: string, c: Partial<Customer>) => {
    const original = customers.find(x => x.id === id);
    setCustomers(prev => prev.map(cust => cust.id === id ? { ...cust, ...c } : cust));
    addAuditLog("تعديل عميل", `تم تعديل بيانات العميل ${original?.nameAr || id}`);
    addToast({
      type: "success",
      message: `تم تحديث بيانات العميل بنجاح`,
      messageEn: `Customer updated successfully`
    });
  };

  const updateSupplier = (id: string, s: Partial<Supplier>) => {
    const original = suppliers.find(x => x.id === id);
    setSuppliers(prev => prev.map(supp => supp.id === id ? { ...supp, ...s } : supp));
    addAuditLog("تعديل مورد", `تم تعديل بيانات المورد ${original?.nameAr || id}`);
    addToast({
      type: "success",
      message: `تم تحديث بيانات المورد بنجاح`,
      messageEn: `Supplier updated successfully`
    });
  };

  const updateItem = (id: string, i: Partial<Item>) => {
    const original = items.find(x => x.id === id);
    setItems(prev => prev.map(itm => itm.id === id ? { ...itm, ...i } : itm));
    addAuditLog("تعديل صنف", `تم تعديل بيانات الصنف ${original?.nameAr || id}`);
    addToast({
      type: "success",
      message: `تم تحديث بيانات الصنف بنجاح`,
      messageEn: `Item catalog updated`
    });
  };

  const updateAccount = (id: string, a: Partial<Account>) => {
    const original = accounts.find(x => x.id === id);
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...a } : acc));
    addAuditLog("تعديل حساب", `تم تعديل بيانات الحساب ${original?.nameAr || id}`);
    addToast({
      type: "success",
      message: `تم تحديث بيانات الحساب المالي بنجاح`,
      messageEn: `Financial account updated`
    });
  };

  const deleteCustomer = (id: string) => {
    const original = customers.find(x => x.id === id);
    if (!original) return;
    setCustomers(prev => prev.filter(cust => cust.id !== id));
    addAuditLog("حذف عميل", `تم حذف العميل ${original.nameAr}`);
    addToast({
      type: "info",
      message: `تم حذف العميل: ${original.nameAr}`,
      messageEn: `Deleted customer: ${original.name}`,
      undoAction: () => {
        setCustomers(prev => [...prev, original]);
        addAuditLog("تراجع عن حذف عميل", `تم التراجع عن حذف العميل ${original.nameAr}`);
      },
      undoLabel: "تراجع",
      undoLabelEn: "Undo"
    });
  };

  const deleteSupplier = (id: string) => {
    const original = suppliers.find(x => x.id === id);
    if (!original) return;
    setSuppliers(prev => prev.filter(supp => supp.id !== id));
    addAuditLog("حذف مورد", `تم حذف المورد ${original.nameAr}`);
    addToast({
      type: "info",
      message: `تم حذف المورد: ${original.nameAr}`,
      messageEn: `Deleted supplier: ${original.name}`,
      undoAction: () => {
        setSuppliers(prev => [...prev, original]);
        addAuditLog("تراجع عن حذف مورد", `تم التراجع عن حذف المورد ${original.nameAr}`);
      },
      undoLabel: "تراجع",
      undoLabelEn: "Undo"
    });
  };

  const deleteItem = (id: string) => {
    const original = items.find(x => x.id === id);
    if (!original) return;
    setItems(prev => prev.filter(itm => itm.id !== id));
    addAuditLog("حذف صنف", `تم حذف الصنف ${original.nameAr}`);
    addToast({
      type: "info",
      message: `تم حذف الصنف: ${original.nameAr}`,
      messageEn: `Deleted item: ${original.name}`,
      undoAction: () => {
        setItems(prev => [...prev, original]);
        addAuditLog("تراجع عن حذف صنف", `تم التراجع عن حذف الصنف ${original.nameAr}`);
      },
      undoLabel: "تراجع",
      undoLabelEn: "Undo"
    });
  };

  const deleteAccount = (id: string) => {
    const original = accounts.find(x => x.id === id);
    if (!original) return;
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    addAuditLog("حذف حساب مالي", `تم حذف الحساب ${original.nameAr}`);
    addToast({
      type: "info",
      message: `تم حذف الحساب المالي: ${original.nameAr}`,
      messageEn: `Deleted account: ${original.name}`,
      undoAction: () => {
        setAccounts(prev => [...prev, original]);
        addAuditLog("تراجع عن حذف حساب مالي", `تم التراجع عن حذف الحساب ${original.nameAr}`);
      },
      undoLabel: "تراجع",
      undoLabelEn: "Undo"
    });
  };

  // Roastery & Grinding Expenses with Automated Double-Entry GL Posting
  const addRoasteryExpense = (e: Omit<RoasteryExpense, "id">) => {
    const id = `re-${Date.now()}`;
    const newExp: RoasteryExpense = { ...e, id };
    setRoasteryExpenses(prev => [newExp, ...prev]);

    postJournalEntry({
      date: e.date,
      reference: id,
      notes: `مصروف تشغيل محمصة (${e.type}): ${e.notes}`,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: [
        { id: `jei-re-dr-${Date.now()}`, accountId: postingConfig.roasteryExpenseAccountId, accountName: "Roasting Factory Expense", debit: e.amount, credit: 0 },
        { id: `jei-re-cr-${Date.now()}`, accountId: postingConfig.cashAccountId, accountName: "Cash in Hand", debit: 0, credit: e.amount }
      ]
    });

    addAuditLog("إضافة مصروف محمصة", `تم إضافة وترحيل مصروف للمحمصة بقيمة ${e.amount} ريال - ${e.notes}`);
  };

  const deleteRoasteryExpense = (id: string) => {
    setRoasteryExpenses(prev => prev.filter(x => x.id !== id));
    addAuditLog("حذف مصروف محمصة", `تم حذف مصروف المحمصة ${id}`);
  };

  const addGrindingExpense = (e: Omit<GrindingExpense, "id">) => {
    const id = `ge-${Date.now()}`;
    const newExp: GrindingExpense = { ...e, id };
    setGrindingExpenses(prev => [newExp, ...prev]);

    postJournalEntry({
      date: e.date,
      reference: id,
      notes: `مصروف تشغيل مطحنة (${e.type}): ${e.notes}`,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: [
        { id: `jei-ge-dr-${Date.now()}`, accountId: postingConfig.grindingExpenseAccountId, accountName: "Grinding Mill Expense", debit: e.amount, credit: 0 },
        { id: `jei-ge-cr-${Date.now()}`, accountId: postingConfig.cashAccountId, accountName: "Cash in Hand", debit: 0, credit: e.amount }
      ]
    });

    addAuditLog("إضافة مصروف مطحنة", `تم إضافة وترحيل مصروف للمطحنة بقيمة ${e.amount} ريال - ${e.notes}`);
  };

  const deleteGrindingExpense = (id: string) => {
    setGrindingExpenses(prev => prev.filter(x => x.id !== id));
    addAuditLog("حذف مصروف مطحنة", `تم حذف مصروف المطحنة ${id}`);
  };

  // Cashbox Voucher with Automated Double-Entry GL Posting
  const addCashboxTransaction = (tx: Omit<CashboxTransaction, "id">) => {
    const id = `tx-${Date.now()}`;
    const newTx: CashboxTransaction = { ...tx, id };
    setCashboxTransactions(prev => [newTx, ...prev]);

    const cashAccId = tx.paymentMethod === "تحويل بنكي" || tx.paymentMethod === "شبكة مدى"
      ? postingConfig.bankAccountId
      : postingConfig.cashAccountId;
    const cashAccName = cashAccId === postingConfig.bankAccountId ? "Al-Rajhi Bank" : "Cash in Hand";

    const counterAccId = tx.type === "receipt"
      ? postingConfig.accountsReceivableAccountId
      : tx.type === "payment"
      ? postingConfig.accountsPayableAccountId
      : postingConfig.generalExpenseAccountId;
    const counterAccName = accounts.find(a => a.id === counterAccId)?.name || "Counter Account";

    postJournalEntry({
      date: tx.date,
      reference: id,
      notes: `سند خزينة (${tx.type === "receipt" ? "قبض" : tx.type === "payment" ? "صرف" : "مصروف"}): ${tx.description}`,
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: tx.type === "receipt"
        ? [
            { id: `jei-cb-dr-${Date.now()}`, accountId: cashAccId, accountName: cashAccName, debit: tx.amount, credit: 0 },
            { id: `jei-cb-cr-${Date.now()}`, accountId: counterAccId, accountName: counterAccName, debit: 0, credit: tx.amount }
          ]
        : [
            { id: `jei-cb-dr-${Date.now()}`, accountId: counterAccId, accountName: counterAccName, debit: tx.amount, credit: 0 },
            { id: `jei-cb-cr-${Date.now()}`, accountId: cashAccId, accountName: cashAccName, debit: 0, credit: tx.amount }
          ]
    });

    addAuditLog("حركة صندوق", `تم تسجيل وترحيل حركة صندوق (${tx.type}) بقيمة ${tx.amount} ريال - ${tx.description}`);
  };

  const deleteCashboxTransaction = (id: string) => {
    setCashboxTransactions(prev => prev.filter(x => x.id !== id));
    addAuditLog("حذف حركة صندوق", `تم حذف حركة الصندوق ${id}`);
  };

  const addCustomerMovement = (m: Omit<CustomerMovement, "id">) => {
    const newMov: CustomerMovement = {
      ...m,
      id: `mov-${Date.now()}`
    };
    setCustomerMovements(prev => [newMov, ...prev]);

    // If customer payment is recorded in Customer Ledger, post GL collection entry
    if (m.type === "payment" && m.amount > 0) {
      const cust = customers.find(c => c.id === m.customerId);
      setCustomers(prev => prev.map(c => c.id === m.customerId ? { ...c, balance: Math.max(0, c.balance - m.amount) } : c));
      postJournalEntry({
        date: m.date,
        reference: m.reference || newMov.id,
        notes: `تحصيل ذمم عميل (${cust?.nameAr || m.customerId}): ${m.notes}`,
        workflowStatus: "Posted",
        currency: Currency.SAR,
        exchangeRate: 1,
        items: [
          { id: `jei-cmov-dr-${Date.now()}`, accountId: postingConfig.cashAccountId, accountName: "Cash in Hand", debit: m.amount, credit: 0 },
          { id: `jei-cmov-cr-${Date.now()}`, accountId: postingConfig.accountsReceivableAccountId, accountName: "Accounts Receivable", debit: 0, credit: m.amount }
        ]
      });
    }
  };

  return (
    <StateContext.Provider value={{
      accounts, warehouses, items, recipes, customers, suppliers,
      journalEntries, batches, roastingJobs, grindingJobs, packagingJobs,
      purchaseOrders, salesInvoices, posSessions, bankTransactions,
      users, auditLogs, backups, currentUser, setCurrentUser,
      
      // Enterprise Core
      companySettings, setCompanySettings,
      exchangeRates, setExchangeRates,
      inventoryAdjustments, stockTransfers, recurringEntries,

      // Foundation Hardening & Financial Integrity
      postingConfig, setPostingConfig,
      costLayers, stockMovements, fiscalPeriods, supplierMovements,

      // Extended Enterprise Domains
      zatcaRecords, salesQuotations, salesOrders, deliveryNotes, salesReturns,
      purchaseRequests, purchaseReturns, fixedAssets, employees, payrollRuns,
      crmLeads, costCenters,

      // Ledger-derived reports & Auditing
      getTrialBalance, getIncomeStatement, getBalanceSheet,
      runDataIntegrityAudit, runMasterCertification,
      
      // Double Entry
      postJournalEntry, reverseJournalEntry,
      addRecurringEntry, postRecurringEntry, fiscalYearClosing,
      toggleFiscalPeriodLock,

      // Document Workflows
      updateDocumentWorkflowStatus,

      // Warehouse Accounting
      addInventoryAdjustment, addStockTransfer, addWarehouse,

      // Production FIFO Costing
      addRecipe, deleteRecipe,
      addRoastingJob, addGrindingJob, addPackagingJob, calculateProductionCost,

      // Procurement and Sales
      addPurchaseOrder, receivePurchaseOrder, addSalesInvoice,
      openPOSSession, closePOSSession,

      // Extended Sales & Procurement Lifecycles
      addSalesQuotation, convertQuotationToOrder, addSalesOrder,
      fulfillSalesOrderToInvoice, addDeliveryNote, addSalesReturn,
      addPurchaseRequest, approvePurchaseRequestToPO, addPurchaseReturn,

      // Treasury, Fixed Assets, HR Payroll, CRM & Cost Centers
      addBankTransaction, addFixedAsset, runDepreciationCycle,
      addEmployee, processPayrollRun, addCrmLead, updateCrmLeadStage, addCostCenter,

      addAuditLog, createBackup, resetToDefault,
      toasts, addToast, removeToast,
      addCustomer, addSupplier, addItem, addAccount,
      updateCustomer, updateSupplier, updateItem, updateAccount,
      deleteCustomer, deleteSupplier, deleteItem, deleteAccount,

      // Custom Coffee Roasting and Grinding Business Workflow States and Methods
      roasteryExpenses, grindingExpenses, cashboxTransactions, customerMovements,
      addRoasteryExpense, deleteRoasteryExpense,
      addGrindingExpense, deleteGrindingExpense,
      addCashboxTransaction, deleteCashboxTransaction,
      addCustomerMovement,

      // RBAC Controls
      permissionsByRole, checkUserPermission
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within a StateProvider");
  }
  return context;
};
