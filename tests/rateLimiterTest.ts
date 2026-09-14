import { InMemoryRateLimiter } from "../server/middleware/rateLimiter";

async function runRateLimiterContractTest() {
  console.log("==========================================================================");
  console.log("   NOVARO ERP — AUTH RATE LIMITER CONTRACT & CONCURRENCY TEST");
  console.log("==========================================================================");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${message ? `: ${message}` : ""}`);
      failed++;
    }
  }

  const limiter = new InMemoryRateLimiter();
  const testIp1 = "192.168.1.100";
  const testIp2 = "192.168.1.101";
  const limit = 5;
  const windowMs = 1000; // 1 second for fast test

  // 1. Verify limit enforcement
  let allFirstAllowed = true;
  for (let i = 0; i < limit; i++) {
    const allowed = limiter.check(testIp1, limit, windowMs);
    if (!allowed) allFirstAllowed = false;
  }
  assert("First 5 requests within limit are allowed", allFirstAllowed);

  // 6th request must be rejected
  const sixthAllowed = limiter.check(testIp1, limit, windowMs);
  assert("6th request exceeding limit is blocked", !sixthAllowed);

  // 2. Verify IP isolation
  const otherIpAllowed = limiter.check(testIp2, limit, windowMs);
  assert("Separate IP is not blocked by another IP's rate limit", otherIpAllowed);

  // 3. Verify window reset after expiration
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const afterResetAllowed = limiter.check(testIp1, limit, windowMs);
  assert("Requests allowed after rate limit window expiration", afterResetAllowed);

  console.log("\nℹ️ [ARCHITECTURAL NOTE]: InMemoryRateLimiter is single-node only.");
  console.log("   For distributed production deployments, replace with PostgreSQL/Redis persistent store.");

  console.log("==========================================================================");
  console.log(`   RATE LIMITER CONTRACT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRateLimiterContractTest().catch((err) => {
  console.error("Rate limiter test error:", err);
  process.exit(1);
});
