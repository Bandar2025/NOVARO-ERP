import React from "react";
import { useAppState } from "../../context/StateContext";
import { UserRole } from "../../types";
import { Lock } from "lucide-react";

export interface PermissionGateProps {
  page: string;
  action: "view" | "create" | "edit" | "approve" | "post" | "cancel" | "delete" | "configure" | string;
  allowedRoles?: UserRole[];
  mode?: "hide" | "disable";
  disabledReasonAr?: string;
  disabledReasonEn?: string;
  language?: "ar" | "en";
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  page,
  action,
  allowedRoles,
  mode = "disable",
  disabledReasonAr,
  disabledReasonEn,
  language = "ar",
  children
}) => {
  const { currentUser, checkUserPermission } = useAppState();
  const isAr = language === "ar";

  const hasRolePerm = checkUserPermission(page, action);
  const hasExplicitRole =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    currentUser.role === "Admin" ||
    currentUser.role === "Owner" ||
    allowedRoles.includes(currentUser.role);

  const isAllowed = hasRolePerm && hasExplicitRole;

  if (isAllowed) {
    return <>{children}</>;
  }

  if (mode === "hide") {
    return null;
  }

  const tooltip = isAr
    ? disabledReasonAr || `غير مصرح لدور (${currentUser.role}) بتنفيذ الإجراء (${action})`
    : disabledReasonEn || `Role (${currentUser.role}) is not authorized for action (${action})`;

  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1 opacity-55 cursor-not-allowed select-none"
      aria-disabled="true"
    >
      <span className="pointer-events-none">{children}</span>
      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
    </span>
  );
};

export default PermissionGate;
