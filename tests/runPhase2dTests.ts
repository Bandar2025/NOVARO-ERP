import { runPhase2dAuthTestSuite } from "./phase2dIdentityAuthIntegrationSuite";

async function main() {
  try {
    const res = await runPhase2dAuthTestSuite();
    if (res.failCount > 0) {
      console.error(`Suite finished with ${res.failCount} failures.`);
      process.exit(1);
    } else {
      console.log("ALL PHASE 2D IDENTITY & AUTHENTICATION INTEGRATION TESTS PASSED!");
      process.exit(0);
    }
  } catch (e) {
    console.error("Fatal Error running Phase 2D Test Suite:", e);
    process.exit(1);
  }
}

main();
