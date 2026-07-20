# NOVARO ERP — ENTERPRISE DESIGN SYSTEM MASTER SPECIFICATION
## VERSION 1.0

This document defines the complete visual identity, typography, spacing, grids, components, layouts, theme structures, and accessibility standards for **NOVARO ERP**. It is the absolute design authority for developers, engineers, and product designers building on the Novaro ERP platform.

---

## SECTION 1: DESIGN PHILOSOPHY

### 1.1 Aesthetic Intent
Novaro ERP’s visual and interaction design is centered around **Precision, Contextual Density, and Architectural Honesty**. Unlike traditional, cluttered legacy ERPs or overly simplistic, consumer-oriented SaaS landing pages, Novaro ERP strikes an intentional balance:
1. **Zero Aesthetic Bloat**: Every pixel, margin, and shadow exists to clarify high-density data relationships. No arbitrary gradients, non-standard visual separators, or decorative flourishes.
2. **First-Class Bi-directional (RTL/LTR) Flow**: Layouts do not merely mirror elements; they are designed from the ground up to respect cultural and functional reading orders (Arabic RTL and English LTR).
3. **Data Density without Cognitive Overload**: High information density is supported through progressive disclosure, clear micro-typographic hierarchy, and consistent interactive regions.

### 1.2 Contrast and Clarity
Clarity is prioritised above subjective beauty. High-contrast type scales, crisp border treatment (using modern slate borders rather than fuzzy shadows), and consistent status-color mapping guide the user's eyes to high-alert events (e.g., negative ledger variances, expiring inventory lots, thermal printer disconnection).

---

## SECTION 2: BRAND IDENTITY

### 2.1 Corporate Character
Novaro ERP represents the modern industrial enterprise—bold, structural, reliable, and mathematically rigorous.
* **Core Values**: Trust, structural soundness, high-density analytical utility, speed, and real-time absolute consistency (audit assurance).
* **Tone**: Technical, clear, objective, and authoritative. 

### 2.2 Brand Marks & Logo Usage
The Novaro logo is represented by a perfect geometric square containing the interlocking initials `NV` in absolute center alignment.
* **Symbol Proportions**: A 1:1 rounded square with a border radius of exactly `22.2%` (squircle shape).
* **Color Lockup**: Teal-700 (`#0f766e`) background with pure white `#ffffff` typeface in extra-bold geometric sans-serif.
* **Secondary Logotype**: Accompanied by the text "NOVARO" in tracked-out, semi-bold monospaced display typography, followed by "ERP" in a high-contrast label container.

---

## SECTION 3: COLOR SYSTEM

The Novaro Color System uses a functional palette mapped to Tailwind CSS standard scales. Colors are divided into primary, secondary, slate grays, and alert states.

### 3.1 Primary Brand & Accent
* **Novaro Teal (Brand Accent)**: Represents industry, flow, and modern financial precision.
  * Primary: `teal-600` (`#0d9488`) / `teal-700` (`#0f766e`)
  * Light Accent: `teal-50` (`#f0fdfa`)
  * Dark Mode Accent: `teal-400` (`#2dd4bf`)

### 3.2 Gray Scales (Structural Backgrounds and Borders)
* **Light Theme Grays**:
  * Page Canvas background: `slate-50` (`#f8fafc`)
  * Section Card container background: `white` (`#ffffff`)
  * Primary borders: `slate-200` (`#e2e8f0`)
  * Secondary / divider borders: `slate-100` (`#f1f5f9`)
* **Dark Theme Grays**:
  * Page Canvas background: `slate-950` (`#020617`)
  * Section Card container background: `slate-900` (`#0f172a`)
  * Primary borders: `slate-850` (`#1e293b` with 40% opacity)
  * Secondary / divider borders: `slate-900` (`#0f172a`)

### 3.3 Semantic Alert Scale
* **Error / Hazard / Debt Balance**: `rose-600` (`#e11d48`) / Dark Mode: `rose-400` (`#fb7185`)
* **Warning / Lot Expiry / Pending Approval**: `amber-500` (`#f59e0b`) / Dark Mode: `amber-400` (`#fbbf24`)
* **Success / Posted Ledger / Surplus**: `emerald-600` (`#059669`) / Dark Mode: `emerald-400` (`#34d399`)
* **Info / Log / System Telemetry**: `sky-600` (`#0284c7`) / Dark Mode: `sky-400` (`#38bdf8`)

---

## SECTION 4: TYPOGRAPHY

Novaro uses a precise font-selection strategy mapping to specific structural contexts:

### 4.1 Font Families
1. **Primary Interface Font**: `Inter` — standard sans-serif. Used for labels, inputs, table body, forms, paragraph copy, and main navigational hierarchies.
2. **Display & Heading Font**: `Space Grotesk` or `Outfit` — sans-serif with a technical, high-contrast, modern feel.
3. **Monospaced Data & Accounting Font**: `JetBrains Mono` or `Fira Code`. **Mandatory** for all numbers, financial balances, journal codes, ledger transaction amounts, barcodes, warehouse lot codes, and system log lines. This ensures tabular figures line up perfectly for quick human auditing.

### 4.2 Type Hierarchy
* **Display 1 (Module Title)**: `24px` / `line-height: 32px` / Bold / Tracking: `-0.025em` (Space Grotesk).
* **Display 2 (Card Title)**: `18px` / `line-height: 26px` / Semi-bold / Tracking: `-0.015em` (Space Grotesk).
* **Body 1 (Labels/UI)**: `14px` / `line-height: 20px` / Medium or Semi-bold (Inter).
* **Body 2 (Supporting Copy)**: `12px` / `line-height: 16px` / Regular (Inter).
* **Tabular (Ledger/Metrics)**: `13px` / `line-height: 18px` / Regular or Medium / Monospaced (JetBrains Mono).

---

## SECTION 5: SPACING SYSTEM

The Novaro Spacing System is based on a **4px modular grid** (`0.25rem` incremental steps). Spacing must change intentionally to create visual rhythm.

