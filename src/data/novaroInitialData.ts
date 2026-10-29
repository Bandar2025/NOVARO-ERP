import { 
  Account, AccountType, Customer, Supplier, Warehouse, Item, ItemCategory, 
  Recipe, JournalEntry, Batch, RoastingJob, GrindingJob, PackagingJob, 
  PurchaseOrder, SalesInvoice, POSSession, BankTransaction, User, AuditLog, Backup,
  JobStatus, Currency, SalesQuotation, SalesOrder, DeliveryNote, SalesReturn, PurchaseRequest,
  PurchaseReturn, FixedAsset, Employee, PayrollRun, CrmLead, CostCenter
} from "../types";

// Chart of Accounts (Double Entry Standard)
export const initialAccounts: Account[] = [
  { id: "acc-1000", code: "1000", name: "Cash in Hand", nameAr: "النقدية في الصندوق", type: AccountType.Asset, balance: 125000 },
  { id: "acc-1100", code: "1100", name: "Al-Rajhi Bank", nameAr: "مصرف الراجحي", type: AccountType.Asset, balance: 450000 },
  { id: "acc-1200", code: "1200", name: "Accounts Receivable", nameAr: "الذمم المدينة (العملاء)", type: AccountType.Asset, balance: 45000 },
  { id: "acc-1300", code: "1300", name: "Raw Material Stock", nameAr: "مخزون المواد الخام", type: AccountType.Asset, balance: 85000 },
  { id: "acc-1310", code: "1310", name: "Finished Product Stock", nameAr: "مخزون المنتجات النهائية", type: AccountType.Asset, balance: 62000 },
  { id: "acc-1320", code: "1320", name: "Work in Progress (WIP)", nameAr: "مخزون تحت التشغيل (تحميص وطحن)", type: AccountType.Asset, balance: 0 },
  { id: "acc-1400", code: "1400", name: "Machinery & Equipment", nameAr: "الآلات والمعدات (المحامص)", type: AccountType.Asset, balance: 180000 },
  
  { id: "acc-2000", code: "2000", name: "Accounts Payable", nameAr: "الذمم الدائنة (الموردين)", type: AccountType.Liability, balance: 35000 },
  { id: "acc-2100", code: "2100", name: "Sales Tax Payable", nameAr: "ضريبة القيمة المضافة المستحقة", type: AccountType.Liability, balance: 12200 },
  
  { id: "acc-3000", code: "3000", name: "Owner's Capital", nameAr: "رأس المال", type: AccountType.Equity, balance: 800000 },
  { id: "acc-3100", code: "3100", name: "Retained Earnings", nameAr: "الأرباح المبقاة", type: AccountType.Equity, balance: 94800 },
  
  { id: "acc-4000", code: "4000", name: "Wholesale Revenue", nameAr: "إيرادات بيع الجملة", type: AccountType.Income, balance: 0 },
  { id: "acc-4100", code: "4100", name: "Retail POS Revenue", nameAr: "إيرادات نقطة البيع بالتجزئة", type: AccountType.Income, balance: 0 },
  
  { id: "acc-5000", code: "5000", name: "Cost of Goods Sold (COGS)", nameAr: "تكلفة البضاعة المباعة", type: AccountType.Expense, balance: 0 },
  { id: "acc-5100", code: "5100", name: "Roasting Factory Rent", nameAr: "إيجار مصنع التحميص", type: AccountType.Expense, balance: 15000 },
  { id: "acc-5200", code: "5200", name: "Electricity & Utilities", nameAr: "الكهرباء والمرافق", type: AccountType.Expense, balance: 4200 },
  { id: "acc-5300", code: "5300", name: "Wages & Salaries", nameAr: "الرواتب والأجور", type: AccountType.Expense, balance: 35000 }
];

// Seed Warehouses
export const initialWarehouses: Warehouse[] = [
  { id: "wh-1", name: "Main Raw Materials Warehouse", nameAr: "مستودع المواد الخام الرئيسي", location: "Dammam Industrial Zone 2" },
  { id: "wh-2", name: "Roasting & Grinding Floor", nameAr: "صالة التحميص والطحن", location: "Dammam Industrial Zone 2 - Section A" },
  { id: "wh-3", name: "Finished Goods Warehouse", nameAr: "مستودع المنتجات النهائية", location: "Dammam Industrial Zone 2 - Section B" },
  { id: "wh-4", name: "POS Retail Showroom", nameAr: "معرض مبيعات التجزئة (نقطة البيع)", location: "Riyadh Olaya District" }
];

