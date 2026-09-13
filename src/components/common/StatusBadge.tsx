import React from "react";
import { CheckCircle2, Clock, AlertCircle, RotateCcw, Truck, Check, XCircle } from "lucide-react";

export type SemanticStatus =
  | "Draft"
  | "Posted"
  | "Reversed"
  | "Paid"
  | "Unpaid"
  | "PartiallyPaid"
  | "Received"
  | "InTransit"
  | "Completed"
  | "InProgress"
  | "Cancelled"
  | "Active"
  | "Closed";

interface StatusBadgeProps {
  status: SemanticStatus | string;
  language?: "ar" | "en";
  className?: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, {
  labelAr: string;
  labelEn: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  Draft: {
    labelAr: "مسودة",
    labelEn: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-350",
    icon: Clock
  },
  Posted: {
    labelAr: "مرحل",
    labelEn: "Posted",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-250",
    icon: CheckCircle2
  },
  Reversed: {
    labelAr: "معكوس",
    labelEn: "Reversed",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-250",
    icon: RotateCcw
  },
  Paid: {
    labelAr: "مدفوع",
    labelEn: "Paid",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-250",
    icon: Check
  },
  Unpaid: {
    labelAr: "غير مدفوع",
    labelEn: "Unpaid",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-250",
    icon: AlertCircle
  },
  PartiallyPaid: {
    labelAr: "مسدد جزئياً",
    labelEn: "Partial",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-250",
    icon: Clock
  },
  Received: {
    labelAr: "مستلم ومخزن",
    labelEn: "Received",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-250",
    icon: CheckCircle2
  },
  InTransit: {
    labelAr: "تحت التوريد",
    labelEn: "In Transit",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-250",
    icon: Truck
  },
  Completed: {
    labelAr: "مكتمل",
    labelEn: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-250",
    icon: CheckCircle2
  },
  InProgress: {
    labelAr: "قيد التشغيل",
    labelEn: "In Progress",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-250",
    icon: Clock
  },
  Cancelled: {
    labelAr: "ملغي",
    labelEn: "Cancelled",
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-300",
    icon: XCircle
  },
  Active: {
    labelAr: "نشط",
    labelEn: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-250",
    icon: CheckCircle2
  },
  Closed: {
    labelAr: "مغلق",
    labelEn: "Closed",
    bg: "bg-slate-150",
    text: "text-slate-600",
    border: "border-slate-350",
    icon: XCircle
  }
};

export default function StatusBadge({
  status,
  language = "ar",
  className = "",
  size = "md"
}: StatusBadgeProps) {
  const isAr = language === "ar";
  const normalizedKey = Object.keys(statusConfig).find(
    k => k.toLowerCase() === String(status).toLowerCase()
  ) || "Draft";

  const config = statusConfig[normalizedKey];
  const Icon = config.icon;

  const sizeClasses = size === "sm"
    ? "text-[10px] px-2 py-0.5 gap-1"
    : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className} whitespace-nowrap shadow-2xs`}
    >
      <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      <span>{isAr ? config.labelAr : config.labelEn}</span>
    </span>
  );
}