### 5.1 Standard Spacing Increments
* `xs`: `4px` (`0.25rem`) — Tight elements, icon-to-label gaps, badge paddings.
* `sm`: `8px` (`0.5rem`) — Button inner horizontal padding, inline form input labels.
* `md`: `12px` (`0.75rem`) — Dense list gap, table cell vertical padding, toolbar spacing.
* `lg`: `16px` (`1rem`) — Section internal margin, average button layout padding.
* `xl`: `24px` (`1.5rem`) — Full Card content padding, main dashboard grid gap.
* `xxl`: `32px` (`2rem`) — Major workspace margins, outer module wrappers.

---

## SECTION 6: GRID SYSTEM

Novaro ERP uses a responsive, high-density structural layout.

### 6.1 Layout Columns
* **Desktop Workspaces (>= 1280px)**: 12-column grid with exactly `24px` (`1.5rem`) gutters.
* **Tablet Interfaces (768px - 1023px)**: 6-column grid with exactly `16px` (`1rem`) gutters.
* **Mobile Viewports (< 768px)**: 2-column or 1-column layout with `12px` gutters.

### 6.2 Bento Grid Layout Rules
For analytical dashboards, components should form structural "bento-grids" using standard spans (`col-span-12`, `col-span-8`, `col-span-6`, `col-span-4`, `col-span-3`). Row heights should remain constant across adjacent boxes to maintain horizontal visual alignment.

---

## SECTION 7: ICONOGRAPHY

All icons in the Novaro ERP ecosystem must be consistently imported from the `lucide-react` library.

### 7.1 Rules of Icon Usage
1. **Uniform Weight & Stroke**: All icons must use a consistent stroke width of exactly `1.75px` or `2px`. Never mix stroke weights on the same viewport.
2. **Proportional Sizing**:
   * Inline text indicators: `14px` (`w-3.5 h-3.5`)
   * Button labels: `16px` (`w-4 h-4`)
   * Main Navigational Sidebar: `18px` (`w-4.5 h-4.5` or `w-5 h-5`)
   * Hero Dashboard Indicators: `24px` (`w-6 h-6`)
3. **No Decorative Bloat**: Icons must serve as immediate semantic tags. Never place an icon purely for decoration; each must correspond to a distinct action, state, or entity type.

---

## SECTION 8: ELEVATION

Novaro ERP utilizes flat, modern physical boundaries rather than heavy drop shadows to preserve readability under ambient light and minimize rendering overhead on legacy industrial touch terminals.

### 8.1 Shadows Scale
* **Flat Border (Default)**: `1px` crisp border using `slate-200` (light theme) or `slate-800` (dark theme). No shadow. Used for table rows, form inputs, list items, and standard panels.
* **Elevation 1 (Card Container)**: A subtle, low-spread border shadow:
  * Light: `0 1px 2px 0 rgba(15, 23, 42, 0.03)` with a `slate-200` border wrapper.
  * Dark: `0 1px 2px 0 rgba(0, 0, 0, 0.5)` with a `slate-850` border wrapper.
* **Elevation 2 (Floating Toolbar/Popovers)**:
  * `0 4px 6px -1px rgba(15, 23, 42, 0.08)`, `0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
* **Elevation 3 (System Dialog Modals)**:
  * `0 20px 25px -5px rgba(15, 23, 42, 0.15)`, `0 8px 10px -6px rgba(15, 23, 42, 0.1)`.

---

## SECTION 9: BORDERS

Borders define structural layout and divide transactional regions.

### 9.1 Technical Border Scales
* **Primary Structural Borders**: `1px` width. Color: `slate-200` (light) / `slate-800` (dark).
* **Divider Borders**: `1px` width. Color: `slate-100` (light) / `slate-900` (dark).
* **Input Focus States**: `1.5px` or `2px` width on focus. Color: `teal-600` (brand accent).
* **State Borders**: `1px` red/green/amber borders for respective warning, validation, and posting states.

---

## SECTION 10: CORNER RADIUS

A sharp-to-subtle radius ratio represents industrial precision.

### 10.1 Corner Scales
* **Zero Radius (`rounded-none`)**: Used for POS receipt prints, thermal slips, layout margins, and outer edge panels.
* **Extra Small (`rounded-sm`)**: `2px`. Used for checkbox selectors and tiny micro-badges.
* **Small (`rounded-md`)**: `6px`. Used for standard buttons, form inputs, search bars, and dropdown menus.
* **Medium (`rounded-xl`)**: `12px`. Used for content cards, data tables, and modal dialogue containers.
* **Full Circular (`rounded-full`)**: Used exclusively for user status badges and pill tags.

---

## SECTION 11: ANIMATION PRINCIPLES

Animations must strictly respect human perception speeds. There is zero room for slow, cinematic animations in a high-intensity professional ERP workflow where employees click buttons thousands of times per shift.

### 11.1 Principles
1. **Utility-First**: Motion must explain spatial transitions (e.g., drawer sliding in from the right edge, a card expanding down).
2. **Speed over Flair**: Animations must remain sub-`200ms` for micro-interactions and sub-`100ms` for direct component feedback.
3. **Respect System Settings**: Respect user preferences for reduced motion (`motion-safe:` or CSS media query `prefers-reduced-motion: reduce`).

---

## SECTION 12: MOTION SYSTEM

Novaro ERP leverages `motion` (formerly `framer-motion`) to ensure uniform easing.

### 12.1 Timing and Easings
* **Linear Feedback**: `ease-linear` for simple opacity transitions.
* **Enter / Slide-In**: `cubic-bezier(0.16, 1, 0.3, 1)` (Ultra-smooth custom out-expo) — duration: `180ms`.
* **Exit / Collapse**: `cubic-bezier(0.7, 0, 0.84, 0)` (Accurate in-expo) — duration: `120ms`.
* **Micro-Feedback (Hover on Action)**: Duration: `80ms` linear.

---

## SECTION 13: THEME ENGINE

The system is controlled by a declarative theme engine reading from HTML classes. Theme persistence is stored in `localStorage` and synchronized on application load.

### 13.1 CSS Variables & Tailwind Integration
Themes are managed using native CSS variables declared under `@theme` in `src/index.css`. All components must read semantic tokens (`--color-background-primary`, `--color-border-subtle`, `--color-text-primary`) rather than hardcoded tailwind classes to ensure flawless instant dark-to-light toggles.

---

## SECTION 14: LIGHT THEME

Designed for high-ambient-light industrial environments, warehouses, and bright office settings.

### 14.1 Technical Palette Specs
* Canvas background: `#f8fafc` (`slate-50`)
* Container surface: `#ffffff`
* High-contrast text: `#0f172a` (`slate-900`)
* Secondary description text: `#475569` (`slate-600`)
* Subtle/disabled text: `#94a3b8` (`slate-400`)
* Border grid lines: `#e2e8f0` (`slate-200`)
* Active table row hover: `#f1f5f9` (`slate-100`)

