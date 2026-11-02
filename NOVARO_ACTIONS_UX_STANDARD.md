# الدليل الهندسي الموحد للأزرار والإجراءات وتجربة المستخدم (NOVARO Actions & UX Standard)

## 1. المبادئ التصميمية والمحاسبية الحاكمة
1. **وحدة الشكل والمكان والسلوك**: جميع الصفحات تستخدم مكونات قياسية موحدة (`PageHeader`, `GlobalActionBar`, `DocumentActions`, `FormActions`, `ReportToolbar`, `AuditActions`, `PermissionGate`).
2. **احترام دورة حياة المستند المحاسبي**: لا يظهر زر "تعديل" أو "حذف" لأي مستند مرحّل (`Posted`)؛ بل يظهر فقط "طباعة"، "عرض القيد المرتبط"، "سجل التدقيق"، و"قيد عكسي (`REV-`)".
3. **الحوكمة والصلاحيات (`RBAC`)**: كل زر إجراء حساس محمي بمكون `PermissionGate` ومفحوص عبر `checkUserPermission(page, action)` في الواجهة وميدلوير `authenticateToken` / `requirePermission` في الخادم.
4. **منع النقرات المزدوجة والعمليات الصامتة**: جميع الأزرار تعرض حالة انشغال (`isBusy` / `isSubmitting`) وتُلزم المستخدم بإدخال سبب رسمي عند الرفض أو الإلغاء أو العكس المحاسبي.

---

## 2. المكونات المشتركة الموحدة (`/src/components/common/`)

| المكون | المسار | المسؤولية الوظيفية |
|---|---|---|
| `GlobalActionBar` | `/src/components/common/GlobalActionBar.tsx` | شريط الإجراءات العلوي الموحد (بحث، فلاتر، عداد السجلات، إضافة جديد، تحديث، طباعة، تصدير، قائمة المزيد). |
| `DocumentActions` | `/src/components/common/DocumentActions.tsx` | شريط إجراءات دورة حياة المستند المحاسبي والتشغيلي (`Draft -> PendingReview -> Approved -> Posted -> Reversed/Rejected`) مع نافذة السبب الإلزامي وفحص قفل الفترة المالية. |
| `FormActions` | `/src/components/common/FormActions.tsx` | شريط أزرار النماذج الموحد (`حفظ كمسودة`، `حفظ واعتماد`، `تحقق من التوازن`، `إعادة تعيين مع تأكيد الحقول المعدلة`، `إلغاء`). |
| `ReportToolbar` | `/src/components/common/ReportToolbar.tsx` | شريط أدوات التقارير المالية والتشغيلية (فلتر الفترة المالية، من تاريخ، إلى تاريخ، بحث نصي، مسح الفلاتر، تحديث، تصدير CSV/Excel، تصدير JSON، طباعة). |
| `AuditActions` | `/src/components/common/AuditActions.tsx` | عارض القيد المحاسبي المرتبط (`Linked JE`) وعارض سجل التدقيق الخاص بالمستند (`Audit Trail`) مع تصدير CSV. |
| `PermissionGate` | `/src/components/common/PermissionGate.tsx` | بوابة الصلاحيات الذكية التي تخفي الزر أو تعطله مع إظهار تلميح توضيحي (`Tooltip`) يبين الدور والصلاحية المطلوبة. |

---

## 3. الدلالات اللونية والأيقونات القياسية (Semantic Color & Iconography Tokens)
- **الإجراء الرئيسي للصفحة (Primary Action)**: `bg-teal-700 hover:bg-teal-800 text-white` (مثال: إضافة جديد، حفظ واعتماد).
- **الترحيل المحاسبي النهائي (Post to GL)**: `bg-emerald-600 hover:bg-emerald-500 text-white` مع أيقونة `ShieldCheck`.
- **حفظ المسودة / المراجعة (Draft / Pending Review)**: `bg-amber-50 border-amber-300 text-amber-900` مع أيقونة `Save` أو `Send`.
- **الاعتماد الإداري/المالي (Approve)**: `bg-blue-600 hover:bg-blue-500 text-white` مع أيقونة `CheckCircle2`.
- **الإجراءات الخطرة / العكس المحاسبي / الرفض (Danger / Reverse / Reject)**: `bg-rose-50 border-rose-200 text-rose-700` (أو `bg-rose-600 text-white` في نافذة التأكيد) مع أيقونة `RotateCcw` أو `XCircle`.
- **الإجراءات الثانوية والتقارير (Secondary / Print / Export)**: `bg-white border-slate-300 text-slate-700` أو `bg-slate-900 text-white` للطباعة الرسمية.