// Seed Items / Catalog
export const initialItems: Item[] = [
  // Raw Coffee Beans
  { id: "item-1", name: "Ethiopian Yirgacheffe (Green)", nameAr: "بن إثيوبي ييرجاشيف (خام)", sku: "RAW-ETH-001", category: ItemCategory.GreenCoffee, unit: "kg", price: 0, cost: 28, barcode: "62810001001", currentStock: 1200 },
  { id: "item-2", name: "Brazilian Santos (Green)", nameAr: "بن برزيلي سانتوس (خام)", sku: "RAW-BRZ-002", category: ItemCategory.GreenCoffee, unit: "kg", price: 0, cost: 22, barcode: "62810001002", currentStock: 2500 },
  
  // Raw Spices
  { id: "item-3", name: "Guatemalan Cardamom (Green)", nameAr: "هيل غواتيمالي أخضر (خام)", sku: "RAW-CRD-003", category: ItemCategory.RawSpices, unit: "kg", price: 0, cost: 75, barcode: "62810001003", currentStock: 350 },
  { id: "item-4", name: "Indian Black Pepper (Whole)", nameAr: "فلفل أسود هندي كامل (خام)", sku: "RAW-BPP-004", category: ItemCategory.RawSpices, unit: "kg", price: 0, cost: 18, barcode: "62810001004", currentStock: 600 },
  
  // Intermediate (Roasted)
  { id: "item-5", name: "Ethiopian Roasted Beans (Medium)", nameAr: "بن إثيوبي محمص (وسط)", sku: "RST-ETH-001", category: ItemCategory.RoastedCoffee, unit: "kg", price: 55, cost: 35, barcode: "62810001005", currentStock: 150 },
  { id: "item-6", name: "Brazilian Roasted Beans (Dark)", nameAr: "بن برزيلي محمص (غامق)", sku: "RST-BRZ-002", category: ItemCategory.RoastedCoffee, unit: "kg", price: 48, cost: 28, barcode: "62810001006", currentStock: 300 },
  
  // Intermediate (Ground)
  { id: "item-7", name: "Ethiopian Ground Coffee", nameAr: "بن إثيوبي مطحون", sku: "GRD-ETH-001", category: ItemCategory.GroundCoffee, unit: "kg", price: 65, cost: 38, barcode: "62810001007", currentStock: 80 },
  { id: "item-8", name: "Saudi Blend Spiced Coffee", nameAr: "قهوة سعودية بالهيل والزعفران", sku: "GRD-SAU-002", category: ItemCategory.GroundCoffee, unit: "kg", price: 90, cost: 52, barcode: "62810001008", currentStock: 120 },

  // Packaging Materials
  { id: "item-9", name: "Premium Aluminium Pouch 250g", nameAr: "أكياس ألومنيوم فاخرة 250 غرام", sku: "PKG-PCH-250", category: ItemCategory.PackagingMaterial, unit: "pcs", price: 0, cost: 0.8, barcode: "62810001009", currentStock: 5000 },
  { id: "item-10", name: "Novaro Outer Carton Box", nameAr: "كرتون خارجي نوفارو", sku: "PKG-CRT-001", category: ItemCategory.PackagingMaterial, unit: "pcs", price: 0, cost: 1.5, barcode: "62810001010", currentStock: 1200 },

  // Finished Retail Packages (Final Products)
  { id: "item-11", name: "Novaro Cardamom Coffee Pouch 250g", nameAr: "قهوة نوفارو بالهيل كيس 250 غرام", sku: "FIN-NOV-CRD250", category: ItemCategory.FinishedProduct, unit: "pouch", price: 32, cost: 16.5, barcode: "62810001011", currentStock: 450 },
  { id: "item-12", name: "Novaro Espresso Roast Beans Bag 1kg", nameAr: "بن نوفارو إسبريسو كيس 1 كغم", sku: "FIN-NOV-ESP1KG", category: ItemCategory.FinishedProduct, unit: "bag", price: 85, cost: 42.0, barcode: "62810001012", currentStock: 210 },
  { id: "item-13", name: "Ground Black Pepper Jar 100g", nameAr: "فلفل أسود مطحون علبة 100 غرام", sku: "FIN-SP-BPP100", category: ItemCategory.FinishedProduct, unit: "jar", price: 12, cost: 4.8, barcode: "62810001013", currentStock: 620 }
];