---

## SECTION 15: DARK THEME

Designed for low-light command centers, factory terminal kiosks, and long-shift auditing.

### 15.1 Technical Palette Specs
* Canvas background: `#020617` (`slate-950`)
* Container surface: `#0f172a` (`slate-900`)
* High-contrast text: `#f8fafc` (`slate-50`)
* Secondary description text: `#94a3b8` (`slate-400`)
* Subtle/disabled text: `#475569` (`slate-600`)
* Border grid lines: `#1e293b` (`slate-800`)
* Active table row hover: `#1e293b` with opacity (`slate-800/60`)

---

## SECTION 16: COMPONENT LIBRARY

Every component must follow precise structural blueprints to operate smoothly in Arabic and English.

### 16.1 Buttons
* **Primary Action**: Solid teal background, white text. Clear hover transition. Active scale click feedback (scale down slightly by `0.98` for touch tactile responses).
* **Secondary**: Outlined border. Light gray bg on hover.
* **Semantic (Destructive)**: Rose red background, white text. Primary for reversing ledger transactions or deleting items.
* **Sizes**:
  * Dense: `h-8`, font `12px`, padding `0.75rem` horizontal.
  * Standard: `h-10`, font `14px`, padding `1.25rem` horizontal.
  * POS Large: `h-14`, font `16px` bold, padding `2rem` horizontal.

### 16.2 Inputs & Select Fields
* Outer wrapper must include a persistent HTML `id` for targeting.
* Dynamic state borders: Teal focus border, amber warning, red invalid.
* Placement of validation helper text must be aligned to start of writing direction (`text-start`).
* Clear, high-contrast placeholder text (minimum contrast ratio `4.5:1`).

### 16.3 Dropdowns & Popovers
* Must render on top of all relative wrappers using absolute layout, bound by viewports to prevent screen overflow.
* Interactive keyboard navigation supported (Arrow up, Arrow down, Enter, Escape).

### 16.4 Tables (The Ledger Engine)
* **Header Row**: Fixed position (`sticky top-0`). Dark slate bg, white text or light slate bg with high contrast.
* **Grid lines**: `1px` slate lines. Zero fuzzy vertical borders.
* **Tabular formatting**: Monospaced numerical values. All numbers must be right-aligned (`text-right` or `text-end`) to allow clean vertical alignment of values.
* **Cell paddings**: `py-2 px-4` for high density, `py-4 px-6` for standard.

### 16.5 Dialog Modals
* Backed by a dark transparent backdrop (`bg-slate-950/70` with backdrop blur of exactly `4px`).
* Close button in top-right (LTR) / top-left (RTL) corners. Escape key triggers closure.

### 16.6 Cards & Lists
* White/dark-slate container with `rounded-xl` and standard flat borders.
* Clear visual demarcation between header, content body, and action footer.

### 16.7 Tabs (Structural Navigation)
* Clear bottom borders. Selected state uses `teal-600` accent.
* Smooth indicator animations using `motion` layout.

### 16.8 Badges & Tags
* Rounded-full capsules. Background opacity 10% to 15% with high contrast foreground text (e.g. green-100 bg with green-800 text).

### 16.9 Timelines (Log Tracking)
* Left border (or right border in RTL) of `2px` acting as the pipeline track. Small circular nodes denoting audit status.

### 16.10 Date Picker
* Dual month views. Easy fast-forward to financial quarters and standard fiscal periods.

### 16.11 Tree View (Chart of Accounts)
* Interactive nesting directories with toggle carousels. Indented by increments of `16px` per structural depth.

### 16.12 Kanban (Manufacturing/Production)
* Drag-and-drop enabled columns. Fixed column widths. Dense card status badges for lot tracking.

### 16.13 Charts (D3/Recharts)
* Colors must align with the global semantic palette (Teal for production, Rose for debt/liability, Green for assets/revenue).

### 16.14 AG Grid Enterprise Integration
* Grid column resizing must adapt immediately without horizontal layout shift.
* Infinite scrolling loading states with skeleton patterns.

---

## SECTION 17: DASHBOARD DESIGN RULES

Novaro dashboards must map directly to operational monitoring.

### 17.1 Key Performance Indicator (KPI) Cards
* Placed at the very top of the dashboard.
* Layout: Primary numeric metric in monospaced Space Grotesk `28px` bold, supported by inline comparison percentages (e.g., `+12.4%` green arrow or `-2.3%` red arrow) and period comparison text.

### 17.2 Real-Time Factory Telemetry & Logs
* Left-aligned (or right-aligned in RTL) continuous terminal-style activity feed.
* Monospaced system log lines displaying batch millisecond timestamps, roaster thermal readings, and inventory warehouse check-ins.

---

## SECTION 18: ERP WORKSPACE RULES

Workspaces are tailored to task speed.

### 18.1 Master-Detail Layouts
* Left panel: Master searchable list (33% width). Right panel: High-density interactive details card (66% width) with sticky operation actions footer.

### 18.2 Action Bar Sticky Positioning
* In high-density screens, the action panel containing primary actions (Post Journal, Save Batch, Release Stock) must remain sticky to the viewport bottom, with a high-contrast shadow separating it from scrollable content.

---

## SECTION 19: FINANCIAL SCREENS

Designed for strict, error-free accounting.

### 19.1 Double-Entry Journal Builder
* Interactive ledger lines grid containing Accounts, Debits, and Credits.
* Real-time ledger validation engine: Display a persistent, central mathematical validator badge at the bottom showing:
  * Total Debits
  * Total Credits
  * Variance (Must equal exactly `0.00` to enable the "Post Journal" action).

