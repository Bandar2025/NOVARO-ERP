import React from "react";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  labelEn?: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  language?: "ar" | "en";
  className?: string;
}

export default function Breadcrumbs({
  items,
  language = "ar",
  className = ""
}: BreadcrumbsProps) {
  const isAr = language === "ar";
  const Separator = isAr ? ChevronLeft : ChevronRight;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-1 ${className}`}
    >
      <div className="flex items-center gap-1 text-slate-400">
        <Home className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-semibold">{isAr ? "نوفارو ERP" : "Novaro ERP"}</span>
      </div>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const text = isAr ? item.label : (item.labelEn || item.label);

        return (
          <React.Fragment key={index}>
            <Separator className="w-3 h-3 text-slate-300 flex-shrink-0" />
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="font-medium text-slate-500 hover:text-teal-700 transition-colors focus:outline-hidden focus:underline"
              >
                {text}
              </button>
            ) : (
              <span
                className={`font-semibold ${
                  isLast ? "text-teal-800 font-bold" : "text-slate-600"
                }`}
                aria-current={isLast ? "page" : undefined}
              >
                {text}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
