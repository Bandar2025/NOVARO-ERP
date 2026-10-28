import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import { Landmark, CreditCard, FileCheck, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface TreasuryBanksModuleProps {
  initialTab?: "banks" | "bank_transactions" | "bank_reconciliation";
  language?: "ar" | "en";
}

export default function TreasuryBanksModule({
  initialTab = "banks",
  language = "ar"
}: TreasuryBanksModuleProps) {
  const isAr = language === "ar";
  const { accounts, bankTransactions, addBankTransaction, addToast } = useAppState();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showNewTx, setShowNewTx] = useState(false);
  const [txType, setTxType] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [amount, setAmount] = useState<number>(5000);
  const [description, setDescription] = useState("");
  const [counterAccountId, setCounterAccountId] = useState("acc-1000");

  // Bank statement reconciliation state
  const bankAcc = accounts.find((a) => a.id === "acc-1100");
  const cashAcc = accounts.find((a) => a.id === "acc-1000");
  const glBankBalance = bankAcc?.balance || 450000;
  const [statementBalance, setStatementBalance] = useState<number>(glBankBalance);
  const [reconciledIds, setReconciledIds] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    setStatementBalance(glBankBalance);
  }, [glBankBalance]);

  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addBankTransaction(
      {
        date: new Date().toISOString().split("T")[0],
        type: txType,
        amount,
        description: description || (txType === "Deposit" ? "إيداع بنكي مباشر" : "سحب / تحويل بنكي"),
        accountName: "Al-Rajhi Bank"
      },
      counterAccountId
    );

    if (res.success) {
      setShowNewTx(false);
      setDescription("");
      addToast({
        type: "success",
        message: "تم تسجيل الحركة البنكية وترحيل القيد المحاسبي المزدوج لحساب مصرف الراجحي (1100)!",
        messageEn: "Bank transaction recorded and posted to General Ledger Account 1100!"
      });
    } else {
      addToast({ type: "error", message: res.error || "خطأ في تسجيل الحركة" });
    }
  };

  const txColumns: ColumnDef[] = [
    { key: "id", header: "رقم العملية", headerEn: "Tx ID", render: (v) => <span className="font-mono font-bold text-slate-900">{v}</span> },
    { key: "date", header: "التاريخ", headerEn: "Date" },
    {
      key: "type",
      header: "نوع العملية",
      headerEn: "Type",
      render: (v) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${v === "Deposit" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
          {v === "Deposit" ? (isAr ? "إيداع بنكي (+)" : "Deposit (+)") : (isAr ? "سحب / تحويل (-)" : "Withdrawal (-)")}
        </span>
      )
    },
    { key: "accountName", header: "الحساب البنكي", headerEn: "Bank Account" },
    { key: "description", header: "البيان المالي", headerEn: "Description" },
    {
      key: "amount",
      header: "المبلغ (ريال)",
      headerEn: "Amount (SAR)",
      render: (v, row) => (
        <span className={`font-mono font-bold ${row.type === "Deposit" ? "text-emerald-700" : "text-rose-700"}`}>
          {row.type === "Deposit" ? "+" : "-"} SAR {Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  const discrepancy = Math.round((statementBalance - glBankBalance) * 100) / 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الحسابات البنكية والمطابقة"
        titleEn="Bank Accounts, Transfers & Reconciliation"
        description="متابعة أرصدة الحسابات البنكية بدفتر الأستاذ، تسجيل الإيداعات والتحويلات، ومطابقة كشف الحساب البنكي."
        descriptionEn="Monitor general ledger bank balances, post deposits/withdrawals, and reconcile bank statements."
        icon={Landmark}
        breadcrumbs={[
          { label: "الخزينة والبنوك", labelEn: "Treasury & Banks" },
          { label: "الحسابات والمطابقة البنكية", labelEn: "Banks & Reconciliation", active: true }
        ]}
        language={language}
      />

      <GlobalActionBar
        onNew={() => setShowNewTx(true)}
        newLabelAr="تسجيل حركة بنكية (إيداع / تحويل)"
        newLabelEn="New Bank Transaction"
        totalCount={bankTransactions.length}
        pageId="accounting"
        language={language}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
        {[
          { id: "banks", ar: "الحسابات البنكية والأرصدة", en: "Bank Accounts", icon: Landmark },
          { id: "bank_transactions", ar: "سجل الحركات البنكية", en: "Bank Transactions", icon: CreditCard },
          { id: "bank_reconciliation", ar: "تسوية ومطابقة كشف البنك", en: "Bank Reconciliation", icon: FileCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4 text-teal-600" />
              <span>{isAr ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </div>

      {/* New Bank Transaction Form */}
      {showNewTx && (
        <form onSubmit={handleSubmitTx} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            {isAr ? "تسجيل حركة بنكية وترحيل القيد المزدوج تلقائياً" : "Record Bank Transaction & Post GL Entry"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "نوع العملية *" : "Transaction Type *"}</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              >
                <option value="Deposit">{isAr ? "إيداع بنكي (مدين البنك 1100)" : "Bank Deposit (Dr Bank 1100)"}</option>
                <option value="Withdrawal">{isAr ? "سحب / تحويل بنكي (دائن البنك 1100)" : "Withdrawal / Transfer (Cr Bank 1100)"}</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "الحساب المقابل بدفتر الأستاذ *" : "Counter GL Account *"}</label>
              <select
                value={counterAccountId}
                onChange={(e) => setCounterAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              >
                {accounts
                  .filter((a) => a.id !== "acc-1100")
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {isAr ? a.nameAr : a.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "المبلغ (ريال) *" : "Amount (SAR) *"}</label>
              <input
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "البيان المالي *" : "Description *"}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder={isAr ? "مثال: تغذية الحساب البنكي من الصندوق..." : "e.g. Cash transfer to bank..."}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowNewTx(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-600"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
            >
              {isAr ? "حفظ وترحيل القيد" : "Post Bank Transaction"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "banks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-teal-700 font-bold">GL Account #1100</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {isAr ? "مصرف الراجحي - حساب الشركات الرئيسي" : "Al-Rajhi Corporate Bank Account"}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200">
                ACTIVE IBAN
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-600">
              IBAN: SA44 8000 0123 6080 1099 4401 • SAR
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500">{isAr ? "الرصيد الدفتري المعتمد:" : "Ledger Balance:"}</span>
              <span className="text-2xl font-black font-mono text-teal-800">
                SAR {glBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-600 font-bold">GL Account #1000</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {isAr ? "الخزينة النقدية الرئيسية (الصندوق)" : "Main Factory Cash Safe"}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                TREASURY SAFE
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-600">
              Location: Dammam Factory Main Vault • SAR
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500">{isAr ? "الرصيد النقدي الدفتري:" : "Ledger Balance:"}</span>
              <span className="text-2xl font-black font-mono text-slate-900">
                SAR {(cashAcc?.balance || 125000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bank_transactions" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <ERPTable data={bankTransactions} columns={txColumns} language={language} />
        </div>
      )}

      {activeTab === "bank_reconciliation" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500 block">{isAr ? "الرصيد بدفتر الأستاذ (حساب 1100):" : "GL Account 1100 Balance:"}</span>
              <span className="text-lg font-black font-mono text-slate-900 mt-1 block">
                SAR {glBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-500 block mb-1">
                {isAr ? "رصيد كشف البنك الفعلي (Statement Balance):" : "Bank Statement Ending Balance:"}
              </label>
              <input
                type="number"
                step="0.01"
                value={statementBalance}
                onChange={(e) => setStatementBalance(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold bg-white"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500 block">{isAr ? "فروقات المطابقة:" : "Reconciliation Variance:"}</span>
              <span className={`text-lg font-black font-mono mt-1 block ${discrepancy === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                SAR {discrepancy.toFixed(2)} {discrepancy === 0 ? "✓ متطابق" : "⚠️ فرق"}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-right">{isAr ? "مطابقة" : "Cleared"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "رقم الحركة" : "Tx ID"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "البيان" : "Description"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "المبلغ" : "Amount"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bankTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={reconciledIds[tx.id] ?? true}
                        onChange={(e) => setReconciledIds((prev) => ({ ...prev, [tx.id]: e.target.checked }))}
                        className="w-4 h-4 accent-teal-700 rounded"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">{tx.id}</td>
                    <td className="py-2.5 px-3 font-mono">{tx.date}</td>
                    <td className="py-2.5 px-3">{tx.description}</td>
                    <td className={`py-2.5 px-3 font-mono font-bold ${tx.type === "Deposit" ? "text-emerald-700" : "text-rose-700"}`}>
                      {tx.type === "Deposit" ? "+" : "-"} SAR {tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