// Seed Recipes
export const initialRecipes: Recipe[] = [
  {
    id: "rec-1",
    name: "Espresso Blend (Medium Roast)",
    nameAr: "خلطة الإسبريسو (تحميص وسط)",
    description: "60% Brazilian Santos and 40% Ethiopian Yirgacheffe roasted to medium grade for standard espresso extract.",
    outputItemId: "item-12", // Espresso Bag 1kg
    outputItemName: "Novaro Espresso Roast Beans Bag 1kg",
    rawMaterials: [
      { itemId: "item-2", itemName: "Brazilian Santos (Green)", quantity: 0.7 }, // 700g raw beans
      { itemId: "item-1", itemName: "Ethiopian Yirgacheffe (Green)", quantity: 0.5 }, // 500g raw beans (total raw = 1.2kg, factoring in roasting weight loss of ~16%)
      { itemId: "item-9", itemName: "Premium Aluminium Pouch 250g", quantity: 4 } // Needs 4 pouches for 1kg
    ]
  },
  {
    id: "rec-2",
    name: "Classic Spiced Saudi Coffee Blend",
    nameAr: "خلطة القهوة السعودية الكلاسيكية بالهيل",
    description: "Traditional light roast coffee blended with 15% freshly ground Guatemalan cardamom.",
    outputItemId: "item-11", // Novaro Cardamom Pouch 250g
    outputItemName: "Novaro Cardamom Coffee Pouch 250g",
    rawMaterials: [
      { itemId: "item-1", itemName: "Ethiopian Yirgacheffe (Green)", quantity: 0.22 }, // 220g raw coffee
      { itemId: "item-3", itemName: "Guatemalan Cardamom (Green)", quantity: 0.04 },  // 40g raw cardamom
      { itemId: "item-9", itemName: "Premium Aluminium Pouch 250g", quantity: 1 }      // 1 pouch
    ]
  }
];

// Customers & Suppliers
export const initialCustomers: Customer[] = [
  { id: "cust-1", name: "Al-Othaim Supermarkets", nameAr: "أسواق العثيم المركزية", email: "purchasing@othaim.com", phone: "+966 11 493 2000", address: "Riyadh, Eastern Ring Rd", balance: 24500 },
  { id: "cust-2", name: "Tamimi Markets", nameAr: "أسواق التميمي", email: "vendors@tamimimarkets.com", phone: "+966 13 867 7500", address: "Khobar, Prince Turki St", balance: 20500 },
  { id: "cust-3", name: "Coffee Corner Riyadh", nameAr: "مقهى ركن القهوة الرياض", email: "info@coffeecorner.sa", phone: "+966 50 123 4567", address: "Riyadh, Tahlia Street", balance: 0 }
];

export const initialSuppliers: Supplier[] = [
  { id: "sup-1", name: "African Beans Trading Ltd", nameAr: "الشركة الأفريقية لتجارة البن", email: "sales@africanbeans.co", phone: "+251 11 551 1234", address: "Addis Ababa, Ethiopia", balance: 15000 },
  { id: "sup-2", name: "Sabor Latino Import S.A.", nameAr: "سابور لاتينو للاستيراد والتصدير", email: "export@saborlatino.br", phone: "+55 11 3814 9000", address: "Santos, Brazil", balance: 20000 },
  { id: "sup-3", name: "Gulf Packaging Solutions", nameAr: "حلول التغليف الخليجية", email: "info@gulfpack.sa", phone: "+966 13 812 5555", address: "Dammam Second Industrial City", balance: 0 }
];

