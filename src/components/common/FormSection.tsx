import React from "react";

interface FormSectionProps {
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  language?: "ar" | "en";
  className?: string;
}

export default function FormSection({
  title,
  titleEn,
  description,
  descriptionEn,
  icon: Icon,
  children,
  language = "ar",
  className = ""
}: FormSectionProps) {
  const isAr = language === "ar";
  const displayTitle = isAr ? title : (titleEn || title);
  const displayDesc = isAr ? description : (descriptionEn || description);

  return (
    <div
      className={`bg-white border border-slate-250 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 ${className}`}
    >
      {(displayTitle || displayDesc) && (
        <div className="border-b border-slate-100 pb-3 flex items-start gap-2.5">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            {displayTitle && (
              <h3 className="font-extrabold text-sm text-slate-900">
                {displayTitle}
              </h3>
            )}
            {displayDesc && (
              <p className="text-xs text-slate-500 mt-0.5">
                {displayDesc}
              </p>
            )}
          </div>
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}