### 19.2 Chart of Accounts (COA) Visualizer
* Full nested directory displaying Assets, Liabilities, Equity, Revenues, and Expenses.
* Quick visual badges mapping each account's current real-time balance.

---

## SECTION 20: INVENTORY SCREENS

Inventory screens prioritize high throughput and traceability.

### 20.1 Barcode Generation Studio
* Dual LTR/RTL inputs for item code, batch lot, and expiry dates.
* Live SVG render of GS1-128 standard barcode labels with print trigger targets.

### 20.2 FIFO Lot Tracking Cards
* Color-coded cards denoting batch lot age. Yellow warning borders for stock expiring in under 30 days; rose red borders for expired lots.

---

## SECTION 21: MANUFACTURING SCREENS

Built for the factory floor under physical and fast environmental feedback.

### 21.1 Roaster Heat Profile Chart
* Live SVG chart displaying actual temperatures vs. roast recipe profile curve.
* High-density tactical panels tracking roasting exhaust, flame, and drum RPM.

### 21.2 Production Batch Control Room
* Extra-large interactive buttons (minimum 52px height) for starting, pausing, and dumping roasting kiln contents.

---

## SECTION 22: RETAIL POS TERMINAL

Designed for high-speed touch input, cashiers, and immediate barcode scanner response.

### 22.1 Grid of Fast Items
* Visual, grid-based card layout. Touch targets at least `64px` height.
* Real-time keyboard listeners for immediate receipt additions without pointer clicks.

### 22.2 Quick Numeric Keypad
* Virtual numeric input overlay for fast cash-received calculations.

---

## SECTION 23: REPORT LAYOUTS

Report screens must look clean, formal, and authoritative.

### 23.1 High-Density Audit Layouts
* Fixed font sizes (`12px` monospaced). High-contrast margins.
* Distinct section dividers with summary rows highlighting calculated subtotals.

---

## SECTION 24: PRINT LAYOUTS

Printed documents are handled by CSS `@media print` overrides.

### 24.1 Invoice Print Design Rules
* No colored backgrounds (save user toner). Backgrounds forced to white.
* All dark text forced to solid `#000000` to avoid fuzzy gray printed letters.
* Explicit page breaks (`page-break-inside: avoid`) for transaction table rows.
* Hide all navigation sidebars, headers, floating tabs, and interactive buttons.

---

## SECTION 25: MOBILE DESIGN

ERP functionality optimized for tablets and mobile devices.

### 25.1 Bottom Navigation Bars
* Main operations panel switches to a thumb-accessible bottom bar.
* Responsive gestures (swipe-to-actions) on list items to flag lot releases or initiate edits.

---

## SECTION 26: ACCESSIBILITY (WCAG 2.2 AA)

Absolute compliance with global accessibility regulations.

### 26.1 Compliance Mandates
1. **Contrast**: Minimum contrast ratio of `4.5:1` for normal text and `3:1` for large text.
2. **Keyboard Traps**: Zero keyboard traps in dialog modals. Pressing tab must loop predictably through interactive fields.
3. **Screen Readers**: All buttons and inputs must contain explicit `aria-label` tags, and images must contain descriptive `alt` tags.

---

## SECTION 27: RESPONSIVE RULES

Breakpoints must follow a fluid transition system.

### 27.1 Component Scaling
* `sm` viewports: Sidebar is fully hidden, accessible via a sliding drawer. Tables collapse to vertical list cards.
* `lg` viewports: Sidebar is permanently docked, layouts expand to multi-column workspaces.

---

## SECTION 28: EMPTY STATES

Empty states are designed to guide the user's next step, not just state a lack of data.

### 28.1 Layout Blueprint
* Standard centered layout with a descriptive icon, clear headline, explanatory sub-text, and **one prominent Primary Action button** (e.g., "Add New Account", "Import Lot").

---

## SECTION 29: LOADING STATES

Keep the interface responsive and visually calm during calculations.

### 29.1 Standard Circular Spinner
* Standard CSS animation rotation loop using Novaro Teal color.
* Sub-`200ms` delayed display (do not show loading indicator for ultra-fast queries that complete in under 200ms).

---

## SECTION 30: SKELETON CARDS

Skeletons replace loading indicators on structured detail views to reduce perceived latency.

### 30.1 Blueprint
* Pulse-animated gray shapes replicating the exact structure of the upcoming data rows, preventing structural layout shift on payload arrival.

---

## SECTION 31: ERROR PAGES

Errors must remain professional, technical, and actionable.

### 31.1 Blueprint
* Explicitly display the functional error category (e.g., Concurrency Conflict, Insufficient Cash balance).
* Show localized Arabic and English error labels side-by-side.
* Direct action to contact the system administrator or retry the action safely.

---

## SECTION 32: NOTIFICATION DESIGN

Toast alerts and banner alerts keep the user aware of background events.

### 32.1 Layout
* Toast notifications slide in from the top-right (LTR) or top-left (RTL).
* Must contain an explicit status icon, title, message, and a clear "dismiss" target.

---

## SECTION 33: MICRO-INTERACTIONS

Tiny design touches that enhance usability.

### 33.1 Input State Transitions
* Floating labels that scale down elegantly on focus or when input is populated.
* Subtle button scaling on press to provide physical satisfaction.

---

## SECTION 34: VISUAL HIERARCHY

Focus the user's attention through structural weight.

### 34.1 Spatial Order
* The most important transactional action must always occupy the top-right position of the primary details layout (top-left in RTL).
* Sub-actions and configuration must reside in secondary panels or behind context dropdowns.

---

## SECTION 35: UX RULES

User experience rules built on cognitive science.

### 35.1 Strict UX Mandates
1. **Fitts's Law**: Frequently clicked actions (e.g., "Add Line" in journal builder, "Add to Cart" in POS) must have large, easily targeted mouse regions.
2. **Miller's Law**: Do not force the user to recall more than 7 chunks of data across views; keep step wizards clean.
3. **Idempotency Safeguards**: Disable primary submission targets immediately after a click to prevent double-posting.

---

## SECTION 36: DESIGN TOKENS

The master variables used across the platform.

### 36.1 Global Tokens
* `--font-sans`: `Inter, sans-serif`
* `--font-mono`: `JetBrains Mono, monospace`
* `--color-brand`: `#0d9488` (Teal-600)
* `--radius-sm`: `6px`
* `--radius-lg`: `12px`

