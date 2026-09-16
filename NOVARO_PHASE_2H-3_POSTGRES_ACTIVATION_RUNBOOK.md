# NOVARO ERP — PHASE 2H-3: REAL POSTGRESQL EXTERNAL ACTIVATION RUNBOOK

> **Status:** READY FOR EXTERNAL POSTGRESQL ACTIVATION  
> **Environment Gate:** STRICT ENVIRONMENT CONTRACT (`DATABASE_PROVIDER=postgres` + `DATABASE_URL`)  
> **Security Policy:** ZERO MOCK, ZERO FAKE, ZERO HARDCODED SECRETS, SAFE URL HANDLING

This operational runbook provides the verified, step-by-step procedures to provision, connect, migrate, and certify NOVARO ERP against an external, production-grade PostgreSQL 16 instance (such as Cloud SQL, AWS RDS, Supabase, Neon, or dedicated containerized PostgreSQL).

---

## Prerequisites & Constraints

1. **PostgreSQL Version:** 16.x or newer (Alpine or Standard Linux distribution).
2. **Extensions:** Standard PostgreSQL engine (no proprietary or unverified extensions needed; DDL uses standard SQL and UUID/Timestamps).
3. **Network Accessibility:** Accessible via direct TCP or SSL from the application runtime.
4. **Zero Fallback Invariant:** The application never automatically falls back to PGlite when `DATABASE_PROVIDER=postgres` is set. Missing credentials or failed connections will trigger an immediate **FAIL FAST**.

---

## 13-Step Production Activation Procedure

### Step 1: Provision External PostgreSQL 16 Server
Provision a PostgreSQL 16 database instance on your cloud provider or infrastructure:
- **Cloud SQL (GCP):** Cloud SQL for PostgreSQL 16
- **AWS RDS:** PostgreSQL 16.x
- **Container / Dedicated VM:** `postgres:16-alpine`

### Step 2: Create the Database
Connect as administrative superuser (`postgres`) and create the dedicated database:
```sql
CREATE DATABASE novaro_erp
  WITH
  ENCODING = 'UTF8'
  LC_COLLATE = 'C'
  LC_CTYPE = 'C'
  TEMPLATE = template0;
```

### Step 3: Create Dedicated Database Role/User
Create an isolated application user with a cryptographically strong password (generate a minimum 32-character random string):
```sql
CREATE USER novaro WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
```

### Step 4: Grant Required Permissions
Grant the user schema and object privileges on `novaro_erp`:
```sql
\c novaro_erp

-- Grant schema permissions
GRANT CONNECT ON DATABASE novaro_erp TO novaro;
GRANT USAGE, CREATE ON SCHEMA public TO novaro;

-- Grant future object defaults
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO novaro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO novaro;
```

### Step 5: Configure Environment Secrets
Add the PostgreSQL connection string as a secure environment variable. Never commit this to source control or logs.
```bash
# Connection string format:
# postgresql://<username>:<password>@<hostname>:<port>/<database>?sslmode=require
export DATABASE_URL="postgresql://novaro:YOUR_STRONG_PASSWORD_HERE@YOUR_HOST:5432/novaro_erp?sslmode=require"
```

### Step 6: Explicitly Set Database Provider
Set the explicit database provider. No automatic inference is permitted:
```bash
export DATABASE_PROVIDER=postgres
export DATABASE_SSL=true
export DATABASE_POOL_MAX=10
```

### Step 7: Execute Real PostgreSQL 9-Step Protocol Probe
Run the standalone 9-step connection probe to verify TCP connectivity, authentication, schema query, and transactional rollback:
```bash
npm run db:probe
```
*Expected Output:*
- `[Step 1 & 2] Establishing TCP socket & PostgreSQL auth handshake... ✅`
- `[Step 3] Querying engine version (SELECT version())... ✅`
- `[Step 4] Querying active database (SELECT current_database())... ✅`
- `[Step 5] Querying search path schema (SELECT current_schema())... ✅`
- `[Step 6] Testing transaction initiation (BEGIN)... ✅`
- `[Step 7] Executing probe query in transaction (SELECT 1, NOW())... ✅`
- `[Step 8] Testing clean transaction rollback (ROLLBACK)... ✅`
- `[Step 9] Closing client socket cleanly... ✅`

### Step 8: Apply Production DDL Migrations
Execute the Drizzle migration runner against the external PostgreSQL instance:
```bash
npm run db:migrate
```
*Note:* The migration runner strictly rejects PGlite and requires `DATABASE_PROVIDER=postgres` with valid connection credentials. It automatically records applied migration states in `drizzle.__drizzle_migrations`.

### Step 9: Run Schema & Migration Parity Audit
Verify that all 29 tables, foreign keys, composite constraints, and enum checks match the schema definition:
```bash
npm run test:parity
```
*Expected Output:*
- `31/31 Checks Passed (0 Failed)`

### Step 10: Run Master PostgreSQL Certification Suite
Execute the full real certification gate covering all 11 certification suites:
```bash
npm run test:postgres
```
*Gates Certified:*
1. Explicit Provider Contract Audit (7 checks)
2. Config & Security Guard (10 checks)
3. Phase 2D-R1 Security Suite (30 security controls, RBAC, tokens, policies)
4. Master Domain Certification (Accounting, FIFO layers, yield physics)
5. Phase 2C UnitOfWork & Rollback Invariants
6. Schema & Table Parity Audit (31 checks)
7. Sync Queue Negative & Composite Constraints (8 checks)
8. Auth Rate Limiter Contract (4 checks)
9. Concurrent Login Lockout Invariant (3 checks)
10. Concurrent Refresh Token Rotation & Replay Defense (2 checks)
11. Phase 2G Real ERP End-to-End Scenarios (12 scenarios A through L)

### Step 11: Run TypeScript Type Check
Ensure complete type safety across the repository with zero errors:
```bash
npm run lint
```
*Expected Output:* Clean exit with code 0 (`tsc --noEmit`).

### Step 12: Run Production Build
Verify client and server bundle generation:
```bash
npm run build
```
*Expected Output:* Clean production build in `dist/` with `dist/server.cjs`.

### Step 13: Log & Record Final Certification Status
Upon successful execution of all steps above:
- **Final Status:** `REAL POSTGRESQL CERTIFIED PASS`
- Document the certified database version, host, and timestamp in operational release notes.
- If external PostgreSQL credentials are not provided or the instance is unreachable:
  - **Final Status:** `READY FOR EXTERNAL POSTGRESQL ACTIVATION`
  - **Real Certification:** `BLOCKED / NOT EXECUTED` (Zero False Pass).
