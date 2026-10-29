// Measures delivered WebGL frames, not a Lighthouse score. Run after npm run build.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
await fs.mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  headless: process.env.HEADED !== "1",
  args: [
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    ...(process.env.HEADED === "1" ? ["--use-angle=metal"] : []),
  ],
});
const results = [];
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width < 700,
    hasTouch: viewport.width < 700,
  });
  const page = await context.newPage();
  await page.goto(process.env.ORBITA_URL || "http://localhost:4174");
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="scene"]')?.dataset.ready === "true",
  );
  const load = await page.evaluate(() => {
    const first =
      performance.getEntriesByName("orbita-ready")[0]?.startTime ||
      performance.now();
    return {
      firstUsefulMs: first,
      transferBytesBeforeReady: performance
        .getEntriesByType("resource")
        .concat(performance.getEntriesByType("navigation"))
        .filter((x) => x.responseEnd <= first)
        .reduce((n, x) => n + x.transferSize, 0),
      navigator: navigator.userAgent,
    };
  });
  const gpu = await page.evaluate(() => {
    const g = document.querySelector("canvas").getContext("webgl2"),
      e = g.getExtension("WEBGL_debug_renderer_info");
    return g.getParameter(e.UNMASKED_RENDERER_WEBGL);
  });
  async function measure(ms) {
    return page.evaluate(
      (duration) =>
        new Promise((resolve) => {
          const frames = [],
            scene = document.querySelector('[data-testid="scene"]');
          let last = performance.now(),
            start = last,
            count = Number(scene.dataset.frames);
          function tick(now) {
            const next = Number(scene.dataset.frames);
            if (next !== count) {
              frames.push(now - last);
              last = now;
              count = next;
            }
            if (now - start < duration) requestAnimationFrame(tick);
            else {
              frames.sort((a, b) => a - b);
              resolve({
                fps: frames.length / ((now - start) / 1000),
                medianMs: frames[Math.floor(frames.length * 0.5)],
                p95Ms: frames[Math.floor(frames.length * 0.95)],
                samples: frames.length,
                quality: scene.dataset.quality,
                dpr: scene.dataset.pixelRatio,
                draws: scene.dataset.draws,
                triangles: scene.dataset.triangles,
              });
            }
          }
          requestAnimationFrame(tick);
        }),
      ms,
    );
  }
  // Wait for initial textures and stable framing, without counting warm-up as steady performance.
  await page.waitForFunction(
    () =>
      Number(document.querySelector('[data-testid="scene"]').dataset.frames) >
      120,
  );
  const overview = await measure(5000);
  await page
    .getByRole("button", { name: "Select Saturn", exact: true })
    .click();
  const flight = await measure(1700);
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="scene"]').dataset.flight ===
      "false",
  );
  const close = await measure(5000);
  await page.screenshot({ path: `artifacts/verified-${viewport.width}.png` });
  results.push({ viewport, gpu, ...load, overview, flight, close });
  await context.close();
}
await browser.close();
await fs.mkdir("artifacts", { recursive: true });
await fs.writeFile(
  "artifacts/performance.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