---

## SECTION 37: NAMING CONVENTION

Tokens and CSS variables must remain predictable.

### 37.1 Structure
* All tokens use lowercase kebab-case layout: `[system]-[category]-[element]-[state]`.
* Example: `novaro-color-border-input-focus`.

---

## SECTION 38: FIGMA STRUCTURE

Keeping the design team and development team perfectly aligned.

### 38.1 Organization
* Figma files must contain individual pages mapping to specific system layouts (Typography & Colors, Base Components, Workspaces, Print Templates).

---

## SECTION 39: COMPONENT VARIANTS

Every button, input, and badge must be fully designed for all logical states.

### 39.1 States Specification
* **Default**: Passive interaction state.
* **Hover**: Ambient focus indicator.
* **Focus**: Crisp, colored outline indicator.
* **Active**: tactile scale-down.
* **Disabled**: Opacity reduced to `50%`, pointer events disabled.

---

## SECTION 40: COMPLETE UI CHECKLIST (300+ ENTERPRISE CHECKPOINTS)

The final gate before code reaches production. The application must achieve 100% compliance with these checkpoints.

### 40.1 Architecture & Bi-directional RTL/LTR Compliance (50 Checkpoints)
- [ ] 1. Base document contains dynamic `dir` attribute setting `rtl` or `ltr` correctly.
- [ ] 2. Text alignment classes map to abstract logical properties (`text-start`, `text-end`) rather than absolute `text-left` or `text-right`.
- [ ] 3. Margins use logical mapping (`ms-`, `me-`) instead of horizontal margin tags (`ml-`, `mr-`).
- [ ] 4. Paddings use logical mapping (`ps-`, `pe-`) instead of horizontal padding tags (`pl-`, `pr-`).
- [ ] 5. Position parameters map to logical layout (`start-`, `end-`) instead of physical absolute `left-` and `right-`.
- [ ] 6. Border properties map logically (`border-s`, `border-e`).
- [ ] 7. Main layout switches reading direction dynamically without flickering elements.
- [ ] 8. Logo positions correctly in the top-right on RTL and top-left on LTR.
- [ ] 9. Sidebar navigation collapses toward the correct edge when reading direction changes.
- [ ] 10. Language toggle triggers instant re-render of layout structures.
- [ ] 11. Fonts switch dynamically (e.g., Arabic-optimized sans-serif fonts for Arabic, Inter for English).
- [ ] 12. Icons with directional meaning (e.g., arrows, chevron back/forward) mirror correctly in RTL.
- [ ] 13. System scrollbars align to the correct side of the window (left in RTL, right in LTR).
- [ ] 14. Modals enter and exit from the correct edge in accordance with reading flow.
- [ ] 15. Form helper labels place inline to the starting side of the parent input.
- [ ] 16. Context menu items display and align starting from the interactive node's side.
- [ ] 17. Multi-step registration wizard tracks left-to-right (LTR) and right-to-left (RTL) progress loops.
- [ ] 18. Barcode Scanner components align their focus fields dynamically to the cursor direction.
- [ ] 19. Tabular listings match column order correctly across languages.
- [ ] 20. Tooltip anchors display without overlapping scrollbar zones in both orientations.
- [ ] 21. Keyboard arrows reverse navigation directions when operating in RTL.
- [ ] 22. Inline tag lists line-wrap correctly without clipping edge boundaries.
- [ ] 23. Popover positioning dynamically recalculates offsets when switching reading directions.
- [ ] 24. Flex directions use `flex-row` and `flex-row-reverse` dynamically or abstractly.
- [ ] 25. Tree views display collapse-icons mirrored on the correct edge.
- [ ] 26. Gantt timeline nodes track time progressively from start-of-line.
- [ ] 27. Search inputs place clear-buttons on the correct trailing edge.
- [ ] 28. Decimal monospaced points line up correctly regardless of writing direction.
- [ ] 29. Checkbox labels align to the start, checking box places on the start edge.
- [ ] 30. Radio selection lists align titles to the logical reading start.
- [ ] 31. Badge capsules place inline without overlapping trailing text.
- [ ] 32. Accordion expand icons face the correct trailing side.
- [ ] 33. Navigation breadcrumbs mirror the separator arrow characters.
- [ ] 34. Date Range Pickers track date intervals from start-date on the correct physical side.
- [ ] 35. Drag-and-drop elements reflect grab handles on the starting edge.
- [ ] 36. Numeric inputs with spinner buttons align increments on the correct trailing edge.
- [ ] 37. Kanban columns slide and stack starting from the correct reading edge.
- [ ] 38. Chart legend badges align their color boxes logically with labels.
- [ ] 39. File dropzones mirror upload action buttons.
- [ ] 40. Thermal receipt slip layouts align columns to LTR/RTL correctly.
- [ ] 41. Progress indicator bars fill from starting edge to ending edge.
- [ ] 42. Code editor viewports align monospaced blocks LTR while keeping outer panels RTL.
- [ ] 43. Multi-select list search input field aligns tags to start.
- [ ] 44. Slider track buttons slide from the correct starting edge.
- [ ] 45. Header notifications indicators overlap icon on the correct top-ending corner.
- [ ] 46. Floating buttons anchor to the correct ending viewport corner.
- [ ] 47. Interactive user guides focus sequential tooltips following writing reading orders.
- [ ] 48. Print margins mirror margins correctly across print sheets.
- [ ] 49. Table sticky columns attach to the correct leading edge.
- [ ] 50. Dual-currency display values align side-by-side with localized symbols.

