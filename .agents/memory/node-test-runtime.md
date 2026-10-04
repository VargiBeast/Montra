---
name: Node test runtime
description: Runtime compatibility constraints for executing TypeScript-importing tests in this Replit workspace.
---

The active Replit runtime is Node 20.20, which rejects `--experimental-strip-types`. The existing test script uses that option, so `npm test` cannot start in this runtime. TypeScript 7 also removed the old `node10` module-resolution mode, so do not rely on that mode for a quick temporary test compile.

**Why:** Repeated test-runner attempts exposed a mismatch between the project's Node 20 runtime and its test command; changing app runtime or dependencies just to run tests could affect the existing project setup.

**How to apply:** Before changing the runtime or adding a loader, check the package-management guidance and project toolchain. Prefer a supported test loader compatible with the configured Node version, or run the test suite under a deliberately selected compatible runtime. Build and browser verification remain separate checks.