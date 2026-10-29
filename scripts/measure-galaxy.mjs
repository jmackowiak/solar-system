// Native desktop GPU measurement plus clearly labelled mobile-size emulation.
// Start a production preview on 4174; HEADED=1 enables Metal on macOS.
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  headless: process.env.HEADED !== "1",
  args: [
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    ...(process.env.HEADED === "1"
      ? ["--use-angle=metal"]
      : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
  ],
});
const results = [];
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
      isMobile: viewport.width < 700,
      hasTouch: viewport.width < 700,
    });
    const page = await context.newPage();
    await page.goto(process.env.ORBITA_URL || "http://localhost:4174");
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="scene"]')?.dataset.ready ===
        "true",
    );
    const system = await page.evaluate(() => {
      const gl = document.querySelector("canvas").getContext("webgl2"),
        ext = gl.getExtension("WEBGL_debug_renderer_info"),
        first = performance.getEntriesByName("orbita-ready")[0].startTime;
      return {
        gpu: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
        userAgent: navigator.userAgent,
        firstUsefulMs: first,
        transferBeforeReady: performance
          .getEntriesByType("resource")
          .concat(performance.getEntriesByType("navigation"))
          .filter((x) => x.responseEnd <= first)
          .reduce((n, x) => n + x.transferSize, 0),
      };
    });
    async function capture(duration, transition = false) {
      return page.evaluate(
        ({ duration, transition }) =>
          new Promise((resolve) => {
            const s = document.querySelector('[data-testid="scene"]'),
              start = performance.now(),
              samples = [];
            let last = start,
              count = Number(s.dataset.frames);
            function tick(now) {
              const next = Number(s.dataset.frames);
              if (next !== count) {
                samples.push(now - last);
                last = now;
                count = next;
              }
              const done = transition
                ? s.dataset.flight === "false" &&
                  s.dataset.scaleFlight === "false" &&
                  samples.length > 2
                : now - start >= duration;
              if (!done && now - start < 15000) requestAnimationFrame(tick);
              else {
                samples.sort((a, b) => a - b);
                resolve({
                  durationMs: now - start,
                  fps: samples.length / ((now - start) / 1000),
                  medianMs: samples[Math.floor(samples.length * 0.5)] ?? null,
                  p95Ms: samples[Math.floor(samples.length * 0.95)] ?? null,
                  frames: samples.length,
                  quality: s.dataset.quality,
                  dpr: s.dataset.pixelRatio,
                  draws: s.dataset.draws,
                  points: s.dataset.points,
                  triangles: s.dataset.triangles,
                });
              }
            }
            requestAnimationFrame(tick);
          }),
        { duration, transition },
      );
    }
    await page.getByRole("button", { name: "Milky Way", exact: true }).click();
    const enter = await capture(0, true);
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="scene"]').dataset.galaxyBlend ===
        "1",
    );
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector(".scale-flight-label"))
          .visibility === "hidden",
    );
    const idle = await page.evaluate(async () => {
      const s = document.querySelector('[data-testid="scene"]'),
        before = Number(s.dataset.frames),
        days = s.dataset.days;
      for (let i = 0; i < 120; i++)
        await new Promise((r) => requestAnimationFrame(r));
      return {
        renderedFrames: Number(s.dataset.frames) - before,
        simulationUnchanged: s.dataset.days === days,
      };
    });
    const box = await page.locator("canvas").boundingBox(),
      x = box.width * 0.4,
      y = box.height * 0.48;
    await page.mouse.move(x, y);
    await page.mouse.down();
    const orbitSample = capture(5000);
    const started = Date.now();
    let step = 0;
    while (Date.now() - started < 5000) {
      await page.mouse.move(
        x + Math.sin(step * 0.08) * 45,
        y + Math.cos(step * 0.065) * 25,
      );
      step++;
    }
    await page.mouse.up();
    const orbit = await orbitSample;
    await page.getByRole("button", { name: "Reset view", exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="scene"]').dataset.flight ===
        "false",
    );
    await page.screenshot({
      path: `artifacts/galaxy-verified-${viewport.width}.png`,
    });
    await page
      .getByRole("button", { name: "Solar System", exact: true })
      .click();
    const leave = await capture(0, true);
    results.push({ viewport, ...system, enter, idle, orbit, leave });
    await context.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile(
  "artifacts/galaxy-performance.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
