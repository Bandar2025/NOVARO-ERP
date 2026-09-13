// NOVARO ERP Phase 2A.1 — Real Integration & Verification Suite
// Performs REAL HTTP requests against the running Express server on http://localhost:3000

interface EndpointResult {
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number | number[];
  service: string;
  repository: string;
  domainEngine: string;
  passed: boolean;
  notes: string;
}

const BASE_URL = "http://localhost:3000";

async function makeRequest(path: string, options: RequestInit = {}): Promise<{ status: number; body: any; headers: Headers }> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers as Record<string, string> || {})
  };
  const response = await fetch(url, { ...options, headers });
  let body: any;
  const ct = response.headers.get("content-type");
  if (ct && ct.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }
  return { status: response.status, body, headers: response.headers };
}

async function runRealIntegrationSuite() {
  console.log("==================================================================");
  console.log("STARTING NOVARO ERP PHASE 2A.1 REAL INTEGRATION VERIFICATION");
  console.log(`Target: ${BASE_URL}`);
  console.log("==================================================================\n");

  const results: EndpointResult[] = [];

  function record(res: EndpointResult) {
    results.push(res);
    const statusMark = res.passed ? "PASS" : "FAIL";
    console.log(`[${statusMark}] ${res.method.padEnd(5)} ${res.endpoint.padEnd(35)} -> HTTP ${res.status} | ${res.notes}`);
  }

  // 1. Health Check
  const healthRes = await makeRequest("/api/health");
  record({
    endpoint: "/api/health",
    method: "GET",
    status: healthRes.status,
    expectedStatus: 200,
    service: "HealthCheck",
    repository: "N/A",
    domainEngine: "N/A",
    passed: healthRes.status === 200 && healthRes.body?.status === "healthy",
    notes: `Service: ${healthRes.body?.service}, Version: ${healthRes.body?.version}`
  });

  // 2. Accounts: GET /api/v1/accounts
  const getAccountsRes = await makeRequest("/api/v1/accounts");
  const accountsData = getAccountsRes.body?.data || [];
  record({
    endpoint: "/api/v1/accounts",
    method: "GET",
    status: getAccountsRes.status,
    expectedStatus: 200,
    service: "AccountApplicationService",
    repository: "AccountRepository",
    domainEngine: "Derived Ledger Balances",
    passed: getAccountsRes.status === 200 && Array.isArray(accountsData) && accountsData.length > 0,
    notes: `Retrieved ${accountsData.length} accounts with derived balances`
  });

  // 3. Accounts: GET /api/v1/accounts/:id
  const targetAccId = accountsData[0]?.id || "acc-1000";
  const getAccByIdRes = await makeRequest(`/api/v1/accounts/${targetAccId}`);
  record({
    endpoint: `/api/v1/accounts/:id`,
    method: "GET",
    status: getAccByIdRes.status,
    expectedStatus: 200,
    service: "AccountApplicationService",
    repository: "AccountRepository",
    domainEngine: "Derived Balance",
    passed: getAccByIdRes.status === 200 && getAccByIdRes.body?.data?.id === targetAccId,
    notes: `Account '${targetAccId}' fetched: ${getAccByIdRes.body?.data?.name}`
  });

  // 4. Accounts: POST /api/v1/accounts
  const newAccountPayload = {
    code: `99${Math.floor(10 + Math.random() * 89)}`,
    name: "Verification Test Account",
    nameAr: "حساب اختبار التحقق",
    type: "Expense"
  };
  const createAccRes = await makeRequest("/api/v1/accounts", {
    method: "POST",
    body: JSON.stringify(newAccountPayload)
  });
  const createdAccId = createAccRes.body?.data?.id;
  record({
    endpoint: "/api/v1/accounts",
    method: "POST",
    status: createAccRes.status,
    expectedStatus: 201,
    service: "AccountApplicationService",
    repository: "AccountRepository",
    domainEngine: "N/A",
    passed: createAccRes.status === 201 && !!createdAccId,
    notes: `Created Account ID: ${createdAccId}, Code: ${newAccountPayload.code}`
  });

  // 5. Journal Entries: GET /api/v1/journal-entries
  const getJEsRes = await makeRequest("/api/v1/journal-entries");
  const jesData = getJEsRes.body?.data || [];
  record({
    endpoint: "/api/v1/journal-entries",
    method: "GET",
    status: getJEsRes.status,
    expectedStatus: 200,
    service: "JournalEntryApplicationService",
    repository: "JournalEntryRepository",
    domainEngine: "N/A",
    passed: getJEsRes.status === 200 && Array.isArray(jesData),
    notes: `Retrieved ${jesData.length} journal entries`
  });

  // 6. Journal Entries: POST /api/v1/journal-entries (Draft Creation)
  const draftJEPayload = {
    date: "2026-03-15",
    reference: `VERIF-JE-${Date.now()}`,
    notes: "Real Integration Verification Draft",
    items: [
      { accountId: "acc-1000", debit: 500, credit: 0 },
      { accountId: "acc-4000", debit: 0, credit: 500 }
    ]
  };
  const createJERes = await makeRequest("/api/v1/journal-entries", {
    method: "POST",
    body: JSON.stringify(draftJEPayload)
  });
  const createdJE = createJERes.body?.data;
  record({
    endpoint: "/api/v1/journal-entries",
    method: "POST",
    status: createJERes.status,
    expectedStatus: 201,
    service: "JournalEntryApplicationService",
    repository: "JournalEntryRepository",
    domainEngine: "Double-Entry Balance Validation",
    passed: createJERes.status === 201 && createdJE?.workflowStatus === "Draft",
    notes: `Created Draft JE ID: ${createdJE?.id}, Status: ${createdJE?.workflowStatus}`
  });

  // 7. Journal Entries: POST /api/v1/journal-entries/:id/post (Posting & Fiscal Period Lock Check)
  const postJERes = await makeRequest(`/api/v1/journal-entries/${createdJE?.id}/post`, {
    method: "POST",
    body: JSON.stringify({ actor: "TestRunner" })
  });
  record({
    endpoint: "/api/v1/journal-entries/:id/post",
    method: "POST",
    status: postJERes.status,
    expectedStatus: 200,
    service: "JournalEntryApplicationService",
    repository: "JournalEntryRepository + FiscalPeriodRepository",
    domainEngine: "AccountingEngine.postEntry + PeriodLock",
    passed: postJERes.status === 200 && postJERes.body?.data?.workflowStatus === "Posted",
    notes: `Posted JE ${createdJE?.id} successfully`
  });

  // 8. Immutability Verification: PUT /api/v1/journal-entries/:id on Posted Entry (MUST return 409 Conflict)
  const updatePostedRes = await makeRequest(`/api/v1/journal-entries/${createdJE?.id}`, {
    method: "PUT",
    body: JSON.stringify({ notes: "Illegal attempt to mutate posted entry" })
  });
  record({
    endpoint: "/api/v1/journal-entries/:id (Posted)",
    method: "PUT",
    status: updatePostedRes.status,
    expectedStatus: 409,
    service: "JournalEntryApplicationService",
    repository: "JournalEntryRepository",
    domainEngine: "Posted Entry Immutability Rule",
    passed: updatePostedRes.status === 409 && updatePostedRes.body?.error?.code === "POSTED_ENTRY_IMMUTABLE",
    notes: `Correctly rejected modification with 409: ${updatePostedRes.body?.error?.message}`
  });

  // 9. Reversal: POST /api/v1/journal-entries/:id/reverse
  const reverseRes = await makeRequest(`/api/v1/journal-entries/${createdJE?.id}/reverse`, {
    method: "POST",
    body: JSON.stringify({ reason: "Verification Reversal Test" })
  });
  record({
    endpoint: "/api/v1/journal-entries/:id/reverse",
    method: "POST",
    status: reverseRes.status,
    expectedStatus: 200,
    service: "JournalEntryApplicationService",
    repository: "JournalEntryRepository",
    domainEngine: "AccountingEngine.reverseEntry",
    passed: reverseRes.status === 200 && reverseRes.body?.data?.reversalEntry?.reference.includes("REV-"),
    notes: `Created reversal entry: ${reverseRes.body?.data?.reversalEntry?.reference}`
  });

  // 10. Reports: Trial Balance
  const tbRes = await makeRequest("/api/v1/reports/trial-balance");
  const tbData = tbRes.body?.data;
  record({
    endpoint: "/api/v1/reports/trial-balance",
    method: "GET",
    status: tbRes.status,
    expectedStatus: 200,
    service: "TrialBalanceService",
    repository: "AccountRepo + JournalEntryRepo",
    domainEngine: "TrialBalanceService.getTrialBalance",
    passed: tbRes.status === 200 && tbData?.isBalanced === true && tbData?.discrepancy === 0,
    notes: `Debit: ${tbData?.totalDebitSum}, Credit: ${tbData?.totalCreditSum}, Balanced: ${tbData?.isBalanced}`
  });

  // 11. Reports: Income Statement
  const isRes = await makeRequest("/api/v1/reports/income-statement");
  record({
    endpoint: "/api/v1/reports/income-statement",
    method: "GET",
    status: isRes.status,
    expectedStatus: 200,
    service: "TrialBalanceService",
    repository: "AccountRepo + JournalEntryRepo",
    domainEngine: "Income Statement Calculator",
    passed: isRes.status === 200 && typeof isRes.body?.data?.netIncome === "number",
    notes: `Revenue: ${isRes.body?.data?.totalRevenue}, Operating Expenses: ${isRes.body?.data?.totalOperatingExpenses}, Net Income: ${isRes.body?.data?.netIncome}`
  });

  // 12. Reports: Balance Sheet
  const bsRes = await makeRequest("/api/v1/reports/balance-sheet");
  record({
    endpoint: "/api/v1/reports/balance-sheet",
    method: "GET",
    status: bsRes.status,
    expectedStatus: 200,
    service: "TrialBalanceService",
    repository: "AccountRepo + JournalEntryRepo",
    domainEngine: "Balance Sheet Equilibrium",
    passed: bsRes.status === 200 && typeof bsRes.body?.data?.totalAssets === "number",
    notes: `Assets: ${bsRes.body?.data?.totalAssets}, Liabilities + Equity: ${bsRes.body?.data?.totalEquityAndLiabilities}`
  });

  // 13. Customers: GET & POST
  const getCustomersRes = await makeRequest("/api/v1/customers");
  record({
    endpoint: "/api/v1/customers",
    method: "GET",
    status: getCustomersRes.status,
    expectedStatus: 200,
    service: "CustomerApplicationService",
    repository: "CustomerRepository",
    domainEngine: "N/A",
    passed: getCustomersRes.status === 200 && Array.isArray(getCustomersRes.body?.data),
    notes: `Retrieved ${getCustomersRes.body?.data?.length} customer records`
  });

  const newCustPayload = {
    name: "Al-Riyadh Special Roasts",
    nameAr: "محامص الرياض الخاصة",
    email: "riyadh@test.com",
    phone: "+966500001122"
  };
  const createCustRes = await makeRequest("/api/v1/customers", {
    method: "POST",
    body: JSON.stringify(newCustPayload)
  });
  const createdCustId = createCustRes.body?.data?.id;
  record({
    endpoint: "/api/v1/customers",
    method: "POST",
    status: createCustRes.status,
    expectedStatus: 201,
    service: "CustomerApplicationService",
    repository: "CustomerRepository",
    domainEngine: "Subledger Management",
    passed: createCustRes.status === 201 && !!createdCustId,
    notes: `Created Customer ID: ${createdCustId}`
  });

  // 14. Suppliers: GET & POST
  const getSuppliersRes = await makeRequest("/api/v1/suppliers");
  record({
    endpoint: "/api/v1/suppliers",
    method: "GET",
    status: getSuppliersRes.status,
    expectedStatus: 200,
    service: "SupplierApplicationService",
    repository: "SupplierRepository",
    domainEngine: "N/A",
    passed: getSuppliersRes.status === 200 && Array.isArray(getSuppliersRes.body?.data),
    notes: `Retrieved ${getSuppliersRes.body?.data?.length} supplier records`
  });

  const newSuppPayload = {
    name: "Yemeni Origins Trading",
    nameAr: "أصول اليمن لتجارة البن",
    email: "yemen@test.com",
    phone: "+966555112233"
  };
  const createSuppRes = await makeRequest("/api/v1/suppliers", {
    method: "POST",
    body: JSON.stringify(newSuppPayload)
  });
  const createdSuppId = createSuppRes.body?.data?.id;
  record({
    endpoint: "/api/v1/suppliers",
    method: "POST",
    status: createSuppRes.status,
    expectedStatus: 201,
    service: "SupplierApplicationService",
    repository: "SupplierRepository",
    domainEngine: "Subledger Management",
    passed: createSuppRes.status === 201 && !!createdSuppId,
    notes: `Created Supplier ID: ${createdSuppId}`
  });

  // 15. Inventory: Items, Movements, Cost Layers, Batches
  const getInvRes = await makeRequest("/api/v1/inventory");
  record({
    endpoint: "/api/v1/inventory",
    method: "GET",
    status: getInvRes.status,
    expectedStatus: 200,
    service: "InventoryApplicationService",
    repository: "InventoryRepository",
    domainEngine: "Stock Master",
    passed: getInvRes.status === 200 && Array.isArray(getInvRes.body?.data),
    notes: `Retrieved ${getInvRes.body?.data?.length} items`
  });

  const getMovementsRes = await makeRequest("/api/v1/inventory/movements");
  record({
    endpoint: "/api/v1/inventory/movements",
    method: "GET",
    status: getMovementsRes.status,
    expectedStatus: 200,
    service: "InventoryApplicationService",
    repository: "InventoryRepository",
    domainEngine: "Stock Ledger",
    passed: getMovementsRes.status === 200 && Array.isArray(getMovementsRes.body?.data),
    notes: `Retrieved ${getMovementsRes.body?.data?.length} stock movements`
  });

  const getCostLayersRes = await makeRequest("/api/v1/inventory/cost-layers");
  record({
    endpoint: "/api/v1/inventory/cost-layers",
    method: "GET",
    status: getCostLayersRes.status,
    expectedStatus: 200,
    service: "InventoryApplicationService",
    repository: "InventoryRepository",
    domainEngine: "FIFO Cost Layers",
    passed: getCostLayersRes.status === 200 && Array.isArray(getCostLayersRes.body?.data),
    notes: `Retrieved ${getCostLayersRes.body?.data?.length} FIFO cost layers`
  });

  // 16. Sales: POST /api/v1/sales (End-to-End: Sale + Inventory Issue + FIFO + Double-Entry)
  const salePayload = {
    customerId: createdCustId || "cust-1",
    customerName: "Al-Riyadh Special Roasts",
    invoiceDate: "2026-03-15",
    items: [
      {
        itemId: "item-1",
        itemName: "Ethiopian Yirgacheffe (Green)",
        quantity: 5,
        unitPrice: 85,
        taxRate: 0.15
      }
    ]
  };
  const createSaleRes = await makeRequest("/api/v1/sales", {
    method: "POST",
    body: JSON.stringify(salePayload)
  });
  const createdSale = createSaleRes.body?.data;
  record({
    endpoint: "/api/v1/sales",
    method: "POST",
    status: createSaleRes.status,
    expectedStatus: 201,
    service: "SalesApplicationService",
    repository: "SalesRepo + InventoryRepo + CustomerRepo + JournalEntryRepo",
    domainEngine: "CommerceService.processSalesInvoice + InventoryEngine (FIFO)",
    passed: createSaleRes.status === 201 && !!createdSale?.id,
    notes: `Created Sale: ${createdSale?.id}, Subtotal: ${createdSale?.subtotal}, Total: ${createdSale?.totalAmount}`
  });

  // 17. Purchases: POST /api/v1/purchases & Receive
  const purchasePayload = {
    supplierId: createdSuppId || "supp-1",
    supplierName: "Yemeni Origins Trading",
    orderDate: "2026-03-15",
    items: [
      {
        itemId: "item-1",
        itemName: "Ethiopian Yirgacheffe (Green)",
        quantity: 20,
        unitPrice: 45,
        taxRate: 0.15
      }
    ]
  };
  const createPurchaseRes = await makeRequest("/api/v1/purchases", {
    method: "POST",
    body: JSON.stringify(purchasePayload)
  });
  const createdPO = createPurchaseRes.body?.data;
  record({
    endpoint: "/api/v1/purchases",
    method: "POST",
    status: createPurchaseRes.status,
    expectedStatus: 201,
    service: "PurchaseApplicationService",
    repository: "PurchaseRepository",
    domainEngine: "Purchase Order Workflow",
    passed: createPurchaseRes.status === 201 && !!createdPO?.id,
    notes: `Created Purchase Order: ${createdPO?.id}`
  });

  // 18. Purchases: Receive PO (Inventory Receipt + New FIFO Cost Layer + Accounting Journal Entry)
  const receivePORes = await makeRequest(`/api/v1/purchases/${createdPO?.id}/receive`, {
    method: "POST",
    body: JSON.stringify({ receivedDate: "2026-03-15", warehouseId: "wh-raw" })
  });
  record({
    endpoint: "/api/v1/purchases/:id/receive",
    method: "POST",
    status: receivePORes.status,
    expectedStatus: 200,
    service: "PurchaseApplicationService",
    repository: "PurchaseRepo + InventoryRepo + JournalEntryRepo",
    domainEngine: "CommerceService.processPurchaseReceipt + CostLayerCreation",
    passed: receivePORes.status === 200 && receivePORes.body?.data?.status === "Received",
    notes: `Received PO ${createdPO?.id}, Status: ${receivePORes.body?.data?.status}`
  });

  // 19. Error Contract: 400 Validation Error (Empty items)
  const badJERes = await makeRequest("/api/v1/journal-entries", {
    method: "POST",
    body: JSON.stringify({ date: "2026-03-15", items: [] })
  });
  record({
    endpoint: "/api/v1/journal-entries (Invalid)",
    method: "POST",
    status: badJERes.status,
    expectedStatus: 400,
    service: "JournalEntryApplicationService",
    repository: "N/A",
    domainEngine: "Input Validation",
    passed: badJERes.status === 400 && badJERes.body?.success === false && !!badJERes.body?.error?.code,
    notes: `Error code: ${badJERes.body?.error?.code}, Message: ${badJERes.body?.error?.message}`
  });

  // 20. Error Contract: 404 Not Found
  const notFoundRes = await makeRequest("/api/v1/accounts/non-existent-acc-id-99999");
  record({
    endpoint: "/api/v1/accounts/:id (Not Found)",
    method: "GET",
    status: notFoundRes.status,
    expectedStatus: 404,
    service: "AccountApplicationService",
    repository: "AccountRepository",
    domainEngine: "N/A",
    passed: notFoundRes.status === 404 && notFoundRes.body?.success === false && notFoundRes.body?.error?.code === "NOT_FOUND",
    notes: `Error code: ${notFoundRes.body?.error?.code}, Message: ${notFoundRes.body?.error?.message}`
  });

  console.log("\n==================================================================");
  const passedTotal = results.filter(r => r.passed).length;
  console.log(`REAL INTEGRATION TEST COMPLETE: ${passedTotal}/${results.length} PASSED`);
  console.log("==================================================================\n");

  return { results, passedTotal, total: results.length };
}

runRealIntegrationSuite().then(({ passedTotal, total }) => {
  if (passedTotal === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