// Sample Journal Entries (Double Entry Bookkeeping - 100% Balanced & Sub-Ledger Matched)
export const initialJournalEntries: JournalEntry[] = [
  {
    id: "JE-2026-0001",
    date: "2026-07-01",
    reference: "OB-2026",
    notes: "القيد الافتتاحي المعتمد لمصنع ومحمصة نوفارو للقهوة (Opening Balances)",
    posted: true,
    workflowStatus: "Posted",
    currency: Currency.SAR,
    exchangeRate: 1,
    items: [
      { id: "jei-1", accountId: "acc-1100", accountName: "Al-Rajhi Bank", debit: 465000, credit: 0 },
      { id: "jei-2", accountId: "acc-1000", accountName: "Cash in Hand", debit: 109625, credit: 0 },
      { id: "jei-3", accountId: "acc-1200", accountName: "Accounts Receivable", debit: 45000, credit: 0 },
      { id: "jei-4", accountId: "acc-1300", accountName: "Raw Material Stock", debit: 85000, credit: 0 },
      { id: "jei-5", accountId: "acc-1310", accountName: "Finished Product Stock", debit: 93800, credit: 0 },
      { id: "jei-6", accountId: "acc-1400", accountName: "Machinery & Equipment", debit: 180000, credit: 0 },
      { id: "jei-7", accountId: "acc-2000", accountName: "Accounts Payable", debit: 0, credit: 35000 },
      { id: "jei-8", accountId: "acc-2100", accountName: "VAT Payable (15%)", debit: 0, credit: 5425 },
      { id: "jei-9", accountId: "acc-3000", accountName: "Owner's Capital", debit: 0, credit: 800000 },
      { id: "jei-10", accountId: "acc-3100", accountName: "Retained Earnings", debit: 0, credit: 138000 }
    ]
  },
  {
    id: "JE-2026-0002",
    date: "2026-07-05",
    reference: "RENT-07-26",
    notes: "سداد إيجار المصنع والمحمصة الشهري ومصاريف الطاقة من مصرف الراجحي",
    posted: true,
    workflowStatus: "Posted",
    currency: Currency.SAR,
    exchangeRate: 1,
    items: [
      { id: "jei-11", accountId: "acc-5100", accountName: "Roasting Factory Rent", debit: 15000, credit: 0 },
      { id: "jei-12", accountId: "acc-5200", accountName: "Utilities & Power (Roasters)", debit: 4200, credit: 0 },
      { id: "jei-13", accountId: "acc-5300", accountName: "Staff Salaries & Wages", debit: 28000, credit: 0 },
      { id: "jei-14", accountId: "acc-1100", accountName: "Al-Rajhi Bank", debit: 0, credit: 47200 }
    ]
  },
  {
    id: "JE-2026-0003",
    date: "2026-07-09",
    reference: "SI-2026-0001",
    notes: "إثبات مبيعات الجملة والتجزئة النقدية والآجلة مع ضريبة القيمة المضافة وتكلفة البضاعة المباعة",
    posted: true,
    workflowStatus: "Posted",
    currency: Currency.SAR,
    exchangeRate: 1,
    items: [
      { id: "jei-15", accountId: "acc-1100", accountName: "Al-Rajhi Bank", debit: 132200, credit: 0 },
      { id: "jei-16", accountId: "acc-1000", accountName: "Cash in Hand", debit: 15375, credit: 0 },
      { id: "jei-17", accountId: "acc-4000", accountName: "Wholesale Revenue", debit: 0, credit: 115000 },
      { id: "jei-18", accountId: "acc-4100", accountName: "POS Retail Revenue", debit: 0, credit: 15500 },
      { id: "jei-19", accountId: "acc-2100", accountName: "VAT Payable (15%)", debit: 0, credit: 17075 },
      { id: "jei-20", accountId: "acc-5000", accountName: "Cost of Goods Sold (COGS)", debit: 31800, credit: 0 },
      { id: "jei-21", accountId: "acc-1310", accountName: "Finished Product Stock", debit: 0, credit: 31800 }
    ]
  }
];