### 40.2 Component & Layout Architecture (50 Checkpoints)
- [ ] 51. All interactive elements have an explicit unique HTML `id` attribute.
- [ ] 52. Cards enforce a maximum border radius of `12px` (`rounded-xl`).
- [ ] 53. All buttons have a defined disabled state with matching background modifications.
- [ ] 54. Primary action button hover uses solid color shifts, never translucent overlays.
- [ ] 55. Buttons scale down slightly (`0.98`) on hover and click for active tactile response.
- [ ] 56. Button text uses Inter medium or semi-bold typography only.
- [ ] 57. Secondary buttons have a crisp border of `1px` using `slate-200` (light theme).
- [ ] 58. Semantic error buttons utilize `rose-600` primary backgrounds.
- [ ] 59. Interactive checkboxes utilize a rounded radius of exactly `2px` (`rounded-sm`).
- [ ] 60. Text inputs include clear placeholder attributes with proper color contrast.
- [ ] 61. Active text inputs enforce a focus border color mapping to `teal-600` (`#0d9488`).
- [ ] 62. Invalid inputs are bordered in `rose-500` and display inline error helpers.
- [ ] 63. Form labels have a smaller, secondary text weight in high contrast Slate-600.
- [ ] 64. Helper helper text stands beneath inputs, restricted to `12px` (`text-xs`).
- [ ] 65. Dropdown menus display absolute layers with defined `z-index` over standard inputs.
- [ ] 66. Select input options scale comfortably with touch pad targets on mobile viewports.
- [ ] 67. Modal containers contain a prominent header title in monospaced or Display typography.
- [ ] 68. Backdrop overlays are blurred using backdrop-blur styles to focus active modals.
- [ ] 69. Action buttons in modals sit at the bottom, sticky and right-aligned (LTR).
- [ ] 70. Table headers utilize bold monospaced typography for clean data alignments.
- [ ] 71. Tables preserve fixed sticky headers during deep vertical scrolling operations.
- [ ] 72. Alternating table row backgrounds utilize high-density zebra stripes.
- [ ] 73. All tabular monetary columns are right-aligned to allow quick balance sheets scanning.
- [ ] 74. Numeric values use JetBrains Mono or Fira Code font stack.
- [ ] 75. Badge components leverage light translucent backgrounds with high contrast text.
- [ ] 76. Tabs transition indicators use smooth CSS easing rules.
- [ ] 77. Navigational sidebars utilize persistent slate-950 backdrops for high visual gravity.
- [ ] 78. Collapsible panels preserve visual chevrons displaying active open/close states.
- [ ] 79. Search inputs include an magnifying glass icon inside the leading area of the input.
- [ ] 80. Clear input buttons are placed inside text fields to allow quick redos.
- [ ] 81. Interactive lists have distinct dividers of `1px` using `slate-100` borders.
- [ ] 82. Segmented control components have active slider highlights denoting current selection.
- [ ] 83. Toggle switches use a rounded capsule container with smooth transitions.
- [ ] 84. Date range calendars prevent overlapping select conflicts.
- [ ] 85. Multi-select pill elements contain a clear closing mark to remove entries.
- [ ] 86. File upload dropzones have a dashed border representing drop targets.
- [ ] 87. Progress bars enforce crisp, vertical grid lines inside the meter track.
- [ ] 88. Tooltips align dynamically to the pointer position without layout shift.
- [ ] 89. Slider control tracks maintain clear starting and ending values.
- [ ] 90. Grid view layouts scale gracefully across responsive column spans.
- [ ] 91. Avatar groups overlap elegantly with thin high contrast borders.
- [ ] 92. Section headers include support for right-side inline action buttons.
- [ ] 93. Details listings use subtle horizontal lines rather than block boxes.
- [ ] 94. Sidebar links indicate active routing via side brand highlights.
- [ ] 95. Interactive trees contain explicit indentation lines of 16px.
- [ ] 96. Drawer components slide in predictably from the right side edge (LTR).
- [ ] 97. Alert banners utilize consistent background fills mapping to semantic levels.
- [ ] 98. Empty states cards provide clear, high contrast icons to represent no-data states.
- [ ] 99. Page footers maintain a monospaced design displaying current system release details.
- [ ] 100. Skeletons replicate the upcoming content shapes without shifting structure.

### 40.3 Typography & Readability (50 Checkpoints)
- [ ] 101. Primary text scale achieves strict contrast of `4.5:1` in Light Mode.
- [ ] 102. Secondary text achieves contrast ratio of at least `4.5:1` inside dark surfaces.
- [ ] 103. Main headlines utilize modern Display sans-serif typography.
- [ ] 104. Monospaced type families are used for all monetary listings.
- [ ] 105. Numeric lists avoid variable-width fonts to prevent offset columns.
- [ ] 106. Text line heights scale proportionally with font size increases.
- [ ] 107. Headers are tracked tightly to give visual weight (`tracking-tight`).
- [ ] 108. Paragraph copy is restricted to a maximum readable line width of `65ch`.
- [ ] 109. Localized Arabic text displays with customized line heights (`leading-normal` or `leading-relaxed`).
- [ ] 110. Monospaced tags have subtle gray border wrappers to separate technical codes.
- [ ] 111. High priority financial alerts have bold text states.
- [ ] 112. Subtitles avoid extra bold weights to prevent visual competing with titles.
- [ ] 113. Tabular headers remain aligned with the underlying data columns.
- [ ] 114. Currency symbol elements have smaller font size proportions.
- [ ] 115. Labels on vertical forms are kept on top of inputs for fast scanning.
- [ ] 116. Capitalization rules are preserved across all monospaced technical codes.
- [ ] 117. Disabled inputs preserve legible text contrast of at least `3:1`.
- [ ] 118. System logging panels use dark terminal styling with bright green monospaced text.
- [ ] 119. Breadcrumbs separate directories with small high contrast chevrons.
- [ ] 120. Tooltip text is limited to brief explanatory descriptors only.
- [ ] 121. Section titles include clear line heights to prevent overlapping.
- [ ] 122. Underlining interactive links occurs clearly on pointer hover.
- [ ] 123. Arabic text avoids extreme italicizing to preserve character curves.
- [ ] 124. Text truncation uses clear ellipsis boundaries (`truncate` or `line-clamp`).
- [ ] 125. Overlapping text on absolute containers is strictly prevented.
- [ ] 126. Placeholders maintain a contrast of at least `3:1` for legibility.
- [ ] 127. High-density balance listings use bold characters for totals.
- [ ] 128. Error labels use distinct deep red text styles.
- [ ] 129. Input labels contain no colons (`:`) to keep UI clean.
- [ ] 130. Dropdown options use high contrast text to allow quick scanning.
- [ ] 131. Long text logs wrap cleanly instead of overflowing card container boundaries.
- [ ] 132. Technical metrics have smaller supporting unit labels.
- [ ] 133. Subtext displays with small fonts (`text-xs`).
- [ ] 134. Table totals rows have explicit double underlines or bold borders.
- [ ] 135. Chart numeric scales are kept readable with rounded monospaced labels.
- [ ] 136. Calendar day numbers align perfectly inside circle dates.
- [ ] 137. POS checkout screens use display typography for total pricing.
- [ ] 138. Navigation links maintain clear active focus weights.
- [ ] 139. Alert messages avoid all caps to prevent aggressive yelling tone.
- [ ] 140. Printed receipts enforce high contrast pure black ink.
- [ ] 141. Multi-line titles enforce distinct line spacing rules.
- [ ] 142. Dynamic numeric changes avoid shaking layout structures.
- [ ] 143. Accordion headers remain bold to separate nested content.
- [ ] 144. Tab titles match width scales predictably.
- [ ] 145. Dialog descriptions use readable secondary fonts.
- [ ] 146. User avatar names display initials in bold sans-serif.
- [ ] 147. Footnotes inside print structures are scaled to `10px`.
- [ ] 148. Form validations highlight failing characters clearly.
- [ ] 149. Audit trace codes include small copy-to-clipboard actions.
- [ ] 150. Global reading flow preserves natural LTR/RTL font selections.

