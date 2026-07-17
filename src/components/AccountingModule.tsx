import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { AccountType, JournalEntryItem, Currency, DocumentWorkflowStatus, UserRole } from "../types";
import { 
  Plus, Search, Calendar, FileText, Check, AlertTriangle, 
  FolderMinus, FolderPlus, BookOpen, Layers, ArrowLeftRight, Landmark, 
  CreditCard, RotateCw, Printer, ShieldCheck, RefreshCw, Landmark as BankIcon,
  DollarSign, FileSpreadsheet, Building2, Globe, Settings, Scale, AlertCircle, Trash2, ArrowLeft, Send
} from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface AccountingModuleProps {
  language?: "ar" | "en";
}

export default function AccountingModule({ language = "ar" }: AccountingModuleProps) {
  const isAr = language === "ar";
  const { 
    accounts, journalEntries, postJournalEntry, reverseJournalEntry, 
    companySettings, setCompanySettings, exchangeRates, setExchangeRates, 
    recurringEntries, postRecurringEntry, addRecurringEntry, fiscalYearClosing,
    updateDocumentWorkflowStatus, addToast, currentUser, checkUserPermission 
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<
    "coa" | "je" | "workflow" | "recurring" | "exchange" | "closing" | "settings" | "cash_banks"
  >("coa");

  // State for Journal Entry Voucher Builder
  const [jeDate, setJeDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [jeReference, setJeReference] = useState<string>("");
  const [jeNotes, setJeNotes] = useState<string>("");
  const [jeCurrency, setJeCurrency] = useState<Currency>(Currency.SAR);
  const [jeExchangeRate, setJeExchangeRate] = useState<number>(1);
  const [jeWorkflowStatus, setJeWorkflowStatus] = useState<DocumentWorkflowStatus>("Draft");
  const [jeItems, setJeItems] = useState<Omit<JournalEntryItem, "id">[]>([
    { accountId: "", accountName: "", debit: 0, credit: 0, notes: "" },
    { accountId: "", accountName: "", debit: 0, credit: 0, notes: "" }
  ]);
  const [jeError, setJeError] = useState<string | null>(null);
  const [jeSuccess, setJeSuccess] = useState<string | null>(null);

  // Reversal dialog state
  const [reversalEntryId, setReversalEntryId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState<string>("");

  // Recurring form state
  const [newRecName, setNewRecName] = useState("");
  const [newRecFreq, setNewRecFreq] = useState<"Monthly" | "Weekly" | "Quarterly">("Monthly");
  const [newRecRefId, setNewRecRefId] = useState("");

  // Fiscal Closing state
  const [closingNotes, setClosingNotes] = useState("");
  const [closingError, setClosingError] = useState<string | null>(null);
  const [closingSuccess, setClosingSuccess] = useState<string | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(companySettings);

  // State for Cash & Bank transfers
  const [transferSource, setTransferSource] = useState("");
  const [transferDest, setTransferDest] = useState("");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferMemo, setTransferMemo] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);

  // State for General Ledger Filter
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>("");

  // COA expansion tracking
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    Asset: true,
    Liability: true,
    Equity: true,
    Income: true,
    Expense: true
  });

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  // Group Accounts by Type for Tree
  const accountsByType = {
    [AccountType.Asset]: accounts.filter(a => a.type === AccountType.Asset),
    [AccountType.Liability]: accounts.filter(a => a.type === AccountType.Liability),
    [AccountType.Equity]: accounts.filter(a => a.type === AccountType.Equity),
    [AccountType.Income]: accounts.filter(a => a.type === AccountType.Income),
    [AccountType.Expense]: accounts.filter(a => a.type === AccountType.Expense)
  };

  // Handle currency swap inside JE builder
  const handleJeCurrencyChange = (cur: Currency) => {
    setJeCurrency(cur);
    if (cur === Currency.SAR) {
      setJeExchangeRate(1);
    } else {
      // Find default rate
      const foundRate = exchangeRates.find(r => r.from === cur && r.to === Currency.SAR);
      setJeExchangeRate(foundRate ? foundRate.rate : 1);
    }
  };

  // Journal Entry Voucher Handlers
  const handleJeItemChange = (index: number, field: keyof Omit<JournalEntryItem, "id">, value: any) => {
    const updated = [...jeItems];
    if (field === "accountId") {
      const acc = accounts.find(a => a.id === value);
      updated[index].accountId = value;
      updated[index].accountName = acc ? acc.name : "";
    } else if (field === "debit" || field === "credit") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setJeItems(updated);
  };

  const addJeRow = () => {
    setJeItems([...jeItems, { accountId: "", accountName: "", debit: 0, credit: 0, notes: "" }]);
  };

  const removeJeRow = (index: number) => {
    if (jeItems.length <= 2) return;
    setJeItems(jeItems.filter((_, idx) => idx !== index));
  };

  const handlePostJe = (e: React.FormEvent) => {
    e.preventDefault();
    setJeError(null);
    setJeSuccess(null);

    const emptyAccounts = jeItems.some(item => !item.accountId);
    if (emptyAccounts) {
      setJeError(isAr ? "يرجى تحديد حساب مالي نشط لجميع السطور." : "Please select an active account for all lines.");
      return;
    }

    const totalDebits = jeItems.reduce((acc, item) => acc + item.debit, 0);
    const totalCredits = jeItems.reduce((acc, item) => acc + item.credit, 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      setJeError(isAr ? "تنبيه: مجموع المدين لا يتطابق مع مجموع الدائن." : "Error: Debits do not balance with Credits.");
      return;
    }

    // Convert entries to base currency (SAR) if not already
    const baseItems = jeItems.map(item => ({
      ...item,
      id: `jei-${Math.floor(100000 + Math.random() * 900000)}`,
      debit: parseFloat((item.debit * jeExchangeRate).toFixed(2)),
      credit: parseFloat((item.credit * jeExchangeRate).toFixed(2)),
      notes: `${item.notes || ""} [Orig: ${jeCurrency} ${item.debit > 0 ? item.debit : item.credit}]`
    }));

    const result = postJournalEntry({
      date: jeDate,
      reference: jeReference || "JV-MANUAL",
      notes: jeNotes || "Manual Journal Adjustment Voucher",
      workflowStatus: jeWorkflowStatus,
      currency: jeCurrency,
      exchangeRate: jeExchangeRate,
      items: baseItems
    });

    if (result.success) {
      setJeSuccess(
        isAr 
          ? "تم حفظ قيد التسوية المزدوج بنجاح وتحديث ميزان المراجعة الفوري!" 
          : "Double-Entry Journal adjustment registered and verified successfully!"
      );
      setJeReference("");
      setJeNotes("");
      setJeItems([
        { accountId: "", accountName: "", debit: 0, credit: 0, notes: "" },
        { accountId: "", accountName: "", debit: 0, credit: 0, notes: "" }
      ]);
      addToast({
        type: "success",
        message: "تم ترحيل قيد التسوية بنجاح",
        messageEn: "Manual journal entry created successfully"
      });
    } else {
      setJeError(result.error || "Failed to post journal entry.");
    }
  };

  // Perform Cash / Bank internal transfer
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (!transferSource || !transferDest) {
      setTransferError(isAr ? "يرجى اختيار الحساب المصدر والحساب المستلم." : "Source and destination accounts are required.");
      return;
    }

    if (transferSource === transferDest) {
      setTransferError(isAr ? "خطأ: لا يمكن التحويل لنفس الحساب المالي." : "Cannot transfer to the same account.");
      return;
    }

    if (transferAmount <= 0) {
      setTransferError(isAr ? "يرجى تحديد مبلغ إيداع صالح أكبر من صفر." : "Please enter a valid transfer amount.");
      return;
    }

    const srcAccount = accounts.find(a => a.id === transferSource);
    if (!srcAccount || srcAccount.balance < transferAmount) {
      setTransferError(
        isAr 
          ? `عذراً: رصيد حساب المصدر غير كافٍ لإجراء العملية. المتاح: ${srcAccount?.balance || 0} ر.س` 
          : "Insufficient funds in source cash/bank account."
      );
      return;
    }

    const destAccount = accounts.find(a => a.id === transferDest);
    
    const itemsToPost = [
      {
        id: `jei-${Math.floor(100000 + Math.random() * 900000)}`,
        accountId: transferDest,
        accountName: destAccount?.name || "Deposit Bank",
        debit: transferAmount,
        credit: 0,
        notes: transferMemo || (isAr ? "إيداع نقدية بين الحسابات" : "Internal funds transfer")
      },
      {
        id: `jei-${Math.floor(100000 + Math.random() * 900000)}`,
        accountId: transferSource,
        accountName: srcAccount?.name || "Source Cash Drawer",
        debit: 0,
        credit: transferAmount,
        notes: transferMemo || (isAr ? "إيداع نقدية بين الحسابات" : "Internal funds transfer")
      }
    ];

    const result = postJournalEntry({
      date: new Date().toISOString().split("T")[0],
      reference: "BNK-TRANSFER",
      notes: transferMemo || (isAr ? "تحويل نقدية داخلي بين الخزينة والبنك" : "Internal cash-to-bank transfer"),
      workflowStatus: "Posted",
      currency: Currency.SAR,
      exchangeRate: 1,
      items: itemsToPost
    });

    if (result.success) {
      setTransferAmount(0);
      setTransferMemo("");
      addToast({
        type: "success",
        message: "تم ترحيل قيد تحويل السيولة النقدية وتحديث حسابات المصرف والصندوق فورا",
        messageEn: "Financial transfer complete: General ledger updated for cash-to-bank"
      });
    } else {
      setTransferError(result.error || "Transfer failed.");
    }
  };

  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecName || !newRecRefId) return;

    addRecurringEntry({
      name: newRecName,
      frequency: newRecFreq,
      referenceEntryId: newRecRefId,
      active: true
    });

    setNewRecName("");
    setNewRecRefId("");
    addToast({
      type: "success",
      message: "تم إنشاء جدول مكرر للحساب المالي",
      messageEn: "Recurring entry formula registered successfully"
    });
  };

  const handleTriggerRecurring = (id: string) => {
    const res = postRecurringEntry(id);
    if (res.success) {
      addToast({
        type: "success",
        message: "تم توليد وترحيل القيد الدوري بنجاح وتحديث الأستاذ العام!",
        messageEn: "Recurring template processed successfully!"
      });
    } else {
      addToast({
        type: "error",
        message: `فشل توليد القيد: ${res.error}`,
        messageEn: `Failed: ${res.error}`
      });
    }
  };

  const handleApplyWorkflow = (docId: string, nextStatus: DocumentWorkflowStatus) => {
    const res = updateDocumentWorkflowStatus("journalEntry", docId, nextStatus, isAr ? "تغيير حالة السند يدوياً" : "Manual workflow change");
    if (res.success) {
      addToast({
        type: "success",
        message: `تم تحديث حالة قيد اليومية إلى ${nextStatus}`,
        messageEn: `Voucher state updated to ${nextStatus}`
      });
    } else {
      addToast({
        type: "error",
        message: res.error || "Failed to update workflow state",
        messageEn: res.error || "Failed"
      });
    }
  };

  const handleIssueReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalEntryId || !reversalReason) return;

    const res = reverseJournalEntry(reversalEntryId, reversalReason);
    if (res.success) {
      setReversalEntryId(null);
      setReversalReason("");
      addToast({
        type: "success",
        message: "تم توليد قيد اليومية العكسي المتوازن بنجاح وإلغاء القيد الأصلي",
        messageEn: "Balanced reversal voucher created successfully"
      });
    } else {
      addToast({
        type: "error",
        message: res.error || "Failed to reverse entry",
        messageEn: res.error || "Failed"
      });
    }
  };

  const handleYearClosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClosingError(null);
    setClosingSuccess(null);

    const res = fiscalYearClosing(closingNotes || "إقفال ختامي للفترة المالية السنوية وتصفية الإيرادات والمصاريف");
    if (res.success) {
      setClosingSuccess(isAr ? "تم إقفال الفترة المالية بنجاح وترحيل صافي الربح إلى الأرباح المبقاة بالميزانية!" : "Fiscal year successfully closed! Income statement swept to Retained Earnings.");
      setClosingNotes("");
    } else {
      setClosingError(res.error || "Year closing procedure failed.");
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySettings(settingsForm);
    addToast({
      type: "success",
      message: "تم حفظ إعدادات الشركة ومعلومات الضريبة بنجاح",
      messageEn: "Company details and VAT rules updated successfully"
    });
  };

  const totalDebits = jeItems.reduce((acc, item) => acc + item.debit, 0);
  const totalCredits = jeItems.reduce((acc, item) => acc + item.credit, 0);
  const difference = Math.abs(totalDebits - totalCredits);

  // Compute General Ledger Lines
  const getLedgerEntries = () => {
    const entries: {
      jeId: string;
      date: string;
      reference: string;
      notes: string;
      debit: number;
      credit: number;
    }[] = [];

    journalEntries.forEach(je => {
      const isPosted = je.posted || je.workflowStatus === "Posted";
      if (isPosted) {
        je.items.forEach(item => {
          if (selectedLedgerAccountId === "" || item.accountId === selectedLedgerAccountId) {
            entries.push({
              jeId: je.id,
              date: je.date,
              reference: je.reference,
              notes: item.notes || je.notes,
              debit: item.debit,
              credit: item.credit
            });
          }
        });
      }
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const ledgerLines = getLedgerEntries();
  const cashAndBankAccounts = accounts.filter(a => a.code === "1000" || a.code === "1100");

  return (
    <div className="space-y-6 text-right" id="novaro-accounting">
      
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-widest font-mono block">
            {isAr ? "نظام الرقابة المالية والأستاذ العام للمؤسسات" : "FINANCIAL CORE ENGINE"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 justify-end">
            <BookOpen className="w-6 h-6 text-teal-700" />
            {isAr ? "نظام الأستاذ العام والعملات المتعددة" : "Double-Entry Bookkeeping"}
          </h1>
        </div>

        {/* Responsive subtabs list */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-bold">
          <button
            onClick={() => setActiveSubTab("coa")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "coa" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            {isAr ? "شجرة الحسابات" : "Chart of Accounts"}
          </button>
          <button
            onClick={() => setActiveSubTab("je")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "je" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            {isAr ? "منشئ القيود" : "Journal Vouchers"}
          </button>
          <button
            onClick={() => setActiveSubTab("workflow")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "workflow" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            {isAr ? "رقابة القيود والترحيل" : "Workflow Control"}
          </button>
          <button
            onClick={() => setActiveSubTab("recurring")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "recurring" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            {isAr ? "القيود الدورية" : "Recurring Templates"}
          </button>
          <button
            onClick={() => setActiveSubTab("exchange")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "exchange" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            {isAr ? "أسعار الصرف" : "Exchange Rates"}
          </button>
          <button
            onClick={() => setActiveSubTab("closing")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "closing" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            {isAr ? "إقفال السنة المالية" : "Year End Closing"}
          </button>
          <button
            onClick={() => setActiveSubTab("cash_banks")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "cash_banks" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            {isAr ? "الخزينة والتحويلات" : "Cash & Banks"}
          </button>
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "settings" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Settings className="w-3.5 h-3.5 inline mr-1" />
            {isAr ? "إعدادات الشركة" : "Settings"}
          </button>
        </div>
      </div>

      {/* 1. CHART OF ACCOUNTS (IFRS Tree) */}
      {activeSubTab === "coa" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded">IFRS / SOCPA Compliance</span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "الهيكل الهرمي المعتمد لشجرة الحسابات" : "Visual Account Hierarchy"}</h3>
                <p className="text-[10px] text-slate-500">{isAr ? "تتبع الأرصدة والتقارير المالية الفورية بالتوافق مع معايير IFRS" : "Real-time assets, liabilities and equity chart."}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {Object.keys(accountsByType).map((typeKey) => {
                const folderAccounts = accountsByType[typeKey as AccountType];
                const isOpen = expandedFolders[typeKey];
                const folderTotal = folderAccounts.reduce((sum, acc) => sum + acc.balance, 0);

                return (
                  <div key={typeKey} className="border border-slate-150 rounded-xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => toggleFolder(typeKey)}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/85 transition text-right"
                    >
                      <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded">
                        SAR {folderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 font-sans">{typeKey}s</span>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest font-sans">
                            {typeKey === AccountType.Asset ? "الأصول" : typeKey === AccountType.Liability ? "الالتزامات" : typeKey === AccountType.Equity ? "حقوق الملكية" : typeKey === AccountType.Income ? "الإيرادات" : "المصاريف"}
                          </span>
                        </div>
                        {isOpen ? <FolderMinus className="w-4.5 h-4.5 text-teal-700" /> : <FolderPlus className="w-4.5 h-4.5 text-slate-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="bg-white divide-y divide-slate-100 px-4 py-1">
                        {folderAccounts.map((acc) => (
                          <div key={acc.id} className="flex items-center justify-between py-3 text-xs">
                            <span className={`font-mono font-bold ${acc.balance >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                              SAR {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="font-extrabold text-slate-800 block">{isAr ? acc.nameAr : acc.name}</span>
                                <span className="text-[10px] text-slate-400 font-sans font-medium">{isAr ? acc.name : acc.nameAr}</span>
                              </div>
                              <span className="font-mono text-slate-400 font-bold">{acc.code}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 h-fit text-xs text-right">
            <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "قواعد الرقابة والتحكم" : "Assurance Rules"}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              {isAr 
                ? "يتم ترحيل جميع حركات المستودعات والبيع في نقاط البيع والتحميص بشكل فوري وتلقائي إلى دفتر الأستاذ دون معالجات يدوية."
                : "Real-time automated transaction posting."}
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest block font-sans">{isAr ? "توازن الأرصدة المزدوجة" : "Double-Entry Balance"}</span>
                <p className="text-slate-600 mt-1 leading-normal">
                  {isAr ? "المدين = الدائن دائماً. لا يسمح محرك القيد بحفظ أي سند لا تتطابق فيه الموازين الحسابية." : "Mathematical lock ensures perfect GL matching."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. JOURNAL ENTRIES BUILDER (Multi-Currency & Manual adjustments) */}
      {activeSubTab === "je" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">Standard Journal Voucher (JV)</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "سند قيد تسوية حسابات يدوي" : "New Journal Voucher"}</h3>
              <p className="text-[10px] text-slate-500">{isAr ? "إدخال قيود التسوية والتوزيع اليدوية مع تصفية أسعار صرف العملات المقابلة" : "Post manual double entry with dynamic currency rates."}</p>
            </div>
          </div>

          <form onSubmit={handlePostJe} className="space-y-6 text-xs">
            {/* Header fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-right">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">{isAr ? "تاريخ الترحيل المالي" : "Posting Date"}</label>
                <input
                  type="date"
                  value={jeDate}
                  onChange={(e) => setJeDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-right"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">{isAr ? "رقم المرجع (رقم السند)" : "Document Reference #"}</label>
                <input
                  type="text"
                  placeholder="e.g. JV-ADJ-01"
                  value={jeReference}
                  onChange={(e) => setJeReference(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-center font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">{isAr ? "العملة" : "Currency"}</label>
                <select
                  value={jeCurrency}
                  onChange={(e) => handleJeCurrencyChange(e.target.value as Currency)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-right font-bold bg-white"
                >
                  <option value={Currency.SAR}>{isAr ? "SAR - ريال سعودي" : "SAR"}</option>
                  <option value={Currency.USD}>{isAr ? "USD - دولار أمريكي" : "USD"}</option>
                  <option value={Currency.YER}>{isAr ? "YER - ريال يمني" : "YER"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">{isAr ? "سعر الصرف مقابل الريال السعودي" : "Exchange Rate to SAR"}</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={jeExchangeRate}
                  onChange={(e) => setJeExchangeRate(parseFloat(e.target.value) || 1)}
                  disabled={jeCurrency === Currency.SAR}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-center font-mono disabled:bg-slate-50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">{isAr ? "البيان والشرح العام للسند" : "Description / Notes"}</label>
              <input
                type="text"
                placeholder={isAr ? "مثال: إثبات إهلاك أو مصاريف تسوية مبيعات..." : "Explain transaction..."}
                value={jeNotes}
                onChange={(e) => setJeNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-right"
                required
              />
            </div>

            {/* Double Entry Allocations Table */}
            <div className="space-y-2 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">{isAr ? "سطور توجيه القيد المالي" : "Ledger Entry Lines"}</span>
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-right text-xs min-w-[700px]">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-150">
                    <tr>
                      <th className="p-3 text-right">{isAr ? "الحساب المستهدف" : "Target Account"}</th>
                      <th className="p-3 text-right">{isAr ? `المدين (${jeCurrency})` : `Debit (${jeCurrency})`}</th>
                      <th className="p-3 text-right">{isAr ? `الدائن (${jeCurrency})` : `Credit (${jeCurrency})`}</th>
                      <th className="p-3 text-right">{isAr ? "ملاحظة السطر" : "Line Memo"}</th>
                      <th className="p-3 text-center">{isAr ? "التحكم" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {jeItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <select
                            value={item.accountId}
                            onChange={(e) => handleJeItemChange(idx, "accountId", e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-semibold"
                            required
                          >
                            <option value="">{isAr ? "-- اختر الحساب المالي --" : "-- Choose Account --"}</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {isAr ? acc.nameAr : acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={item.debit || ""}
                            onChange={(e) => handleJeItemChange(idx, "debit", e.target.value)}
                            disabled={item.credit > 0}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 font-mono text-center disabled:bg-slate-100"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={item.credit || ""}
                            onChange={(e) => handleJeItemChange(idx, "credit", e.target.value)}
                            disabled={item.debit > 0}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 font-mono text-center disabled:bg-slate-100"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            placeholder={isAr ? "ملاحظة خاصة بهذا السطر..." : "Optional line memo"}
                            value={item.notes || ""}
                            onChange={(e) => handleJeItemChange(idx, "notes", e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 text-right"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeJeRow(idx)}
                            className="text-[11px] text-rose-500 hover:text-rose-700 hover:underline disabled:opacity-40 font-bold"
                            disabled={jeItems.length <= 2}
                          >
                            {isAr ? "حذف السطر" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conversions preview */}
            {jeCurrency !== Currency.SAR && (
              <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-teal-800 flex items-center justify-between">
                <span className="font-mono font-bold">
                  SAR {(totalDebits * jeExchangeRate).toFixed(2)}
                </span>
                <span className="font-semibold text-[10px]">
                  {isAr 
                    ? `مبني على سعر الصرف الحالي للعملة: القيمة المترجمة في الدفاتر بالعملة الأساسية:` 
                    : `Dynamic translation to base ledger currency (SAR):`}
                </span>
              </div>
            )}

            {/* Error / Success logs */}
            {jeError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center gap-2 justify-end">
                <span>{jeError}</span>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              </div>
            )}

            {jeSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center gap-2 justify-end">
                <span>{jeSuccess}</span>
                <Check className="w-4 h-4 flex-shrink-0" />
              </div>
            )}

            {/* Control buttons & balance checking bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-150 pt-4 bg-slate-50 p-4 rounded-xl">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addJeRow}
                  className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> 
                  <span>{isAr ? "إضافة سطر" : "Add Row"}</span>
                </button>
                <button
                  type="submit"
                  disabled={difference !== 0}
                  className="px-5 py-2 text-xs font-black text-white bg-slate-950 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-40 transition"
                >
                  {isAr ? "ترحيل السند بالدفاتر" : "Post Ledger Voucher"}
                </button>
              </div>

              <div className="flex items-center gap-6 text-xs text-right">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">{isAr ? "مجموع المدين" : "Total Debits"}</span>
                  <span className="font-mono font-bold text-slate-800">{jeCurrency} {totalDebits.toFixed(2)}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">{isAr ? "مجموع الدائن" : "Total Credits"}</span>
                  <span className="font-mono font-bold text-slate-800">{jeCurrency} {totalCredits.toFixed(2)}</span>
                </div>
                <div className="space-y-0.5 border-r border-slate-200 pr-6 mr-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">{isAr ? "فارق التوازن" : "Variance"}</span>
                  <span className={`font-mono font-bold ${difference === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {jeCurrency} {difference.toFixed(2)} {difference === 0 ? (isAr ? " (متطابق)" : " (Balanced)") : (isAr ? " (غير متوازن)" : " (Lopsided)")}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 3. WORKFLOW & ACCRUALS STATUS REVIEW */}
      {activeSubTab === "workflow" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-teal-800 uppercase bg-teal-50 px-2 py-1 rounded">Accrual Workflows Active</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "رقابة الحركات المالية واعتماد السندات" : "Journal Accrual Workflows"}</h3>
              <p className="text-[10px] text-slate-500">{isAr ? "مراجعة القيود المعلقة، اعتماد المسودات، وإلغاء أو عكس القيود المؤرشفة والترحيلية" : "Track states and trigger actions."}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-150">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-150">
                <tr>
                  <th className="p-3 text-center">{isAr ? "إجراءات التحكم والترحيل" : "Workflow Action"}</th>
                  <th className="p-3 text-right">{isAr ? "البيان والملخص" : "Summary"}</th>
                  <th className="p-3 text-right">{isAr ? "القيمة بالدفاتر" : "Base Value"}</th>
                  <th className="p-3 text-center">{isAr ? "الحالة" : "Workflow Status"}</th>
                  <th className="p-3 text-right">{isAr ? "رقم السند والتاريخ" : "Voucher Detail"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {journalEntries.map((je) => {
                  const wfStatus = je.workflowStatus || "Posted";
                  const totalJeVal = je.items.reduce((sum, i) => sum + i.debit, 0);

                  return (
                    <tr key={je.id} className="hover:bg-slate-50/40">
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {wfStatus === "Draft" && (
                            <>
                              <button
                                onClick={() => handleApplyWorkflow(je.id, "Approved")}
                                className="px-2.5 py-1 text-[10px] font-black text-white bg-slate-900 rounded-md hover:bg-slate-800"
                              >
                                {isAr ? "اعتماد" : "Approve"}
                              </button>
                              <button
                                onClick={() => handleApplyWorkflow(je.id, "Cancelled")}
                                className="px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 rounded-md hover:bg-rose-100"
                              >
                                {isAr ? "إلغاء" : "Cancel"}
                              </button>
                            </>
                          )}
                          {wfStatus === "Approved" && (
                            <button
                              onClick={() => handleApplyWorkflow(je.id, "Posted")}
                              className="px-2.5 py-1 text-[10px] font-black text-white bg-teal-800 rounded-md hover:bg-teal-700"
                            >
                              {isAr ? "ترحيل الحسابات العامة" : "Post to GL"}
                            </button>
                          )}
                          {wfStatus === "Posted" && (
                            <button
                              onClick={() => setReversalEntryId(je.id)}
                              className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-md hover:bg-rose-100 flex items-center gap-1"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>{isAr ? "قيد عكسي" : "Issue Reversal"}</span>
                            </button>
                          )}
                          {wfStatus === "Cancelled" && (
                            <span className="text-slate-400 font-medium italic">{isAr ? "ملغى ومقفل" : "Locked"}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{je.notes}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        SAR {totalJeVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          wfStatus === "Posted" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
                          wfStatus === "Approved" ? "bg-teal-50 text-teal-700 border border-teal-150" :
                          wfStatus === "Draft" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {isAr ? (
                            wfStatus === "Posted" ? "مرحل نهائي" :
                            wfStatus === "Approved" ? "معتمد" :
                            wfStatus === "Draft" ? "مسودة قيد" : "ملغى / متراجع"
                          ) : wfStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-mono font-bold text-slate-900">{je.id}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{je.date}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reversal Dialog overlay (inline/collapsible) */}
          {reversalEntryId && (
            <div className="p-4 bg-rose-50/50 border border-rose-150 rounded-xl space-y-3 mt-4 text-right">
              <h4 className="font-extrabold text-rose-900 text-xs flex items-center gap-1.5 justify-end">
                <RotateCw className="w-4 h-4 text-rose-700" />
                <span>{isAr ? `إجراء قيد عكسي تسوية للسند رقم: ${reversalEntryId}` : `Issue Reversal for ${reversalEntryId}`}</span>
              </h4>
              <p className="text-[11px] text-rose-700">
                {isAr 
                  ? "تحذير: لا يمكن حذف القيود المنشورة بالدفاتر وفقاً للمعايير. سيقوم النظام بإنشاء قيد مالي جديد معكوس بالكامل ومتطابق رياضياً لإلغاء الموازين القديمة."
                  : "Note: Posted journal vouchers are immutable. A balanced contra-entry will be posted."}
              </p>
              <form onSubmit={handleIssueReversal} className="flex gap-2.5 items-end justify-end">
                <input
                  type="text"
                  placeholder={isAr ? "يرجى كتابة سبب التراجع المالي والارتجاع..." : "Type reversal reason..."}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="p-2 text-xs rounded-lg border border-slate-200 bg-white flex-1 text-right focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg"
                >
                  {isAr ? "تأكيد وقيد التراجع العكسي" : "Post Contra Reversal"}
                </button>
                <button
                  type="button"
                  onClick={() => setReversalEntryId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 4. RECURRING JOURNAL ENTRIES AUTOMATION */}
      {activeSubTab === "recurring" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded">YTD Auto Allocations</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "أتمتة القيود الدورية وجدولة المصاريف" : "Recurring Journal Adjustments"}</h3>
              <p className="text-[10px] text-slate-500">{isAr ? "تكرار توزيع المصاريف الشهرية ومستحقات الإيجارات والمكافآت تلقائياً بنقرة زر واحدة" : "Generate recurring accruals."}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table Column */}
            <div className="lg:col-span-2 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{isAr ? "الجدوال النشطة حالياً بالمصنع" : "Active Allocation Routines"}</span>
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold border-b border-slate-150">
                    <tr>
                      <th className="p-3 text-center">{isAr ? "توليد فوري" : "Execution"}</th>
                      <th className="p-3 text-right">{isAr ? "تاريخ الاستحقاق القادم" : "Next Run"}</th>
                      <th className="p-3 text-right">{isAr ? "التكرار" : "Frequency"}</th>
                      <th className="p-3 text-right">{isAr ? "اسم الجدولة والبيان" : "Template Routine"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {recurringEntries.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/30">
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleTriggerRecurring(rec.id)}
                            className="px-3 py-1.5 bg-slate-950 text-white rounded-lg hover:bg-slate-800 font-bold text-[10px] flex items-center gap-1 mx-auto"
                          >
                            <Send className="w-3 h-3" />
                            <span>{isAr ? "تشغيل وتوليد قيد" : "Run Now"}</span>
                          </button>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">{rec.nextPostingDate}</td>
                        <td className="p-3 font-semibold text-slate-500">
                          {isAr ? (
                            rec.frequency === "Monthly" ? "شهري" :
                            rec.frequency === "Weekly" ? "أسبوعي" : "ربع سنوي"
                          ) : rec.frequency}
                        </td>
                        <td className="p-3">
                          <div className="font-extrabold text-slate-800">{rec.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{isAr ? `قالب مرجع: ${rec.referenceEntryId}` : `Ref Template: ${rec.referenceEntryId}`}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form Column */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-150 h-fit text-right space-y-4">
              <h4 className="font-extrabold text-slate-900 text-xs">{isAr ? "إنشاء جدولة قيد جديدة" : "New Recurring Routine"}</h4>
              <form onSubmit={handleCreateRecurring} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "اسم الجدولة (مثال: الإهلاك الشهري)" : "Routine Name"}</label>
                  <input
                    type="text"
                    value={newRecName}
                    onChange={(e)=>setNewRecName(e.target.value)}
                    placeholder="e.g. Monthly Rent Expense Allocation"
                    className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-right text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "تكرار الدورة" : "Frequency"}</label>
                  <select
                    value={newRecFreq}
                    onChange={(e)=>setNewRecFreq(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-right text-xs"
                  >
                    <option value="Monthly">{isAr ? "شهري" : "Monthly"}</option>
                    <option value="Weekly">{isAr ? "أسبوعي" : "Weekly"}</option>
                    <option value="Quarterly">{isAr ? "ربع سنوي" : "Quarterly"}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "القيد المرجعي (تأخذ الحسابات منه)" : "Reference Template Voucher"}</label>
                  <select
                    value={newRecRefId}
                    onChange={(e)=>setNewRecRefId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-right text-xs"
                    required
                  >
                    <option value="">{isAr ? "-- اختر قيد مرجعي --" : "-- Choose Reference --"}</option>
                    {journalEntries.map(je => (
                      <option key={je.id} value={je.id}>
                        {je.id} - {je.notes.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  {isAr ? "حفظ وإطلاق الجدولة" : "Register Routine"}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* 5. EXCHANGE RATES MATRIX */}
      {activeSubTab === "exchange" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded">Daily Exchange Rate Matrix</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "سجل أسعار صرف العملات الأجنبية" : "Currency Exchange Rate Ledger"}</h3>
              <p className="text-[10px] text-slate-500">{isAr ? "إدارة أسعار التحويل الفورية لعملات التداول (اليمني، الدولار، الريال السعودي) وفقاً لنشرات المركزي" : "Control exchange rate parameters."}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-150">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold border-b border-slate-150">
                <tr>
                  <th className="p-3 text-right">{isAr ? "تحديث يدوي" : "Action"}</th>
                  <th className="p-3 text-right">{isAr ? "سعر الصرف النشط (لكل وحدة)" : "Current Daily Rate"}</th>
                  <th className="p-3 text-right">{isAr ? "إلى عملة" : "To Currency"}</th>
                  <th className="p-3 text-right">{isAr ? "من عملة" : "From Currency"}</th>
                  <th className="p-3 text-right">{isAr ? "آخر تاريخ تحديث" : "Last Verification Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {exchangeRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50/20">
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="جديد..."
                        className="p-1 text-xs border border-slate-200 rounded text-center font-mono w-24 focus:outline-none"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 0) {
                            setExchangeRates(prev => prev.map(r => r.id === rate.id ? { ...r, rate: val, date: new Date().toISOString().split("T")[0] } : r));
                          }
                        }}
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      1 {rate.from} = {rate.rate} {rate.to}
                    </td>
                    <td className="p-3 font-semibold text-slate-600">{rate.to}</td>
                    <td className="p-3 font-semibold text-slate-600">{rate.from}</td>
                    <td className="p-3 font-mono text-slate-400">{rate.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. FISCAL YEAR CLOSED COGS ACCRUER */}
      {activeSubTab === "closing" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded">End-of-Period Sweeper</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "إغلاق السنة المالية والترحيل للمركز المالي" : "Fiscal Period Year End Closing"}</h3>
              <p className="text-[10px] text-slate-500">{isAr ? "تصفية حسابات الدخل والمصاريف السنوية، تصفير الدفاتر، وترحيل صافي الأرباح كأرباح مبقاة بحقوق الملكية" : "Zero out income and expense accounts."}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Closing estimates card */}
            <div className="p-5 border border-slate-150 rounded-xl bg-slate-50 space-y-4">
              <h4 className="font-extrabold text-slate-900 text-xs">{isAr ? "محاكاة ختامية لميزان المراجعة قبل الإغلاق" : "Pre-Closing Balances Simulation"}</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-mono font-bold text-emerald-600">
                    SAR {accounts.filter(a => a.type === AccountType.Income).reduce((sum, a) => sum + a.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-500 font-semibold">{isAr ? "إجمالي الإيرادات السنوية النشطة:" : "YTD Revenues Balance:"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-mono font-bold text-rose-600">
                    SAR {accounts.filter(a => a.type === AccountType.Expense).reduce((sum, a) => sum + a.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-500 font-semibold">{isAr ? "إجمالي المصاريف وتكاليف المبيعات:" : "YTD Expenses & COGS:"}</span>
                </div>

                {/* Net Earnings */}
                {(() => {
                  const income = accounts.filter(a => a.type === AccountType.Income).reduce((sum, a) => sum + a.balance, 0);
                  const expense = accounts.filter(a => a.type === AccountType.Expense).reduce((sum, a) => sum + a.balance, 0);
                  const surplus = income - expense;

                  return (
                    <div className="flex justify-between p-3 bg-white border border-slate-250 rounded-lg text-sm font-black">
                      <span className={surplus >= 0 ? "text-emerald-700 font-mono" : "text-rose-750 font-mono"}>
                        SAR {surplus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span>{isAr ? "صافي الأرباح المحققة المقدرة:" : "Estimated YTD Net Earnings:"}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 bg-amber-50 text-amber-800 text-[11px] rounded-lg border border-amber-100 leading-relaxed font-medium">
                {isAr 
                  ? "تنبيه: قيد الإغلاق الختامي يقوم بترحيل صافي الأرباح إلى كود حساب 3100 (أرباح مبقاة) وتصفير حسابات قائمة الدخل بالكامل لتصبح أرصدة السنة القادمة متوازنة."
                  : "Accrual zero-out voucher updates equity fields."}
              </div>
            </div>

            {/* Close trigger Form */}
            <form onSubmit={handleYearClosingSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "ملحوظة وشرح قيد إقفال السنة المالية" : "Fiscal Closing Notes / Memo"}</label>
                <textarea
                  rows={3}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder={isAr ? "مثال: إقفال السنة المالية 2026 م والترحيل للمركز المالي للأرباح..." : "Closing description..."}
                  className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-right text-xs focus:outline-none"
                  required
                />
              </div>

              {closingError && (
                <div className="p-3.5 bg-rose-50 text-rose-700 text-[11px] rounded-lg border border-rose-100 font-bold">
                  {closingError}
                </div>
              )}

              {closingSuccess && (
                <div className="p-3.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-lg border border-emerald-100 font-bold">
                  {closingSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-rose-800 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs"
              >
                {isAr ? "ترحيل قيد إغلاق السنة المالية والتدقيق" : "Execute Year-End Ledger Close"}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 7. GENERAL SETTINGS AND CORPORATE CR/VAT DETAILS */}
      {activeSubTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-slate-400 font-mono">ERP Configuration File</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "تحديث البيانات القانونية والضريبية للمنشأة" : "Company Legal & Tax Profile"}</h3>
              <p className="text-[10px] text-slate-500">{isAr ? "تهيئة الرقم الضريبي، السجل التجاري، ونظام تنسيق أرقام المستندات ومعدلات الضريبة" : "Configure VAT rate, CR #, and receipt format templates."}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "اسم الشركة باللغة العربية" : "Company Name (Arabic)"}</label>
              <input
                type="text"
                value={settingsForm.nameAr}
                onChange={(e) => setSettingsForm({ ...settingsForm, nameAr: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-right"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "اسم الشركة باللغة الإنجليزية" : "Company Name (English)"}</label>
              <input
                type="text"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "رقم السجل التجاري (CR)" : "Commercial Registration #"}</label>
              <input
                type="text"
                value={settingsForm.commercialRegistration}
                onChange={(e) => setSettingsForm({ ...settingsForm, commercialRegistration: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "الرقم الضريبي الموحد للزكاة والجمارك" : "ZATCA Tax Registration #"}</label>
              <input
                type="text"
                value={settingsForm.taxNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, taxNumber: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "العنوان البريدي والمصنع" : "Factory Location / Address"}</label>
              <input
                type="text"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-right"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "نسبة ضريبة القيمة المضافة (VAT)" : "VAT Tax Rate"}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settingsForm.taxConfiguration.vatRate}
                onChange={(e) => setSettingsForm({ 
                  ...settingsForm, 
                  taxConfiguration: { vatRate: parseFloat(e.target.value) || 0 } 
                })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "صيغة أرقام الفواتير مبيعات" : "Invoice Formatting Code"}</label>
              <input
                type="text"
                value={settingsForm.invoiceFormat}
                onChange={(e) => setSettingsForm({ ...settingsForm, invoiceFormat: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-mono text-slate-500 bg-slate-50"
                disabled
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold block">{isAr ? "العملة الرئيسية للنظام" : "Base Local Currency"}</label>
              <select
                value={settingsForm.defaultCurrency}
                onChange={(e) => setSettingsForm({ ...settingsForm, defaultCurrency: e.target.value as Currency })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-right font-bold bg-white"
                required
              >
                <option value={Currency.SAR}>{isAr ? "SAR - ريال سعودي" : "SAR"}</option>
                <option value={Currency.USD}>{isAr ? "USD - دولار أمريكي" : "USD"}</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-150 pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs"
            >
              {isAr ? "حفظ كافة الإعدادات ماليًا وضريبيًا" : "Update Company Profile"}
            </button>
          </div>
        </form>
      )}

      {/* 8. LIQUID ASSETS & INTERNAL BANK TRANSFERS */}
      {activeSubTab === "cash_banks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-right">
          
          {/* Transfer & Deposit Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 justify-end">
              <ArrowLeftRight className="w-5 h-5 text-teal-700" />
              <span>{isAr ? "إيداع وتحويل السيولة النقدية" : "Deposit & Transfer Cash"}</span>
            </h3>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "الحساب الصادر (مصدر النقدية)" : "Source Account"}</label>
                <select
                  value={transferSource}
                  onChange={(e)=>setTransferSource(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-right focus:outline-none"
                  required
                >
                  <option value="">{isAr ? "-- اختر المصدر --" : "-- Choose Source --"}</option>
                  {cashAndBankAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {isAr ? a.nameAr : a.name} (رصيد: {a.balance} ر.س)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "الحساب المستلم (مستودع النقدية)" : "Destination Account"}</label>
                <select
                  value={transferDest}
                  onChange={(e)=>setTransferDest(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-right focus:outline-none"
                  required
                >
                  <option value="">{isAr ? "-- اختر الوجهة --" : "-- Choose Destination --"}</option>
                  {cashAndBankAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {isAr ? a.nameAr : a.name} (رصيد: {a.balance} ر.س)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "المبلغ المراد إيداعه (ر.س)" : "Amount (SAR)"}</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={transferAmount || ""}
                  onChange={(e)=>setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "البيان والملحوظة" : "Memo / Description"}</label>
                <input
                  type="text"
                  placeholder={isAr ? "مثال: إيداع المقبوضات اليومية بالبنك الراجحي..." : "e.g. Deposit daily POS cash to bank"}
                  value={transferMemo}
                  onChange={(e)=>setTransferMemo(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-right"
                />
              </div>

              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-lg">
                  {transferError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl shadow-xs transition"
              >
                {isAr ? "اعتماد وإصدار تحويل الدفاتر" : "Confirm ledger transfer"}
              </button>
            </form>
          </div>

          {/* Cash Drawer & Bank stats */}
          <div className="lg:col-span-2 space-y-5 text-right">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "أرصدة السيولة الفورية المتاحة" : "Available Liquid Balances"}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cash Drawer card */}
                <div className="p-4 border border-slate-150 rounded-xl bg-slate-50 flex items-center justify-between">
                  <CreditCard className="w-8 h-8 text-teal-700" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">{isAr ? "الخزينة المادية (Cash-in-hand)" : "Cash Drawer"}</span>
                    <span className="text-lg font-mono font-black text-slate-800">
                      SAR {accounts.find(a => a.code === "1000")?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
                    </span>
                  </div>
                </div>

                {/* Bank account card */}
                <div className="p-4 border border-slate-150 rounded-xl bg-slate-50 flex items-center justify-between">
                  <Landmark className="w-8 h-8 text-teal-700" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">{isAr ? "مصرف الراجحي الحساب الجاري" : "Al Rajhi Corporate Bank"}</span>
                    <span className="text-lg font-mono font-black text-slate-800">
                      SAR {accounts.find(a => a.code === "1100")?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Statement */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "آخر عمليات الخزينة والبنك الدفترية" : "Recent Bank Ledger Activity"}</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-right text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                    <tr>
                      <th className="p-2.5 text-right">{isAr ? "رقم الحركة" : "Voucher"}</th>
                      <th className="p-2.5 text-right">{isAr ? "التاريخ" : "Date"}</th>
                      <th className="p-2.5 text-right">{isAr ? "البيان والشرح" : "Description"}</th>
                      <th className="p-2.5 text-right">{isAr ? "المدين (إيداع)" : "Debit (In)"}</th>
                      <th className="p-2.5 text-right">{isAr ? "الدائن (سحب)" : "Credit (Out)"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-sans">
                    {journalEntries
                      .filter(je => (je.posted || je.workflowStatus === "Posted") && je.items.some(it => it.accountId === "acc-1000" || it.accountId === "acc-1100"))
                      .slice(0, 8)
                      .map((je, idx) => {
                        const targetItem = je.items.find(it => it.accountId === "acc-1000" || it.accountId === "acc-1100");
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono font-bold text-slate-700">{je.id}</td>
                            <td className="p-2.5 font-mono text-slate-400">{je.date}</td>
                            <td className="p-2.5 text-slate-600 font-medium">{je.notes}</td>
                            <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">
                              {targetItem && targetItem.debit > 0 ? `SAR ${targetItem.debit.toFixed(2)}` : "—"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-rose-600 font-bold">
                              {targetItem && targetItem.credit > 0 ? `SAR ${targetItem.credit.toFixed(2)}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