// Seed Batches (Reconciled 100% with GL Inventory Control Accounts: 85,000 Raw + 62,000 Finished = 147,000 SAR)
export const initialBatches: Batch[] = [
  { id: "bat-001", batchNumber: "B-ETH-260701", itemId: "item-1", itemName: "Ethiopian Yirgacheffe (Green)", manufactureDate: "2026-07-01", expiryDate: "2028-07-01", quantity: 1000, supplierId: "sup-1", costPerUnit: 28, warehouseId: "wh-1" },
  { id: "bat-002", batchNumber: "B-BRZ-260702", itemId: "item-2", itemName: "Brazilian Santos (Green)", manufactureDate: "2026-07-02", expiryDate: "2028-07-02", quantity: 1500, supplierId: "sup-2", costPerUnit: 22, warehouseId: "wh-1" },
  { id: "bat-003", batchNumber: "B-CRD-260703", itemId: "item-3", itemName: "Guatemalan Cardamom (Green)", manufactureDate: "2026-07-03", expiryDate: "2028-07-03", quantity: 200, supplierId: "sup-1", costPerUnit: 75, warehouseId: "wh-1" },
  { id: "bat-004", batchNumber: "B-RST-ETH-01", itemId: "item-5", itemName: "Ethiopian Roasted Beans (Medium)", manufactureDate: "2026-07-06", expiryDate: "2027-07-06", quantity: 300, costPerUnit: 36, warehouseId: "wh-2" },
  { id: "bat-005", batchNumber: "B-GRD-ETH-01", itemId: "item-7", itemName: "Ethiopian Ground Coffee", manufactureDate: "2026-07-07", expiryDate: "2027-07-07", quantity: 100, costPerUnit: 38, warehouseId: "wh-2" },
  { id: "bat-006", batchNumber: "B-PKG-PCH-01", itemId: "item-9", itemName: "Premium Aluminium Pouch 250g", manufactureDate: "2026-07-01", expiryDate: "2030-07-01", quantity: 11250, costPerUnit: 0.8, warehouseId: "wh-1" },
  { id: "bat-007", batchNumber: "B-FIN-CRD-01", itemId: "item-11", itemName: "Novaro Cardamom Coffee Pouch 250g", manufactureDate: "2026-07-08", expiryDate: "2027-07-08", quantity: 1600, costPerUnit: 16.5, warehouseId: "wh-3" },
  { id: "bat-008", batchNumber: "B-FIN-ESP-01", itemId: "item-12", itemName: "Novaro Espresso Roast Beans Bag 1kg", manufactureDate: "2026-07-08", expiryDate: "2027-07-08", quantity: 500, costPerUnit: 42.0, warehouseId: "wh-3" }
];

// Roasting, Grinding, and Packaging jobs
export const initialRoastingJobs: RoastingJob[] = [
  {
    id: "RST-JOB-001",
    jobDate: "2026-07-06",
    batchNumber: "RST-ETH-M260706",
    recipeId: "rec-2",
    recipeName: "Classic Spiced Saudi Coffee Blend",
    inputItemId: "item-1",
    inputQuantity: 50,
    outputItemId: "item-5",
    outputQuantity: 42, // factor in roasting moisture loss
    roastTimeMinutes: 14.5,
    tempCelsius: 205,
    weightLossPct: 16,
    status: JobStatus.Completed,
    workerName: "Mustafa"
  },
  {
    id: "RST-JOB-002",
    jobDate: "2026-07-07",
    batchNumber: "RST-BRZ-D260707",
    recipeId: "rec-1",
    recipeName: "Espresso Blend (Medium Roast)",
    inputItemId: "item-2",
    inputQuantity: 100,
    outputItemId: "item-6",
    outputQuantity: 83.5,
    roastTimeMinutes: 16.2,
    tempCelsius: 215,
    weightLossPct: 16.5,
    status: JobStatus.Completed,
    workerName: "Ali"
  }
];

export const initialGrindingJobs: GrindingJob[] = [
  {
    id: "GRD-JOB-001",
    jobDate: "2026-07-08",
    inputBatchNumber: "RST-ETH-M260706",
    inputItemId: "item-5",
    inputQuantity: 20,
    outputItemId: "item-7",
    outputQuantity: 19.8, // minimal weight loss due to dust
    status: JobStatus.Completed
  }
];

export const initialPackagingJobs: PackagingJob[] = [
  {
    id: "PKG-JOB-001",
    jobDate: "2026-07-08",
    inputBatchNumber: "RST-ETH-M260706",
    inputItemId: "item-7",
    inputQuantity: 10, // 10 kg
    packagingItemId: "item-9", // pouch 250g
    packagingQtyUsed: 40, // 40 pouches
    finishedItemId: "item-11", // final cardamom pouches
    finishedQty: 40,
    status: JobStatus.Completed
  }
];

