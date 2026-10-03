import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProductionServer } from "../scripts/serve-production.mjs";

test("production server serves the SPA, assets, cache headers and errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "saldo-production-"));
  await mkdir(join(directory, "assets"), { recursive: true });
  await writeFile(join(directory, "index.html"), "<!doctype html><title>Saldo production</title>");
  await writeFile(join(directory, "assets", "app-12345678.js"), "console.log('built');");

  const server = createProductionServer(directory);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const page = await fetch(`${origin}/transactions`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type") ?? "", /text\/html/);
    assert.match(page.headers.get("cache-control") ?? "", /no-cache/);
    assert.match(await page.text(), /Saldo production/);

    const asset = await fetch(`${origin}/assets/app-12345678.js`);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get("content-type") ?? "", /javascript/);
    assert.match(asset.headers.get("cache-control") ?? "", /immutable/);

    const missingAsset = await fetch(`${origin}/assets/missing.js`);
    assert.equal(missingAsset.status, 404);

    const unsupportedMethod = await fetch(origin, { method: "POST" });
    assert.equal(unsupportedMethod.status, 405);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await rm(directory, { recursive: true, force: true });
  }
});