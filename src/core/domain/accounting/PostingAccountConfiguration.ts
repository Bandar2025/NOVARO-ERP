// NOVARO ERP Domain Model: Posting Account Configuration
// Eliminates hardcoded account IDs (acc-1000, acc-1300, etc.) from business logic

export interface PostingAccountConfiguration {
  cashAccountId: string;                 // Default: acc-1000 (Cash in Hand)
  bankAccountId: string;                 // Default: acc-1100 (Bank)
  accountsReceivableAccountId: string;   // Default: acc-1200 (Accounts Receivable)
  rawMaterialsInventoryAccountId: string;// Default: acc-1300 (Raw Material Stock)
  finishedGoodsInventoryAccountId: string;// Default: acc-1310 (Finished Product Stock)
  wipInventoryAccountId: string;         // Default: acc-1320 (WIP Inventory)
  accountsPayableAccountId: string;      // Default: acc-2000 (Accounts Payable)
  vatOutputAccountId: string;            // Default: acc-2100 (VAT Payable/Output)
  vatInputAccountId: string;             // Default: acc-1400 (VAT Recoverable/Input)
  wholesaleRevenueAccountId: string;     // Default: acc-4000 (Wholesale Revenue)
  retailRevenueAccountId: string;        // Default: acc-4100 (Retail POS Revenue)
  cogsAccountId: string;                 // Default: acc-5000 (Cost of Goods Sold)
  generalExpenseAccountId: string;       // Default: acc-5200 (Operating Expenses)
  roasteryExpenseAccountId: string;      // Default: acc-5100 (Direct Roastery Cost)
  grindingExpenseAccountId: string;      // Default: acc-5110 (Direct Grinding Cost)
}

export const defaultPostingAccountConfiguration: PostingAccountConfiguration = {
  cashAccountId: "acc-1000",
  bankAccountId: "acc-1100",
  accountsReceivableAccountId: "acc-1200",
  rawMaterialsInventoryAccountId: "acc-1300",
  finishedGoodsInventoryAccountId: "acc-1310",
  wipInventoryAccountId: "acc-1320",
  accountsPayableAccountId: "acc-2000",
  vatOutputAccountId: "acc-2100",
  vatInputAccountId: "acc-2100", // Standard setup or dedicated input vat
  wholesaleRevenueAccountId: "acc-4000",
  retailRevenueAccountId: "acc-4100",
  cogsAccountId: "acc-5000",
  generalExpenseAccountId: "acc-5200",
  roasteryExpenseAccountId: "acc-5100",
  grindingExpenseAccountId: "acc-5100"
};