// Seed Trade: Purchase & Sales
export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-2026-0001",
    supplierId: "sup-1",
    supplierName: "African Beans Trading Ltd",
    date: "2026-07-04",
    status: "Received",
    items: [
      { itemId: "item-1", itemName: "Ethiopian Yirgacheffe (Green)", quantity: 200, price: 28, total: 5600 },
      { itemId: "item-3", itemName: "Guatemalan Cardamom (Green)", quantity: 30, price: 75, total: 2250 }
    ],
    totalAmount: 7850
  }
];

export const initialSalesInvoices: SalesInvoice[] = [
  {
    id: "SI-2026-0001",
    customerId: "cust-1",
    customerName: "Al-Othaim Supermarkets",
    date: "2026-07-08",
    status: "Paid",
    type: "Wholesale",
    items: [
      { itemId: "item-11", itemName: "Novaro Cardamom Coffee Pouch 250g", quantity: 150, price: 32, total: 4800 },
      { itemId: "item-12", itemName: "Novaro Espresso Roast Beans Bag 1kg", quantity: 30, price: 85, total: 2550 }
    ],
    subtotal: 6391.30,
    taxAmount: 958.70,
    totalAmount: 7350
  }
];

// POS, bank transactions
export const initialPOSSessions: POSSession[] = [
  { id: "pos-001", openedAt: "2026-07-09T08:00:00.000Z", closedAt: "2026-07-09T15:30:00.000Z", startingCash: 1000, salesCount: 24, totalCashSales: 1680, totalCardSales: 2150, status: "Closed" }
];

export const initialBankTransactions: BankTransaction[] = [
  { id: "tx-001", date: "2026-07-05", type: "Withdrawal", amount: 15000, description: "Office Monthly Factory Rent", accountName: "Al-Rajhi Bank" },
  { id: "tx-002", date: "2026-07-08", type: "Deposit", amount: 7350, description: "Al-Othaim Sales Invoice SI-2026-0001 Payment", accountName: "Al-Rajhi Bank" }
];

// System Users, Logs, Backups
export const initialUsers: User[] = [
  { id: "usr-1", username: "ahmad_novaro", email: "ahmadadmen908@gmail.com", role: "Admin" },
  { id: "usr-2", username: "mustafa_roaster", email: "mustafa@novaro-erp.sa", role: "Production Manager" },
  { id: "usr-3", username: "sara_accountant", email: "sara@novaro-erp.sa", role: "Accountant" },
  { id: "usr-4", username: "ali_pos", email: "ali@novaro-erp.sa", role: "POS Operator" }
];

export const initialAuditLogs: AuditLog[] = [
  { id: "log-1", timestamp: "2026-07-09T14:32:10.000Z", userId: "usr-1", username: "ahmad_novaro", action: "COA Update", details: "Adjusted Account 1100 (Al-Rajhi Bank) initial ledger balance." },
  { id: "log-2", timestamp: "2026-07-09T15:10:45.000Z", userId: "usr-2", username: "mustafa_roaster", action: "Roasting Job Creation", details: "Fitted Espresso Blend recipe batch #RST-BRZ-D260707." }
];

export const initialBackups: Backup[] = [
  { id: "bak-1", filename: "novaro_erp_prod_2026_07_01.sql.gz", createdAt: "2026-07-01 01:00:00", size: "4.8 MB" },
  { id: "bak-2", filename: "novaro_erp_prod_2026_07_08.sql.gz", createdAt: "2026-07-08 01:00:00", size: "5.1 MB" }
];

// Extended Enterprise Lifecycle Seed Data
export const initialSalesQuotations: SalesQuotation[] = [
  {
    id: "QT-2026-1001",
    customerId: "cust-2",
    customerName: "أسواق التميمي",
    date: "2026-07-09",
    validUntil: "2026-07-25",
    items: [
      { itemId: "item-11", itemName: "قهوة نوفارو بالهيل كيس 250 غرام", quantity: 200, price: 32, total: 6400 },
      { itemId: "item-12", itemName: "بن نوفارو إسبريسو كيس 1 كغم", quantity: 50, price: 85, total: 4250 }
    ],
    subtotal: 10650,
    taxAmount: 1597.5,
    totalAmount: 12247.5,
    status: "Sent",
    notes: "عرض أسعار توريد الربع الثالث لفروع المنطقة الشرقية"
  }
];