### 40.4 Accessibility & WCAG 2.2 AA (50 Checkpoints)
- [ ] 151. Every image contains an explicit alt description or empty tag for decoratives.
- [ ] 152. Interactive icons have explicit `aria-label` tags for screen readers.
- [ ] 153. Main navigation elements utilize `<nav>` landmark tags.
- [ ] 154. Form fields are explicitly linked with `<label>` tags using `htmlFor`.
- [ ] 155. System modallings trap keyboard focus correctly.
- [ ] 156. Pressing escape closes active modal dialogs.
- [ ] 157. Active interactive elements have high contrast focus borders.
- [ ] 158. Dynamic contents notify screen readers via appropriate `aria-live` regions.
- [ ] 159. Interactive controls have a minimum touch target height of `44px` on desktop.
- [ ] 160. Color is never used as the sole indicator of system status or errors.
- [ ] 161. Screen readers read multi-column data sheets in logical order.
- [ ] 162. All pages have descriptive page titles.
- [ ] 163. Custom select controls map keyboard up/down arrows to option loops.
- [ ] 164. Drag-and-drop elements provide alternative keyboard commands.
- [ ] 165. Skeletons have an `aria-busy` attribute set during data load.
- [ ] 166. Progress indicators have `role="progressbar"` with valid range tags.
- [ ] 167. Interactive tables have header tags linked with data cells.
- [ ] 168. Status badges include visually hidden descriptive labels.
- [ ] 169. Screen zoom up to 200% prevents horizontal reading scrolls or clipping.
- [ ] 170. System links have high contrast underlines.
- [ ] 171. Dropdown menus display active keyboard indicators.
- [ ] 172. Dynamic tooltips are fully keyboard accessible on hover or focus.
- [ ] 173. Inline notifications have distinct error/success warning icons.
- [ ] 174. Touch gestures are mapped to alternate physical click regions.
- [ ] 175. Search inputs have descriptive submit button actions.
- [ ] 176. Video or audio alerts provide dynamic text subtitles.
- [ ] 177. Language variations are tagged with appropriate HTML lang markers.
- [ ] 178. Form validation warnings list error targets on top of pages.
- [ ] 179. Multi-step wizards outline progress levels.
- [ ] 180. Page headings follow strict hierarchical orders (H1 to H6).
- [ ] 181. Dialog backdrops block keyboard focus behind them.
- [ ] 182. Tooltips provide dismiss buttons for touch screen users.
- [ ] 183. Checkboxes allow click states on labels.
- [ ] 184. Hover states avoid structural modifications to prevent visual jumps.
- [ ] 185. Monospaced codes preserve text copy buttons for screen readers.
- [ ] 186. Form fields map autocomplete parameters predictably.
- [ ] 187. Color blind palettes avoid red-green overlaps without indicators.
- [ ] 188. Charts provide text tabular summary lists.
- [ ] 189. Active popovers display descriptive labels.
- [ ] 190. Print outputs have formatted titles.
- [ ] 191. Focus indicators are kept highly visible at all times.
- [ ] 192. Interactive buttons have explicit action mappings.
- [ ] 193. Empty states guide the keyboard to primary triggers.
- [ ] 194. Validation systems prevent submitting during error phases.
- [ ] 195. Tree structures use collapse tags clearly.
- [ ] 196. Table pagination elements remain keyboard accessible.
- [ ] 197. Navigation lists are mapped inside `<ul>` elements.
- [ ] 198. Background overlays have explicit aria-hidden attributes.
- [ ] 199. Custom inputs preserve native keyboard actions.
- [ ] 200. Focus shifts to newly opened dialogs automatically.

