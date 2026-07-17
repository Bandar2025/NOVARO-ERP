import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Account, Customer, Supplier, Warehouse, Item, Batch, Recipe, 
  RoastingJob, GrindingJob, PackagingJob, PurchaseOrder, SalesInvoice, 
  POSSession, BankTransaction, User, AuditLog, Backup, JournalEntry, 
  AccountType, JobStatus, ItemCategory, DocumentWorkflowStatus, Currency, 
  UserRole, CompanySettings, InventoryAdjustment, StockTransfer, RecurringEntry,
  ExchangeRate, RoasteryExpense, GrindingExpense, CashboxTransaction, CustomerMovement
} from "../types";
import { 
  initialAccounts, initialWarehouses, initialItems, initialRecipes, 
  initialCustomers, initialSuppliers, initialJournalEntries, initialBatches, 
  initialRoastingJobs, initialGrindingJobs, initialPackagingJobs, initialPurchaseOrders, 
  initialSalesInvoices, initialPOSSessions, initialBankTransactions, initialUsers, 
  initialAuditLogs, initialBackups 
} from "../data/novaroInitialData";

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

  // Double-Entry Accounting
  postJournalEntry: (entry: Omit<JournalEntry, "id" | "posted">) => { success: boolean; error?: string };
  reverseJournalEntry: (entryId: string, reason: string) => { success: boolean; error?: string };
  addRecurringEntry: (rec: Omit<RecurringEntry, "id" | "nextPostingDate">) => void;
  postRecurringEntry: (id: string) => { success: boolean; error?: string };
  fiscalYearClosing: (closingNotes: string) => { success: boolean; error?: string };

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

  // Production and FIFO Costing calculations
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

  // Trade (SRM & POS)
  addPurchaseOrder: (po: Omit<PurchaseOrder, "id">) => void;
  receivePurchaseOrder: (poId: string) => { success: boolean; error?: string };
  addSalesInvoice: (invoice: Omit<SalesInvoice, "id" | "date">, type: "Wholesale" | "Retail" | "POS") => { success: boolean; error?: string };
  openPOSSession: (startingCash: number) => void;
  closePOSSession: () => void;
  
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
    return saved ? JSON.parse(saved) : initialAccounts;
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

  // Sync to local storage when state changes
  useEffect(() => {
    localStorage.setItem("novaro_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("novaro_warehouses", JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem("novaro_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("novaro_recipes", JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem("novaro_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("novaro_suppliers", JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem("novaro_journal_entries", JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem("novaro_batches", JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem("novaro_roasting_jobs", JSON.stringify(roastingJobs));
  }, [roastingJobs]);

  useEffect(() => {
    localStorage.setItem("novaro_grinding_jobs", JSON.stringify(grindingJobs));
  }, [grindingJobs]);

  useEffect(() => {
    localStorage.setItem("novaro_packaging_jobs", JSON.stringify(packagingJobs));
  }, [packagingJobs]);

  useEffect(() => {
    localStorage.setItem("novaro_purchase_orders", JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem("novaro_sales_invoices", JSON.stringify(salesInvoices));
  }, [salesInvoices]);

  useEffect(() => {
    localStorage.setItem("novaro_pos_sessions", JSON.stringify(posSessions));
  }, [posSessions]);

  useEffect(() => {
    localStorage.setItem("novaro_bank_transactions", JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem("novaro_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("novaro_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("novaro_backups", JSON.stringify(backups));
  }, [backups]);

  useEffect(() => {
    localStorage.setItem("novaro_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("novaro_company_settings", JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem("novaro_exchange_rates", JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  useEffect(() => {
    localStorage.setItem("novaro_inventory_adjustments", JSON.stringify(inventoryAdjustments));
  }, [inventoryAdjustments]);

  useEffect(() => {
    localStorage.setItem("novaro_stock_transfers", JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    localStorage.setItem("novaro_recurring_entries", JSON.stringify(recurringEntries));
  }, [recurringEntries]);

  useEffect(() => {
    localStorage.setItem("novaro_roastery_expenses", JSON.stringify(roasteryExpenses));
  }, [roasteryExpenses]);

  useEffect(() => {
    localStorage.setItem("novaro_grinding_expenses", JSON.stringify(grindingExpenses));
  }, [grindingExpenses]);

  useEffect(() => {
    localStorage.setItem("novaro_cashbox_transactions", JSON.stringify(cashboxTransactions));
  }, [cashboxTransactions]);

  useEffect(() => {
    localStorage.setItem("novaro_customer_movements", JSON.stringify(customerMovements));
  }, [customerMovements]);

  // Recalculate account balances based on journal entries
  useEffect(() => {
    const updatedAccounts = accounts.map(acc => {
      let debitSum = 0;
      let creditSum = 0;
      
      journalEntries.forEach(je => {
        const isPosted = je.posted || je.workflowStatus === "Posted";
        if (isPosted) {
          je.items.forEach(item => {
            if (item.accountId === acc.id) {
              debitSum += item.debit;
              creditSum += item.credit;
            }
          });
        }
      });

      // Asset & Expense balance = Debit - Credit
      // Liability, Equity, Income balance = Credit - Debit
      let finalBalance = 0;
      if (acc.type === AccountType.Asset || acc.type === AccountType.Expense) {
        finalBalance = debitSum - creditSum;
      } else {
        finalBalance = creditSum - debitSum;
      }

      return { ...acc, balance: finalBalance };
    });

    // Check if changed before setting to avoid infinite loops
    const hasChanged = JSON.stringify(updatedAccounts) !== JSON.stringify(accounts);
    if (hasChanged) {
      setAccounts(updatedAccounts);
    }
  }, [journalEntries]);

  // Recalculate Item Stocks based on inventory transactions, batches, and operations
  useEffect(() => {
    const updatedItems = items.map(item => {
      const itemBatches = batches.filter(b => b.itemId === item.id);
      const totalStock = itemBatches.reduce((acc, b) => acc + b.quantity, 0);
      return { ...item, currentStock: totalStock };
    });

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

  // 1. Post Journal Entry (Double-Entry Bookkeeping Rules)
  const postJournalEntry = (entry: Omit<JournalEntry, "id" | "posted">) => {
    const totalDebit = entry.items.reduce((acc, item) => acc + item.debit, 0);
    const totalCredit = entry.items.reduce((acc, item) => acc + item.credit, 0);

    // Validate double-entry equality
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return { 
        success: false, 
        error: `Unequal Debits (SAR ${totalDebit.toFixed(2)}) and Credits (SAR ${totalCredit.toFixed(2)}). Journal Entry must balance.` 
      };
    }

    if (entry.items.length < 2) {
      return {
        success: false,
        error: "Journal Entry must contain at least 2 account allocation lines."
      };
    }

    const newId = entry.reference?.startsWith("REV-") ? entry.reference : `JE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry: JournalEntry = {
      ...entry,
      id: newId,
      posted: true,
      workflowStatus: entry.workflowStatus || "Posted",
      currency: entry.currency || Currency.SAR,
      exchangeRate: entry.exchangeRate || 1
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    addAuditLog("Post Journal Entry", `Posted double-entry voucher ${newId} (Total: SAR ${totalDebit.toFixed(2)}) - ${entry.notes}`);
    
    return { success: true };
  };

  // Reverse Journal Entry
  const reverseJournalEntry = (entryId: string, reason: string) => {
    const original = journalEntries.find(j => j.id === entryId);
    if (!original) return { success: false, error: "Journal Entry not found." };
    
    // Create reversed amounts
    const reversedItems = original.items.map(item => ({
      id: `jei-${Math.floor(100000 + Math.random() * 900000)}`,
      accountId: item.accountId,
      accountName: item.accountName,
      debit: item.credit,
      credit: item.debit,
      notes: `Reversal flip of voucher ${original.id} - ${item.notes || ""}`
    }));

    const reverseId = `REV-${original.id}-${Math.floor(100 + Math.random() * 900)}`;
    const result = postJournalEntry({
      date: new Date().toISOString().split("T")[0],
      reference: reverseId,
      notes: `تراجع وقيد عكسي لـ ${original.id}. السبب: ${reason}`,
      items: reversedItems,
      workflowStatus: "Posted",
      currency: original.currency || Currency.SAR,
      exchangeRate: original.exchangeRate || 1
    });

    if (result.success) {
      // Mark original entry as Cancelled
      setJournalEntries(prev => prev.map(j => {
        if (j.id === entryId) {
          return { ...j, workflowStatus: "Cancelled" };
        }
        return j;
      }));
      addAuditLog("Reverse Journal Entry", `Successfully reversed journal voucher ${original.id} via balanced reversal voucher ${reverseId}.`, "Posted", "Cancelled", reason);
    }

    return result;
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

  // Fiscal Year Closing
  const fiscalYearClosing = (closingNotes: string) => {
    // 1. Sum up all Income and Expense balances
    const incomeAccounts = accounts.filter(a => a.type === AccountType.Income);
    const expenseAccounts = accounts.filter(a => a.type === AccountType.Expense);

    let totalIncome = incomeAccounts.reduce((sum, a) => sum + a.balance, 0);
    let totalExpense = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
    let netSurplus = totalIncome - totalExpense;

    if (netSurplus === 0) {
      return { success: false, error: "No earnings/loss to close for the current fiscal period." };
    }

    // 2. Formulate journal entry to zero-out Income and Expenses and post to Retained Earnings
    const jeLineItems: any[] = [];

    // Zero out income accounts (Debit Income)
    incomeAccounts.forEach(acc => {
      if (acc.balance !== 0) {
        jeLineItems.push({
          id: `jei-${Math.random()}`,
          accountId: acc.id,
          accountName: acc.name,
          debit: acc.balance,
          credit: 0,
          notes: "إغلاق أرصدة الإيرادات السنوية"
        });
      }
    });

    // Zero out expense accounts (Credit Expense)
    expenseAccounts.forEach(acc => {
      if (acc.balance !== 0) {
        jeLineItems.push({
          id: `jei-${Math.random()}`,
          accountId: acc.id,
          accountName: acc.name,
          debit: 0,
          credit: acc.balance,
          notes: "إغلاق أرصدة المصاريف السنوية"
        });
      }
    });

    // Post differences to Retained Earnings (acc-3100)
    // If Profit: Credit Retained Earnings
    // If Loss: Debit Retained Earnings
    if (netSurplus > 0) {
      jeLineItems.push({
        id: `jei-earnings`,
        accountId: "acc-3100",
        accountName: "Retained Earnings",
        debit: 0,
        credit: netSurplus,
        notes: "قيد ترحيل الأرباح السنوية المحققة للمركز المالي"
      });
    } else {
      jeLineItems.push({
        id: `jei-earnings`,
        accountId: "acc-3100",
        accountName: "Retained Earnings",
        debit: Math.abs(netSurplus),
        credit: 0,
        notes: "قيد ترحيل الخسائر السنوية المحققة للمركز المالي"
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

  // 2. Add Roasting Job (Deduct green coffee/spices, add roasted intermediate item)
  const addRoastingJob = (job: Omit<RoastingJob, "id" | "weightLossPct">) => {
    const rawBatches = batches.filter(b => b.itemId === job.inputItemId && b.quantity > 0);
    const totalRawAvailable = rawBatches.reduce((acc, b) => acc + b.quantity, 0);

    if (totalRawAvailable < job.inputQuantity) {
      return {
        success: false,
        error: `عذراً: رصيد البن الخام غير كافٍ. المتوفر: ${totalRawAvailable} كغم، المطلوب: ${job.inputQuantity} كغم.`
      };
    }

    // Deduct raw material from oldest batches (FIFO)
    let remainingToDeduct = job.inputQuantity;
    const updatedBatches = batches.map(batch => {
      if (batch.itemId === job.inputItemId && batch.quantity > 0 && remainingToDeduct > 0) {
        if (batch.quantity >= remainingToDeduct) {
          const updatedQty = batch.quantity - remainingToDeduct;
          remainingToDeduct = 0;
          return { ...batch, quantity: parseFloat(updatedQty.toFixed(3)) };
        } else {
          remainingToDeduct -= batch.quantity;
          return { ...batch, quantity: 0 };
        }
      }
      return batch;
    });

    const weightLoss = job.inputQuantity - job.outputQuantity;
    const weightLossPct = parseFloat(((weightLoss / job.inputQuantity) * 100).toFixed(2));

    const jobId = `RST-JOB-${Math.floor(1000 + Math.random() * 9000)}`;
    const completedJob: RoastingJob = {
      ...job,
      id: jobId,
      weightLossPct,
      status: JobStatus.Completed
    };

    const inputItem = items.find(i => i.id === job.inputItemId);
    const outputItem = items.find(i => i.id === job.outputItemId);
    
    const newRoastedBatch: Batch = {
      id: `bat-${Math.floor(100000 + Math.random() * 900000)}`,
      batchNumber: job.batchNumber,
      itemId: job.outputItemId,
      itemName: outputItem?.name || "",
      manufactureDate: job.jobDate,
      expiryDate: new Date(new Date(job.jobDate).setFullYear(new Date(job.jobDate).getFullYear() + 1)).toISOString().split('T')[0],
      quantity: job.outputQuantity,
      costPerUnit: parseFloat((((inputItem?.cost || 0) * job.inputQuantity) / job.outputQuantity).toFixed(2)),
      warehouseId: "wh-2"
    };

    setBatches([...updatedBatches, newRoastedBatch]);
    setRoastingJobs(prev => [completedJob, ...prev]);
    
    addAuditLog("Roasting Job", `Completed Roasting Job ${jobId}. Roasted ${job.inputQuantity}kg of ${inputItem?.name} into ${job.outputQuantity}kg of ${outputItem?.name}.`);
    
    return { success: true };
  };

  // 3. Add Grinding Job (Deduct roasted beans, add ground coffee powder)
  const addGrindingJob = (job: Omit<GrindingJob, "id">) => {
    const targetBatchIndex = batches.findIndex(b => b.batchNumber === job.inputBatchNumber && b.itemId === job.inputItemId);
    
    if (targetBatchIndex === -1) {
      return { success: false, error: `الدفعة رقم '${job.inputBatchNumber}' غير متوفرة بالمستودع.` };
    }
    
    const targetBatch = batches[targetBatchIndex];
    if (targetBatch.quantity < job.inputQuantity) {
      return { success: false, error: `الرصيد المتاح بالتشغيلة غير كافٍ. المتاح: ${targetBatch.quantity} كغم، المطلوب: ${job.inputQuantity} كغم.` };
    }

    const updatedBatches = batches.map((b, idx) => {
      if (idx === targetBatchIndex) {
        return { ...b, quantity: parseFloat((b.quantity - job.inputQuantity).toFixed(3)) };
      }
      return b;
    });

    const jobId = `GRD-JOB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGrindingJob: GrindingJob = {
      ...job,
      id: jobId,
      status: JobStatus.Completed
    };

    const outputItem = items.find(i => i.id === job.outputItemId);
    const newGroundBatch: Batch = {
      id: `bat-${Math.floor(100000 + Math.random() * 900000)}`,
      batchNumber: `G-${job.inputBatchNumber}`,
      itemId: job.outputItemId,
      itemName: outputItem?.name || "",
      manufactureDate: job.jobDate,
      expiryDate: targetBatch.expiryDate,
      quantity: job.outputQuantity,
      costPerUnit: parseFloat((targetBatch.costPerUnit * (job.inputQuantity / job.outputQuantity)).toFixed(2)),
      warehouseId: "wh-2"
    };

    setBatches([...updatedBatches, newGroundBatch]);
    setGrindingJobs(prev => [newGrindingJob, ...prev]);

    addAuditLog("Grinding Job", `Grinding Job ${jobId} Completed: Ground ${job.inputQuantity}kg beans into ${job.outputQuantity}kg ground powder.`);
    
    return { success: true };
  };

  // 4. Add Packaging Job (Deduct ground powder + bags/pouches, add final retail product)
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
    const finalPacksBatch: Batch = {
      id: `bat-${Math.floor(100000 + Math.random() * 900000)}`,
      batchNumber: `P-${job.inputBatchNumber}`,
      itemId: job.finishedItemId,
      itemName: finishedItem?.name || "",
      manufactureDate: job.jobDate,
      expiryDate: powderBatch.expiryDate,
      quantity: job.finishedQty,
      costPerUnit: parseFloat((((powderBatch.costPerUnit * job.inputQuantity) + (pkgItem.cost * job.packagingQtyUsed)) / job.finishedQty).toFixed(2)),
      warehouseId: "wh-3"
    };

    const jobId = `PKG-JOB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPkgJob: PackagingJob = {
      ...job,
      id: jobId,
      status: JobStatus.Completed
    };

    setBatches([...updatedBatches, finalPacksBatch]);
    setPackagingJobs(prev => [newPkgJob, ...prev]);

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

  // 6. Receive Purchase Order (Updates Stock + Triggers Automated Accounting Entry)
  const receivePurchaseOrder = (poId: string) => {
    const poIndex = purchaseOrders.findIndex(p => p.id === poId);
    if (poIndex === -1) return { success: false, error: "Purchase Order not found." };
    
    const po = purchaseOrders[poIndex];
    if (po.status === "Received") return { success: false, error: "Purchase Order has already been received." };

    // Update PO Status
    const updatedPOs = purchaseOrders.map((p, idx) => {
      if (idx === poIndex) return { ...p, status: "Received" as const, workflowStatus: "Posted" as const };
      return p;
    });

    // Create item batches for each received raw material
    const newBatches: Batch[] = po.items.map(pItem => {
      const dbItem = items.find(i => i.id === pItem.itemId);
      return {
        id: `bat-${Math.floor(100000 + Math.random() * 900000)}`,
        batchNumber: `B-${dbItem?.sku}-${new Date().toISOString().slice(2,10).replace(/-/g, "")}`,
        itemId: pItem.itemId,
        itemName: pItem.itemName,
        manufactureDate: po.date,
        expiryDate: new Date(new Date(po.date).setFullYear(new Date(po.date).getFullYear() + 2)).toISOString().split('T')[0],
        quantity: pItem.quantity,
        supplierId: po.supplierId,
        costPerUnit: pItem.price,
        warehouseId: "wh-1"
      };
    });

    // Double Entry for received order (accounting rules)
    const journalItems = [
      { id: "jei-a", accountId: "acc-1300", accountName: "Raw Material Stock", debit: po.totalAmount, credit: 0 },
      { id: "jei-b", accountId: "acc-2000", accountName: "Accounts Payable", debit: 0, credit: po.totalAmount }
    ];

    const accountingResult = postJournalEntry({
      date: po.date,
      reference: po.id,
      notes: `Automated inventory allocation for received Purchase Order ${po.id}`,
      items: journalItems,
      workflowStatus: "Posted",
      currency: po.currency || Currency.SAR,
      exchangeRate: po.exchangeRate || 1
    });

    if (!accountingResult.success) {
      return { success: false, error: `Accounting integration failed: ${accountingResult.error}` };
    }

    // Update supplier outstanding balance
    setSuppliers(prev => prev.map(sup => {
      if (sup.id === po.supplierId) {
        return { ...sup, balance: sup.balance + po.totalAmount };
      }
      return sup;
    }));

    setPurchaseOrders(updatedPOs);
    setBatches(prev => [...prev, ...newBatches]);
    
    addAuditLog("Receive Purchase Order", `Received Goods for ${po.id}. Created inventory batches and processed matching General Ledger entries.`);

    return { success: true };
  };

  // 7. Add Sales Invoice (Wholesale / Retail / POS + Triggers ERP Bookkeeping Engine)
  const addSalesInvoice = (invoice: Omit<SalesInvoice, "id" | "date">, type: "Wholesale" | "Retail" | "POS") => {
    for (const sItem of invoice.items) {
      const dbItem = items.find(i => i.id === sItem.itemId);
      if (!dbItem || dbItem.currentStock < sItem.quantity) {
        return { 
          success: false, 
          error: `عذراً: الرصيد غير كافٍ للصنف '${sItem.itemName}'. المتوفر: ${dbItem?.currentStock || 0} كيس.` 
        };
      }
    }

    // Deduct finished product stocks from FIFO batches
    let updatedBatches = [...batches];
    let totalCogs = 0;

    for (const sItem of invoice.items) {
      let remainingToDeduct = sItem.quantity;
      updatedBatches = updatedBatches.map(batch => {
        if (batch.itemId === sItem.itemId && batch.quantity > 0 && remainingToDeduct > 0) {
          const deduction = Math.min(batch.quantity, remainingToDeduct);
          remainingToDeduct -= deduction;
          totalCogs += deduction * batch.costPerUnit;
          return { ...batch, quantity: parseFloat((batch.quantity - deduction).toFixed(3)) };
        }
        return batch;
      });
    }

    const siId = `SI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceDate = new Date().toISOString().split('T')[0];
    const newInvoice: SalesInvoice = {
      ...invoice,
      id: siId,
      date: invoiceDate,
      type,
      workflowStatus: "Posted"
    };

    // Calculate dynamic ledger allocations
    const debitAccountId = invoice.status === "Paid" 
      ? (type === "POS" ? "acc-1000" : "acc-1100")
      : "acc-1200";
      
    const debitAccountName = invoice.status === "Paid"
      ? (type === "POS" ? "Cash in Hand" : "Al-Rajhi Bank")
      : "Accounts Receivable";

    const creditAccountId = type === "POS" ? "acc-4100" : "acc-4000";
    const creditAccountName = type === "POS" ? "Retail POS Revenue" : "Wholesale Revenue";

    // Double Entry for Sales Value
    const salesJournalItems = [
      { id: "jei-s1", accountId: debitAccountId, accountName: debitAccountName, debit: invoice.totalAmount, credit: 0 },
      { id: "jei-s2", accountId: creditAccountId, accountName: creditAccountName, debit: 0, credit: invoice.totalAmount }
    ];

    // Double Entry for Inventory Cost (COGS Matching Principle)
    const cogsJournalItems = [
      { id: "jei-c1", accountId: "acc-5000", accountName: "Cost of Goods Sold (COGS)", debit: totalCogs, credit: 0 },
      { id: "jei-c2", accountId: "acc-1310", accountName: "Finished Product Stock", debit: 0, credit: totalCogs }
    ];

    // Post Sales entries
    postJournalEntry({
      date: invoiceDate,
      reference: siId,
      notes: `Automated Sales entry for Invoice ${siId} (${type})`,
      items: salesJournalItems,
      workflowStatus: "Posted",
      currency: invoice.currency || Currency.SAR,
      exchangeRate: invoice.exchangeRate || 1
    });

    // Post Cost match entries
    postJournalEntry({
      date: invoiceDate,
      reference: siId,
      notes: `Automated COGS deduction for Invoice ${siId} (Cost of Sales)`,
      items: cogsJournalItems,
      workflowStatus: "Posted",
      currency: invoice.currency || Currency.SAR,
      exchangeRate: invoice.exchangeRate || 1
    });

    // If Unpaid, increase customer accounts balance
    if (invoice.status === "Unpaid") {
      setCustomers(prev => prev.map(cust => {
        if (cust.id === invoice.customerId) {
          return { ...cust, balance: cust.balance + invoice.totalAmount };
        }
        return cust;
      }));
    }

    // Register cash/bank transaction if paid
    if (invoice.status === "Paid") {
      const newTx: BankTransaction = {
        id: `tx-${Math.floor(100000 + Math.random() * 900000)}`,
        date: invoiceDate,
        type: "Deposit",
        amount: invoice.totalAmount,
        description: `Customer payment received for Sales Invoice ${siId}`,
        accountName: type === "POS" ? "Cash" : "Al-Rajhi Bank"
      };
      setBankTransactions(prev => [newTx, ...prev]);
    }

    setBatches(updatedBatches);
    setSalesInvoices(prev => [newInvoice, ...prev]);

    // Update POS Session counters if it's a POS sale
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

    addAuditLog("Sales Invoice", `Dispatched Sales Invoice ${siId} (${type}). Deducted warehouse lots, posted matching COGS.`);

    return { success: true };
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

  // 9. Close POS Session
  const closePOSSession = () => {
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

  // Warehouse Adjustments & Transfers Creator
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

      // If approved/posted, update stock and post automated journal entries!
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

      // If approved/posted, execute transfer across warehouses
      if (status === "Posted" && oldStatus !== "Posted") {
        let remaining = trans.quantity;
        const updatedBatches = batches.map(b => {
          if (b.itemId === trans.itemId && b.warehouseId === trans.fromWarehouseId && b.quantity > 0 && remaining > 0) {
            const deduct = Math.min(b.quantity, remaining);
            remaining -= deduct;
            setTimeout(() => {
              const targetBatch: Batch = {
                id: `bat-${Math.floor(100000 + Math.random() * 900000)}`,
                batchNumber: `TR-${b.batchNumber}`,
                itemId: trans.itemId,
                itemName: trans.itemName,
                manufactureDate: trans.date,
                expiryDate: b.expiryDate,
                quantity: deduct,
                costPerUnit: b.costPerUnit,
                warehouseId: trans.toWarehouseId
              };
              setBatches(p => [...p, targetBatch]);
            }, 10);
            return { ...b, quantity: parseFloat((b.quantity - deduct).toFixed(3)) };
          }
          return b;
        });
        setBatches(updatedBatches);
      }
    }

    const logDetails = `Updated ${docType} ID ${docId} workflow status from ${oldStatus} to ${status}. Reason: ${reason || "N/A"}`;
    addAuditLog(`Workflow status update (${docType})`, logDetails, oldStatus, status, reason);

    return { success: true };
  };

  // RBAC Access controls
  const permissionsByRole: Record<UserRole, { pages: string[]; actions: string[] }> = {
    Admin: {
      pages: ["overview", "accounting", "customers", "suppliers", "purchases", "sales", "inventory", "production", "pos", "reports"],
      actions: ["create", "edit", "approve", "post", "cancel", "delete", "configure"]
    },
    Owner: {
      pages: ["overview", "accounting", "customers", "suppliers", "purchases", "sales", "inventory", "production", "pos", "reports"],
      actions: ["create", "edit", "approve", "post", "cancel", "configure"]
    },
    Accountant: {
      pages: ["overview", "accounting", "customers", "suppliers", "purchases", "sales", "reports"],
      actions: ["create", "edit", "post", "cancel"]
    },
    "Warehouse Manager": {
      pages: ["overview", "inventory", "suppliers", "purchases"],
      actions: ["create", "edit", "transfer", "receive"]
    },
    "Production Manager": {
      pages: ["overview", "production", "inventory"],
      actions: ["create", "edit", "roast", "grind", "package"]
    },
    Cashier: {
      pages: ["pos", "customers"],
      actions: ["create", "sell", "checkout"]
    },
    "POS Operator": {
      pages: ["pos", "customers"],
      actions: ["create", "sell", "checkout"]
    },
    Sales: {
      pages: ["sales", "customers"],
      actions: ["create", "sell"]
    },
    Purchasing: {
      pages: ["purchases", "suppliers"],
      actions: ["create", "buy"]
    },
    Auditor: {
      pages: ["overview", "accounting", "reports"],
      actions: ["view"]
    },
    Viewer: {
      pages: ["overview", "reports"],
      actions: ["view"]
    }
  };

  const checkUserPermission = (page: string, action: string) => {
    const rolePerms = permissionsByRole[currentUser.role];
    if (!rolePerms) return false;
    
    const hasPage = rolePerms.pages.includes(page);
    if (!hasPage) return false;

    if (action) {
      if (currentUser.role === "Admin" || currentUser.role === "Owner") return true;
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
      recurringEntries
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
    setCompanySettings({
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
    });
    setExchangeRates([
      { id: "rate-1", date: "2026-07-09", from: Currency.USD, to: Currency.SAR, rate: 3.75 },
      { id: "rate-2", date: "2026-07-09", from: Currency.SAR, to: Currency.USD, rate: 0.267 },
      { id: "rate-3", date: "2026-07-09", from: Currency.USD, to: Currency.YER, rate: 250.0 },
      { id: "rate-4", date: "2026-07-09", from: Currency.SAR, to: Currency.YER, rate: 66.6 },
      { id: "rate-5", date: "2026-07-09", from: Currency.YER, to: Currency.SAR, rate: 0.015 },
      { id: "rate-6", date: "2026-07-09", from: Currency.YER, to: Currency.USD, rate: 0.004 }
    ]);
    setInventoryAdjustments([]);
    setStockTransfers([]);
    setRecurringEntries([
      { id: "rec-1", name: "إيجار صالة المعرض الشهري المجدول", frequency: "Monthly", referenceEntryId: "JE-2026-0002", nextPostingDate: "2026-08-01", active: true }
    ]);
    
    addAuditLog("Factory Reset", "Restored ERP database schemas to pristine initial seeds.");
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

  const addRoasteryExpense = (e: Omit<RoasteryExpense, "id">) => {
    const newExp: RoasteryExpense = {
      ...e,
      id: `re-${Date.now()}`
    };
    setRoasteryExpenses(prev => [newExp, ...prev]);
    addAuditLog("إضافة مصروف محمصة", `تم إضافة مصروف للمحمصة بقيمة ${e.amount} ريال - ${e.notes}`);
  };

  const deleteRoasteryExpense = (id: string) => {
    setRoasteryExpenses(prev => prev.filter(x => x.id !== id));
    addAuditLog("حذف مصروف محمصة", `تم حذف مصروف المحمصة ${id}`);
  };

  const addGrindingExpense = (e: Omit<GrindingExpense, "id">) => {
    const newExp: GrindingExpense = {
      ...e,
      id: `ge-${Date.now()}`
    };
    setGrindingExpenses(prev => [newExp, ...prev]);
    addAuditLog("إضافة مصروف مطحنة", `تم إضافة مصروف للمطحنة بقيمة ${e.amount} ريال - ${e.notes}`);
  };

  const deleteGrindingExpense = (id: string) => {
    setGrindingExpenses(prev => prev.filter(x => x.id !== id));
    addAuditLog("حذف مصروف مطحنة", `تم حذف مصروف المطحنة ${id}`);
  };

  const addCashboxTransaction = (tx: Omit<CashboxTransaction, "id">) => {
    const newTx: CashboxTransaction = {
      ...tx,
      id: `tx-${Date.now()}`
    };
    setCashboxTransactions(prev => [newTx, ...prev]);
    addAuditLog("حركة صندوق", `تم تسجيل حركة صندوق (${tx.type}) بقيمة ${tx.amount} ريال - ${tx.description}`);
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
      
      // Double Entry
      postJournalEntry, reverseJournalEntry,
      addRecurringEntry, postRecurringEntry, fiscalYearClosing,

      // Document Workflows
      updateDocumentWorkflowStatus,

      // Warehouse Accounting
      addInventoryAdjustment, addStockTransfer,

      // Production FIFO Costing
      addRoastingJob, addGrindingJob, addPackagingJob, calculateProductionCost,

      // Procurement and Sales
      addPurchaseOrder, receivePurchaseOrder, addSalesInvoice,
      openPOSSession, closePOSSession, addAuditLog, createBackup, resetToDefault,
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