export const initialSalesOrders: SalesOrder[] = [
  {
    id: "SO-2026-2001",
    quotationId: "QT-2026-1001",
    customerId: "cust-1",
    customerName: "أسواق العثيم المركزية",
    date: "2026-07-09",
    deliveryDate: "2026-07-12",
    items: [
      { itemId: "item-11", itemName: "قهوة نوفارو بالهيل كيس 250 غرام", quantity: 100, price: 32, total: 3200 }
    ],
    subtotal: 3200,
    taxAmount: 480,
    totalAmount: 3680,
    status: "Confirmed",
    notes: "توريد مستودع الرياض الرئيسي"
  }
];

export const initialDeliveryNotes: DeliveryNote[] = [
  {
    id: "DN-2026-3001",
    salesOrderId: "SO-2026-2001",
    invoiceId: "SI-2026-0001",
    customerId: "cust-1",
    customerName: "أسواق العثيم المركزية",
    date: "2026-07-08",
    warehouseId: "wh-3",
    driverName: "فهد الدوسري",
    vehiclePlate: "أ ب ج 4821",
    items: [
      { itemId: "item-11", itemName: "قهوة نوفارو بالهيل كيس 250 غرام", quantity: 150 },
      { itemId: "item-12", itemName: "بن نوفارو إسبريسو كيس 1 كغم", quantity: 30 }
    ],
    status: "Delivered"
  }
];

export const initialSalesReturns: SalesReturn[] = [];

export const initialPurchaseRequests: PurchaseRequest[] = [
  {
    id: "PR-2026-4001",
    requesterName: "مصطفى - مدير الإنتاج",
    department: "Roastery & Production",
    date: "2026-07-09",
    neededBy: "2026-07-18",
    items: [
      { itemId: "item-1", itemName: "بن إثيوبي ييرجاشيف (خام)", quantity: 500, estimatedCost: 28 },
      { itemId: "item-9", itemName: "أكياس ألومنيوم فاخرة 250 غرام", quantity: 2000, estimatedCost: 0.8 }
    ],
    totalEstimated: 15600,
    status: "Pending",
    notes: "تعزيز مخزون البن الأخضر وأكياس التعبئة لخطة تحميص شهر أغسطس"
  }
];

export const initialPurchaseReturns: PurchaseReturn[] = [];

export const initialFixedAssets: FixedAsset[] = [
  {
    id: "fa-1",
    code: "FA-RST-001",
    name: "Probat P60 Industrial Coffee Roaster",
    nameAr: "محمصة بروبات صناعية سعة 60 كجم",
    category: "Machinery",
    purchaseDate: "2025-01-15",
    acquisitionCost: 120000,
    salvageValue: 12000,
    usefulLifeYears: 10,
    accumulatedDepreciation: 16200,
    bookValue: 103800,
    location: "صالة التحميص والطحن - الدمام",
    status: "Active"
  },
  {
    id: "fa-2",
    code: "FA-GRD-002",
    name: "Mahlkönig Industrial Roller Grinder",
    nameAr: "طاحونة صناعية ألمانية عالية الدقة",
    category: "Machinery",
    purchaseDate: "2025-03-01",
    acquisitionCost: 42000,
    salvageValue: 2000,
    usefulLifeYears: 8,
    accumulatedDepreciation: 6250,
    bookValue: 35750,
    location: "صالة التحميص والطحن - الدمام",
    status: "Active"
  },
  {
    id: "fa-3",
    code: "FA-PKG-003",
    name: "Nitrogen Flush Vertical Packaging Line",
    nameAr: "خط تعبئة وتغليف بالنيتروجين آلي",
    category: "Machinery",
    purchaseDate: "2025-06-01",
    acquisitionCost: 18000,
    salvageValue: 1000,
    usefulLifeYears: 5,
    accumulatedDepreciation: 3400,
    bookValue: 14600,
    location: "قسم التغليف النهائي - الدمام",
    status: "Active"
  }
];

