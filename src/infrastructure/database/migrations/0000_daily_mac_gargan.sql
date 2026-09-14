CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"commercial_registration" text,
	"tax_number" text,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"settings" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text,
	"branch_id" text,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"type" text NOT NULL,
	"parent_id" text,
	"balance" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"fiscal_year_id" text,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_years" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"date" text NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"rate" numeric(10, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"fiscal_period_id" text,
	"date" text NOT NULL,
	"reference" text NOT NULL,
	"notes" text,
	"posted" boolean DEFAULT false NOT NULL,
	"workflow_status" text DEFAULT 'Draft' NOT NULL,
	"currency" text DEFAULT 'SAR',
	"exchange_rate" numeric(10, 6) DEFAULT '1.000000',
	"is_recurring" boolean DEFAULT false,
	"reversal_of_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entry_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"journal_entry_id" text NOT NULL,
	"account_id" text NOT NULL,
	"account_name" text NOT NULL,
	"debit" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"credit" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"customer_id" text NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(15, 4) NOT NULL,
	"reference" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"balance" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"supplier_id" text NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(15, 4) NOT NULL,
	"reference" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"balance" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"sku" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"price" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"cost" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"barcode" text,
	"current_stock" numeric(12, 4) DEFAULT '0.0000' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"batch_number" text NOT NULL,
	"item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"manufacture_date" text NOT NULL,
	"expiry_date" text NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"supplier_id" text,
	"cost_per_unit" numeric(15, 4) NOT NULL,
	"warehouse_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_layers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"item_id" text NOT NULL,
	"warehouse_id" text NOT NULL,
	"batch_number" text NOT NULL,
	"date_received" text NOT NULL,
	"original_quantity" numeric(12, 4) NOT NULL,
	"remaining_quantity" numeric(12, 4) NOT NULL,
	"unit_cost" numeric(15, 4) NOT NULL,
	"source_reference" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"warehouse_id" text NOT NULL,
	"movement_type" text NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit_cost" numeric(15, 4) NOT NULL,
	"total_cost" numeric(15, 4) NOT NULL,
	"batch_number" text NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" text NOT NULL,
	"date" text NOT NULL,
	"created_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"warehouse_id" text NOT NULL,
	"item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"cost_per_unit" numeric(15, 4) NOT NULL,
	"notes" text,
	"workflow_status" text DEFAULT 'Draft' NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_invoice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"sales_invoice_id" text NOT NULL,
	"item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"price" numeric(15, 4) NOT NULL,
	"total" numeric(15, 4) NOT NULL,
	"cogs_amount" numeric(15, 4) DEFAULT '0.0000',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"customer_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"date" text NOT NULL,
	"status" text DEFAULT 'Unpaid' NOT NULL,
	"workflow_status" text DEFAULT 'Draft' NOT NULL,
	"type" text DEFAULT 'Wholesale' NOT NULL,
	"currency" text DEFAULT 'SAR',
	"exchange_rate" numeric(10, 6) DEFAULT '1.000000',
	"subtotal" numeric(15, 4) DEFAULT '0.0000',
	"tax_amount" numeric(15, 4) DEFAULT '0.0000',
	"total_amount" numeric(15, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"purchase_order_id" text NOT NULL,
	"item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"price" numeric(15, 4) NOT NULL,
	"total" numeric(15, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"supplier_id" text NOT NULL,
	"supplier_name" text NOT NULL,
	"date" text NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"workflow_status" text DEFAULT 'Draft' NOT NULL,
	"currency" text DEFAULT 'SAR',
	"exchange_rate" numeric(10, 6) DEFAULT '1.000000',
	"subtotal" numeric(15, 4) DEFAULT '0.0000',
	"tax_amount" numeric(15, 4) DEFAULT '0.0000',
	"total_amount" numeric(15, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"opened_at" text NOT NULL,
	"closed_at" text,
	"starting_cash" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"total_cash_sales" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"total_card_sales" numeric(15, 4) DEFAULT '0.0000' NOT NULL,
	"status" text DEFAULT 'Open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashbox_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(15, 4) NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"recipient" text NOT NULL,
	"payment_method" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_materials" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"recipe_id" text NOT NULL,
	"item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"description" text,
	"output_item_id" text NOT NULL,
	"output_item_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"timestamp" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"document_type" text NOT NULL,
	"fiscal_year_id" text NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_fiscal_year_id_fiscal_years_id_fk" FOREIGN KEY ("fiscal_year_id") REFERENCES "public"."fiscal_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_years" ADD CONSTRAINT "fiscal_years_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_years" ADD CONSTRAINT "fiscal_years_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_fiscal_period_id_fiscal_periods_id_fk" FOREIGN KEY ("fiscal_period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "journal_entry_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "journal_entry_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "journal_entry_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "journal_entry_items_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "journal_entry_items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_movements" ADD CONSTRAINT "customer_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_movements" ADD CONSTRAINT "customer_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_movements" ADD CONSTRAINT "customer_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_movements" ADD CONSTRAINT "customer_movements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_movements" ADD CONSTRAINT "supplier_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_movements" ADD CONSTRAINT "supplier_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_movements" ADD CONSTRAINT "supplier_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_movements" ADD CONSTRAINT "supplier_movements_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_sales_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "public"."sales_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashbox_transactions" ADD CONSTRAINT "cashbox_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashbox_transactions" ADD CONSTRAINT "cashbox_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashbox_transactions" ADD CONSTRAINT "cashbox_transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_materials" ADD CONSTRAINT "recipe_materials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_materials" ADD CONSTRAINT "recipe_materials_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_materials" ADD CONSTRAINT "recipe_materials_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_materials" ADD CONSTRAINT "recipe_materials_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_materials" ADD CONSTRAINT "recipe_materials_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_output_item_id_items_id_fk" FOREIGN KEY ("output_item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_years" ADD CONSTRAINT "uq_fiscal_years_tenant_company_id" UNIQUE("tenant_id", "company_id", "id");--> statement-breakpoint
ALTER TABLE "document_sequences" ADD CONSTRAINT "fk_seq_fiscal_year" FOREIGN KEY ("tenant_id", "company_id", "fiscal_year_id") REFERENCES "public"."fiscal_years"("tenant_id", "company_id", "id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "uq_companies_tenant_id" UNIQUE("tenant_id", "id");--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "uq_journal_entries_tenant_company_id" UNIQUE("tenant_id", "company_id", "id");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "uq_accounts_tenant_company_id" UNIQUE("tenant_id", "company_id", "id");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "uq_accounts_tenant_company_code" UNIQUE("tenant_id", "company_id", "code");--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "fk_jei_company" FOREIGN KEY ("tenant_id", "company_id") REFERENCES "public"."companies"("tenant_id", "id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "fk_jei_journal_entry" FOREIGN KEY ("tenant_id", "company_id", "journal_entry_id") REFERENCES "public"."journal_entries"("tenant_id", "company_id", "id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "fk_jei_account" FOREIGN KEY ("tenant_id", "company_id", "account_id") REFERENCES "public"."accounts"("tenant_id", "company_id", "id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "chk_jei_debit_nonneg" CHECK (debit >= 0);--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "chk_jei_credit_nonneg" CHECK (credit >= 0);--> statement-breakpoint
ALTER TABLE "journal_entry_items" ADD CONSTRAINT "chk_jei_not_both_positive" CHECK (debit = 0 OR credit = 0);--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "uq_items_tenant_company_id" UNIQUE("tenant_id", "company_id", "id");--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "uq_items_tenant_company_sku" UNIQUE("tenant_id", "company_id", "sku");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "uq_customers_tenant_company_id" UNIQUE("tenant_id", "company_id", "id");--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "uq_suppliers_tenant_company_id" UNIQUE("tenant_id", "company_id", "id");--> statement-breakpoint
CREATE INDEX "idx_tenants_code" ON "tenants" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_companies_tenant" ON "companies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_branches_tenant" ON "branches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_branches_company" ON "branches" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_users_tenant" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_users_company" ON "users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_tenant" ON "accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_company" ON "accounts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_code" ON "accounts" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "idx_fiscal_periods_tenant" ON "fiscal_periods" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_fiscal_periods_company" ON "fiscal_periods" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_fiscal_years_tenant" ON "fiscal_years" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_fiscal_years_company" ON "fiscal_years" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_exchange_rates_tenant" ON "exchange_rates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_exchange_rates_company" ON "exchange_rates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_je_tenant" ON "journal_entries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_je_company" ON "journal_entries" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_je_branch" ON "journal_entries" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_je_status" ON "journal_entries" USING btree ("tenant_id","company_id","posted");--> statement-breakpoint
CREATE INDEX "idx_je_date" ON "journal_entries" USING btree ("tenant_id","company_id","date");--> statement-breakpoint
CREATE INDEX "idx_jei_tenant" ON "journal_entry_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_jei_company" ON "journal_entry_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_jei_entry" ON "journal_entry_items" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "idx_jei_account" ON "journal_entry_items" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_cust_mov_tenant" ON "customer_movements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cust_mov_company" ON "customer_movements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_cust_mov_customer" ON "customer_movements" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customers_tenant" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_customers_company" ON "customers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_supp_mov_tenant" ON "supplier_movements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_supp_mov_company" ON "supplier_movements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_supp_mov_supplier" ON "supplier_movements" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_tenant" ON "suppliers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_company" ON "suppliers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_items_tenant" ON "items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_items_company" ON "items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_items_sku" ON "items" USING btree ("company_id","sku");--> statement-breakpoint
CREATE INDEX "idx_warehouses_tenant" ON "warehouses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_warehouses_company" ON "warehouses" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_batches_tenant" ON "stock_batches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_batches_company" ON "stock_batches" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_batches_item" ON "stock_batches" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_batches_warehouse" ON "stock_batches" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_cost_layers_tenant" ON "cost_layers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cost_layers_company" ON "cost_layers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_cost_layers_item_wh" ON "cost_layers" USING btree ("item_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_cost_layers_date" ON "cost_layers" USING btree ("date_received");--> statement-breakpoint
CREATE INDEX "idx_sm_tenant" ON "stock_movements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sm_company" ON "stock_movements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_sm_item" ON "stock_movements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_sm_warehouse" ON "stock_movements" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_sm_ref" ON "stock_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_adj_tenant" ON "inventory_adjustments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_adj_company" ON "inventory_adjustments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_sales_inv_items_tenant" ON "sales_invoice_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sales_inv_items_company" ON "sales_invoice_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_sales_inv_items_inv" ON "sales_invoice_items" USING btree ("sales_invoice_id");--> statement-breakpoint
CREATE INDEX "idx_sales_inv_tenant" ON "sales_invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sales_inv_company" ON "sales_invoices" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_sales_inv_cust" ON "sales_invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_sales_inv_date" ON "sales_invoices" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_po_items_tenant" ON "purchase_order_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_po_items_company" ON "purchase_order_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_po_items_po" ON "purchase_order_items" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_po_tenant" ON "purchase_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_po_company" ON "purchase_orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_po_supplier" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_po_date" ON "purchase_orders" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_pos_ses_tenant" ON "pos_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_pos_ses_company" ON "pos_sessions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_cashbox_tx_tenant" ON "cashbox_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cashbox_tx_company" ON "cashbox_transactions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_mat_tenant" ON "recipe_materials" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_mat_company" ON "recipe_materials" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_mat_recipe" ON "recipe_materials" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_recipes_tenant" ON "recipes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_recipes_company" ON "recipes" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_audit_tenant" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_audit_company" ON "audit_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_time" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_doc_seq_scope" ON "document_sequences" USING btree ("tenant_id","company_id","branch_id","document_type","fiscal_year_id");--> statement-breakpoint
CREATE INDEX "idx_doc_seq_tenant" ON "document_sequences" USING btree ("tenant_id");