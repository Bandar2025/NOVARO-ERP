import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: ".env" });

// Ensure server process boots reliably in AI Studio preview/container environments
// where .env files may be removed or absent, while preserving explicit provider config in db.ts.
if (!process.env.DATABASE_PROVIDER) {
  process.env.DATABASE_PROVIDER = "pglite";
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = crypto
    .createHash("sha256")
    .update("novaro-erp-runtime-jwt-secret-key-2026")
    .digest("hex");
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  process.env.JWT_REFRESH_SECRET = crypto
    .createHash("sha256")
    .update("novaro-erp-runtime-jwt-refresh-secret-2026")
    .digest("hex");
}
