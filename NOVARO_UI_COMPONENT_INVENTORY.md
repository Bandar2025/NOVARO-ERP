# NOVARO ERP — REUSABLE UI COMPONENT INVENTORY
## Document Reference: INV-CMP-2026-V1.0
**Product**: NOVARO ERP  
**Directory**: `/src/components/common/`

---

| Component Name | File Location | Reusable | Role & Primary Capabilities | Status |
|:---|:---|:---|:---|:---|
| **`PageHeader`** | `/src/components/common/PageHeader.tsx` | Yes | Standardized screen header containing Breadcrumb, Title, Subtitle, Metric chip, and Action Bar (`+ New`, `Print`, `Export`, `Refresh`). | New / Standardized |
| **`Breadcrumbs`** | `/src/components/common/Breadcrumbs.tsx` | Yes | Dynamic hierarchical navigation trail showing `Domain > Submodule > Screen > Record ID` with bilingual support. | New / Standardized |
| **`ActionBar`** | `/src/components/common/ActionBar.tsx` | Yes | Standardized horizontal action strip for search input, status filter dropdowns, and contextual buttons. | New / Standardized |
| **`StatusBadge`** | `/src/components/common/StatusBadge.tsx` | Yes | Semantic status pill supporting `Draft`, `Posted`, `Reversed`, `Paid`, `Unpaid`, `Received`, `InTransit`, `Completed`, `Cancelled`. | New / Standardized |
| **`EmptyState`** | `/src/components/common/EmptyState.tsx` | Yes | Standardized empty placeholder with contextual icon, descriptive message, and optional primary call to action. | New / Standardized |
| **`LoadingState`** | `/src/components/common/LoadingState.tsx` | Yes | Accessible pulse skeleton screens and standardized spinner for asynchronous or fetching operations. | New / Standardized |
| **`ErrorState`** | `/src/components/common/ErrorState.tsx` | Yes | Accessible error alert box with error description, technical code, and `إعادة المحاولة` (Retry) button. | New / Standardized |
| **`ConfirmDialog`** | `/src/components/common/ConfirmDialog.tsx` | Yes | Modal dialog preventing accidental deletion, fiscal closure, or reversal. Features explicit warning and confirmation button. | New / Standardized |
| **`FormSection`** | `/src/components/common/FormSection.tsx` | Yes | Structured card grouping form inputs logically with title, icon, and standardized responsive padding. | New / Standardized |
| **`FormField`** | `/src/components/common/FormField.tsx` | Yes | Accessible input wrapper featuring standard label, mandatory indicator (`*`), helper text, and validation error message. | New / Standardized |
| **`ToastNotification`** | `/src/components/common/ToastNotification.tsx` | Yes | Root toast container listening to `StateContext.toasts` with auto-dismiss, color-coded alert levels, and dismiss button. | New / Standardized |
| **`ERPTable`** | `/src/components/common/ERPTable.tsx` | Yes | High-density data grid featuring sorting, filtering, column visibility toggling, pagination, search, and CSV/Excel export. | Standardized & Integrated |
| **`AppSidebar`** | `/src/components/common/AppSidebar.tsx` | Yes | Collapsible domain-based navigation sidebar with badge counts, active highlights, and hierarchical accordion groups. | New / Standardized |
| **`AppHeader`** | `/src/components/common/AppHeader.tsx` | Yes | Top global bar with quick search, active audit status, language switch, fiscal period indicator, and user info. | New / Standardized |
