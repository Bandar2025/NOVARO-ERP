import React, { useEffect } from "react";
import { useAppState, Toast } from "../../context/StateContext";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ToastNotificationProps {
  language?: "ar" | "en";
}

export default function ToastNotification({ language = "ar" }: ToastNotificationProps) {
  const isAr = language === "ar";
  const { toasts, removeToast } = useAppState();

  return (
    <aside
      aria-label={isAr ? "الإشعارات التنبيهية" : "System Notifications"}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none max-w-md w-full px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            toast={t}
            isAr={isAr}
            onDismiss={() => removeToast(t.id)}
          />
        ))}
      </AnimatePresence>
    </aside>
  );
}

function ToastCard({
  toast,
  isAr,
  onDismiss
}: {
  key?: string;
  toast: Toast;
  isAr: boolean;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      bg: "bg-emerald-900/95 border-emerald-750 text-emerald-100",
      icon: CheckCircle2,
      iconColor: "text-emerald-400"
    },
    error: {
      bg: "bg-rose-900/95 border-rose-750 text-rose-100",
      icon: AlertCircle,
      iconColor: "text-rose-400"
    },
    warning: {
      bg: "bg-amber-900/95 border-amber-750 text-amber-100",
      icon: AlertTriangle,
      iconColor: "text-amber-400"
    },
    info: {
      bg: "bg-slate-900/95 border-slate-750 text-slate-100",
      icon: Info,
      iconColor: "text-sky-400"
    }
  }[toast.type] || {
    bg: "bg-slate-900/95 border-slate-750 text-slate-100",
    icon: Info,
    iconColor: "text-sky-400"
  };

  const Icon = config.icon;
  const messageText = isAr ? toast.message : (toast.messageEn || toast.message);

  return (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto w-full p-3.5 rounded-xl border shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-medium ${config.bg}`}
      role="alert"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
        <span className="truncate leading-relaxed">{messageText}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {toast.undoAction && (
          <button
            type="button"
            onClick={() => {
              toast.undoAction!();
              onDismiss();
            }}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[11px] font-bold text-white transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isAr ? (toast.undoLabel || "تراجع") : (toast.undoLabelEn || "Undo")}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-white/60 hover:text-white rounded-md hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