### 40.5 Responsive & Device Compatibility (50 Checkpoints)
- [ ] 201. Responsive views scale smoothly from mobile `320px` to ultra-wide desktop.
- [ ] 202. Navigation sidebars fold automatically on viewports below `1024px`.
- [ ] 203. Mobile layouts have touch targets of at least `44px` with clear spacing.
- [ ] 204. Data tables collapse to scrollable areas on mobile without breaking grid margins.
- [ ] 205. Complex grid structures switch from 4-columns to single-columns on mobile.
- [ ] 206. POS Terminal interface scales to standard industrial touch monitors.
- [ ] 207. Input labels remain on top of form fields on mobile to maximize horizontal width.
- [ ] 208. Sticky action bars attach to the bottom edge on mobile screens.
- [ ] 209. Images scale proportionally without stretching layout margins.
- [ ] 210. Dialog modals expand to full screen overlays on mobile.
- [ ] 211. Floating buttons avoid blocking form inputs.
- [ ] 212. Multi-step wizards switch to progress circles on small screens.
- [ ] 213. Swipe gestures on mobile lists have descriptive visual highlights.
- [ ] 214. Skeletons match layout column counts across breakpoints.
- [ ] 215. Horizontal scrollbars are restricted to custom tables.
- [ ] 216. Charts resize dynamically using container width listeners.
- [ ] 217. Slices on mobile charts display detail descriptors below the chart.
- [ ] 218. Header notifications stack cleanly inside single lists.
- [ ] 219. Touch screens have hover states deactivated.
- [ ] 220. Numeric keypads are placed logically on mobile POS screens.
- [ ] 221. Text sizes scale down slightly on mobile to preserve layout space.
- [ ] 222. Search inputs expand to full-screen interfaces on mobile.
- [ ] 223. Large margins scale down to `12px` on mobile viewports.
- [ ] 224. Sidebar drawers toggle smoothly using performance-optimized gestures.
- [ ] 225. Print templates ignore layout column scaling.
- [ ] 226. Fixed panels display scroll indicators if content exceeds height.
- [ ] 227. Close buttons are kept highly targetable on small screens.
- [ ] 228. Checkboxes on lists use full row click bounds on mobile.
- [ ] 229. Long names truncate predictably on mobile headers.
- [ ] 230. Multi-select lists collapse tags into count indicators (e.g., "+3 selected").
- [ ] 231. Double-column details views collapse to sequential rows on mobile.
- [ ] 232. Tooltips are activated by physical clicks on touch devices.
- [ ] 233. Dynamic popovers reposition above elements to prevent bottom overflow.
- [ ] 234. Input fields zoom levels on iOS remain above 16px to prevent system zoom.
- [ ] 235. Custom select dropdowns fallback to native controls on mobile.
- [ ] 236. Form sections use clear headers instead of dense boxes on mobile.
- [ ] 237. Sticky headers have shadow indications during scrolling.
- [ ] 238. System banners stack cleanly on mobile.
- [ ] 239. Multi-column forms split into clean mobile fields.
- [ ] 240. Bottom drawers handle gestures predictably.
- [ ] 241. Skeletons preserve margins during device rotation transitions.
- [ ] 242. Interactive maps support pinch-to-zoom gestures.
- [ ] 243. Print output sheets display pages correctly.
- [ ] 244. Touch buttons include visual active states.
- [ ] 245. Dialog cards wrap margins predictably.
- [ ] 246. Search filters collapse into full screen side-drawers on mobile.
- [ ] 247. Dynamic values use monospaced text to prevent wrapping issues on mobile.
- [ ] 248. Sticky sidebars remain locked on large desktop screens.
- [ ] 249. System footers hide secondary links on mobile.
- [ ] 250. Dynamic viewport heights handle mobile browser navigation bars without cutting off layout cards.

### 40.6 High-Density Performance & Visual Polish (50 Checkpoints)
- [ ] 251. Transitions and micro-animations complete in under `200ms`.
- [ ] 252. List rendering handles 1,000+ items without layout freeze or stutter.
- [ ] 253. Dynamic lists utilize virtual scrolling to preserve DOM nodes.
- [ ] 254. Active buttons disable pointer triggers during processing states.
- [ ] 255. All images specify `referrerPolicy="no-referrer"` to prevent secure token leakages.
- [ ] 256. Font families load asynchronously with non-blocking display swap rules.
- [ ] 257. Contrast scores are maintained on dark surfaces under strong glare.
- [ ] 258. CSS borders use clean slate shades to replace blurry shadows.
- [ ] 259. Page canvas layouts maintain a clear off-white background to avoid eye strain.
- [ ] 260. Hover transitions utilize smooth linear timings.
- [ ] 261. System modals load in under `100ms` for immediate action response.
- [ ] 262. Checkbox elements avoid double rendering under React state ticks.
- [ ] 263. Dropdowns reposition instantly on parent coordinate changes.
- [ ] 264. Sticky elements are hardware-accelerated using transform layers.
- [ ] 265. Layout shifting is minimized through persistent container sizing.
- [ ] 266. Static SVG badges are rendered inline to save server roundtrips.
- [ ] 267. SVG elements scale cleanly without pixelation.
- [ ] 268. Monospaced lines preserve standard letter spacing parameters.
- [ ] 269. Detail visual cards avoid complex gradients to optimize memory.
- [ ] 270. Toast notifications fade out cleanly without displacing active elements.
- [ ] 271. Skeletons use linear animations to optimize browser thread rendering.
- [ ] 272. Drag-and-drop targets highlight clearly on hover.
- [ ] 273. Input hover indicators are clear and subtle.
- [ ] 274. Dialog boxes enter and exit predictably.
- [ ] 275. Print stylesheets have non-essential colors excluded.
- [ ] 276. Interactive charts have smooth hover crosshairs.
- [ ] 277. Focus indicators preserve distinct margins from element edges.
- [ ] 278. Table cells have consistent vertical padding.
- [ ] 279. Empty state cards keep primary prompts prominent.
- [ ] 280. Tabs use high-contrast text tags.
- [ ] 281. Error dialogs state the exact reason in clear language.
- [ ] 282. Localized Arabic text displays without cutting off low character curves.
- [ ] 283. Header bars include high contrast bottom rules.
- [ ] 284. Badge capsules use distinct borders on dark surfaces.
- [ ] 285. Multi-column forms have clear vertical grids.
- [ ] 286. Navigation sidebar items transition with smooth background shifts.
- [ ] 287. Form fields prevent auto-zoom issues.
- [ ] 288. POS term displays prioritize large bold values.
- [ ] 289. Inactive tabs are clearly dimmed to prevent confusion.
- [ ] 290. System alerts preserve visible closure icons.
- [ ] 291. Print layouts enforce standard margin boundaries.
- [ ] 292. Charts have responsive containers to prevent clipping.
- [ ] 293. Multi-select pill lists have clear removal buttons.
- [ ] 294. Modal scrollbars are hidden when content fits viewports.
- [ ] 295. Sticky action bars use high-contrast shadow lines.
- [ ] 296. Checkboxes allow click states across their full labels.
- [ ] 297. Active input outlines use clear primary brand coloring.
- [ ] 298. Layout grids enforce clean, proportional gutters.
- [ ] 299. High contrast text labels are mapped across all status badges.
- [ ] 300. Final page loads compile cleanly with zero layout shift or console warning leaks.

---

This Master Design Specification is signed and approved for platform-wide implementation. No deviations are allowed without written permission from the Chief Product Architect.