export const initialEmployees: Employee[] = [
  {
    id: "emp-1",
    code: "EMP-1001",
    name: "Mustafa Al-Harbi",
    nameAr: "مصطفى الحربي",
    roleTitle: "مدير التحميص والجودة",
    department: "Roastery",
    basicSalary: 9500,
    housingAllowance: 2375,
    transportAllowance: 950,
    joinDate: "2024-02-01",
    status: "Active"
  },
  {
    id: "emp-2",
    code: "EMP-1002",
    name: "Sara Al-Qahtani",
    nameAr: "سارة القحطاني",
    roleTitle: "رئيسة الحسابات والضرائب",
    department: "Accounting",
    basicSalary: 11000,
    housingAllowance: 2750,
    transportAllowance: 1000,
    joinDate: "2024-03-15",
    status: "Active"
  },
  {
    id: "emp-3",
    code: "EMP-1003",
    name: "Ali Al-Zahrani",
    nameAr: "علي الزهراني",
    roleTitle: "مشرف خطوط الطحن والتعبئة",
    department: "Grinding",
    basicSalary: 6800,
    housingAllowance: 1700,
    transportAllowance: 700,
    joinDate: "2024-06-10",
    status: "Active"
  },
  {
    id: "emp-4",
    code: "EMP-1004",
    name: "Saleh Al-Otaibi",
    nameAr: "صالح العتيبي",
    roleTitle: "مسؤول مبيعات الجملة ونقاط البيع",
    department: "Sales",
    basicSalary: 7200,
    housingAllowance: 1800,
    transportAllowance: 800,
    joinDate: "2025-01-01",
    status: "Active"
  }
];

export const initialPayrollRuns: PayrollRun[] = [
  {
    id: "PAY-2026-06",
    periodMonth: "2026-06",
    runDate: "2026-06-28",
    employeeCount: 4,
    totalBasic: 34500,
    totalAllowances: 12075,
    totalDeductions: 3450,
    netPayable: 43125,
    paymentMethod: "Bank",
    journalEntryId: "JE-2026-0001",
    status: "Posted"
  }
];

export const initialCrmLeads: CrmLead[] = [
  {
    id: "lead-1",
    companyName: "فنادق ومنتجعات الريتز - الرياض",
    contactPerson: "أ. سلطان الشمري",
    phone: "+966 55 892 1044",
    email: "procurement@ritz-hospitality.sa",
    stage: "Negotiation",
    expectedValue: 85000,
    assignedTo: "صالح العتيبي",
    nextFollowUp: "2026-07-15",
    notes: "توريد شهري 400 كجم إسبريسو مختص + 200 كجم قهوة سعودية بالهيل"
  },
  {
    id: "lead-2",
    companyName: "سلسلة مقاهي أرابيكا الخليج",
    contactPerson: "م. نايف السبيعي",
    phone: "+966 50 411 7890",
    email: "supply@arabicagulf.sa",
    stage: "Proposal",
    expectedValue: 48000,
    assignedTo: "صالح العتيبي",
    nextFollowUp: "2026-07-18",
    notes: "طلب عينات تحميص وسط إثيوبي ييرجاشيف"
  }
];

export const initialCostCenters: CostCenter[] = [
  {
    id: "cc-100",
    code: "CC-RST-100",
    name: "Industrial Roastery & Kilns",
    nameAr: "مركز تكلفة صالة التحميص والأفران",
    manager: "مصطفى الحربي",
    budgetAllocated: 250000,
    actualSpent: 142650,
    department: "Roastery",
    status: "Active"
  },
  {
    id: "cc-200",
    code: "CC-GRD-200",
    name: "Milling, Spice Blending & Packaging",
    nameAr: "مركز تكلفة الطحن والخلط والتغليف",
    manager: "علي الزهراني",
    budgetAllocated: 150000,
    actualSpent: 84200,
    department: "Grinding & Packaging",
    status: "Active"
  },
  {
    id: "cc-300",
    code: "CC-SLS-300",
    name: "Wholesale Logistics & Retail Showrooms",
    nameAr: "مركز تكلفة التوزيع ومعارض التجزئة",
    manager: "صالح العتيبي",
    budgetAllocated: 120000,
    actualSpent: 61500,
    department: "Sales & Distribution",
    status: "Active"
  }
];

