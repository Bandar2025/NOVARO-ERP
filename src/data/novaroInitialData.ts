import { 
  Account, AccountType, Customer, Supplier, Warehouse, Item, ItemCategory, 
  Recipe, JournalEntry, Batch, RoastingJob, GrindingJob, PackagingJob, 
  PurchaseOrder, SalesInvoice, POSSession, BankTransaction, User, AuditLog, Backup,
  JobStatus
} from "../types";

// Chart of Accounts (Double Entry Standard)
export const initialAccounts: Account[] = [
  { id: "acc-1000", code: "1000", name: "Cash in Hand", nameAr: "النقدية في الصندوق", type: AccountType.Asset, balance: 125000 },
  { id: "acc-1100", code: "1100", name: "Al-Rajhi Bank", nameAr: "مصرف الراجحي", type: AccountType.Asset, balance: 450000 },
  { id: "acc-1200", code: "1200", name: "Accounts Receivable", nameAr: "الذمم المدينة (العملاء)", type: AccountType.Asset, balance: 45000 },
  { id: "acc-1300", code: "1300", name: "Raw Material Stock", nameAr: "مخزون المواد الخام", type: AccountType.Asset, balance: 85000 },
  { id: "acc-1310", code: "1310", name: "Finished Product Stock", nameAr: "مخزون المنتجات النهائية", type: AccountType.Asset, balance: 62000 },
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

// Sample Journal Entries (Double Entry Bookkeeping)
export const initialJournalEntries: JournalEntry[] = [
  {
    id: "JE-2026-0001",
    date: "2026-07-01",
    reference: "OB-2026",
    notes: "Opening balance setup of Novaro Roasting Factory",
    posted: true,
    items: [
      { id: "jei-1", accountId: "acc-1100", accountName: "Al-Rajhi Bank", debit: 450000, credit: 0 },
      { id: "jei-2", accountId: "acc-1000", accountName: "Cash in Hand", debit: 125000, credit: 0 },
      { id: "jei-3", accountId: "acc-1400", accountName: "Machinery & Equipment", debit: 180000, credit: 0 },
      { id: "jei-4", accountId: "acc-1300", accountName: "Raw Material Stock", debit: 85000, credit: 0 },
      { id: "jei-5", accountId: "acc-3000", accountName: "Owner's Capital", debit: 0, credit: 800000 },
      { id: "jei-6", accountId: "acc-3100", accountName: "Retained Earnings", debit: 0, credit: 40000 }
    ]
  },
  {
    id: "JE-2026-0002",
    date: "2026-07-05",
    reference: "RENT-07-26",
    notes: "Payment of monthly factory rent from Al-Rajhi Bank",
    posted: true,
    items: [
      { id: "jei-7", accountId: "acc-5100", accountName: "Roasting Factory Rent", debit: 15000, credit: 0 },
      { id: "jei-8", accountId: "acc-1100", accountName: "Al-Rajhi Bank", debit: 0, credit: 15000 }
    ]
  }
];

// Seed Batches
export const initialBatches: Batch[] = [
  { id: "bat-001", batchNumber: "B-ETH-260701", itemId: "item-1", itemName: "Ethiopian Yirgacheffe (Green)", manufactureDate: "2026-07-01", expiryDate: "2028-07-01", quantity: 800, supplierId: "sup-1", costPerUnit: 28, warehouseId: "wh-1" },
  { id: "bat-002", batchNumber: "B-BRZ-260702", itemId: "item-2", itemName: "Brazilian Santos (Green)", manufactureDate: "2026-07-02", expiryDate: "2028-07-02", quantity: 1500, supplierId: "sup-2", costPerUnit: 22, warehouseId: "wh-1" },
  { id: "bat-003", batchNumber: "B-CRD-260703", itemId: "item-3", itemName: "Guatemalan Cardamom (Green)", manufactureDate: "2026-07-03", expiryDate: "2028-07-03", quantity: 200, supplierId: "sup-1", costPerUnit: 75, warehouseId: "wh-1" }
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
