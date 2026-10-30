// Run after a production build, with a separately started production preview.
// HEADED=1 requests Chromium's native Metal backend on macOS. Never run alongside
// browser tests or another GPU benchmark. The narrow viewport is phone emulation.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import os from "node:os";

const url = process.env.ORBITA_URL || "http://localhost:4174";
const headed = process.env.HEADED === "1";
const report = {
  measuredAt: new Date().toISOString(),
  url,
  conditions: {
    headed,
    requestedBackend: headed ? "ANGLE Metal" : "browser default",
    operatingSystem: { platform: os.platform(), release: os.release(), arch: os.arch() },
    cpu: os.cpus()[0]?.model,
    totalMemoryGiB: Math.round(os.totalmem() / 1024 ** 3),
    qualitySetting: "Auto (application default)",
    continuousWindowMs: 5000,
    idleWindowMs: 1000,
    measurement: "Renderer data-frames deltas observed on requestAnimationFrame; frame intervals are delivered-frame intervals, not GPU timer-query timings.",
    phoneLimitation: "390 × 844 is a touch-enabled Chromium viewport on this computer, not a physical-phone measurement.",
  },
  viewports: [],
};
console.log("Orbita discovery measurements: desktop 1440×900 and phone EMULATION 390×844.");
console.log("The narrow viewport is not a physical phone. Run sequentially, without other GPU work.");

const scene = page => page.getByTestId("scene");
async function frameCount(page) {
  return Number(await scene(page).getAttribute("data-frames"));
}
async function actualFrames(page, count) {
  const first = await frameCount(page);
  await page.waitForFunction(({ first, count }) =>
    Number(document.querySelector('[data-testid="scene"]')?.dataset.frames) >= first + count,
  { first, count });
}
async function ready(page) {
  await page.waitForFunction(() => {
    const data = document.querySelector('[data-testid="scene"]')?.dataset;
    return data?.ready === "true" && Number(data.draws) > 0 && Number(data.frames) > 0;
  });
}
async function tool(page, name) {
  await page.getByRole("button", { name: "Explore tools", exact: true }).click();
  await page.getByRole("navigation", { name: "Discovery tools", exact: true })
    .getByRole("button", { name, exact: true }).click();
}
async function mode(page, value) {
  await page.waitForFunction(value => {
    const data = document.querySelector('[data-testid="scene"]')?.dataset;
    return data?.mode === value && data.flight === "false";
  }, value);
  await ready(page);
}

async function measureMotion(page, durationMs = 5000) {
  return page.evaluate(duration => new Promise(resolve => {
    const element = document.querySelector('[data-testid="scene"]');
    const initialFrames = Number(element.dataset.frames);
    const qualities = new Set([element.dataset.quality]);
    const initialDays = Number(element.dataset.days);
    const initialLightSeconds = Number(element.dataset.lightSeconds);
    const initialQuality = element.dataset.quality;
    const intervals = [];
    let count = initialFrames, lastDelivered = performance.now();
    let unobservedFrames = 0;
    const start = lastDelivered;
    const tick = now => {
      const next = Number(element.dataset.frames);
      qualities.add(element.dataset.quality);
      if (next > count) {
        const difference = next - count;
        // Multiple delivered frames between observations cannot yield individual
        // frame durations. Count them for FPS, but keep interval statistics honest.
        if (difference === 1) intervals.push(now - lastDelivered);
        else unobservedFrames += difference;
        lastDelivered = now;
        count = next;
      }
      if (now - start < duration) requestAnimationFrame(tick);
      else {
        intervals.sort((a, b) => a - b);
        const elapsedMs = now - start;
        const delivered = count - initialFrames;
        const quantile = fraction => intervals.length
          ? intervals[Math.min(intervals.length - 1, Math.floor(intervals.length * fraction))] : null;
        resolve({
          elapsedMs,
          deliveredFrames: delivered,
          fps: delivered / (elapsedMs / 1000),
          medianMs: quantile(0.5),
          p95Ms: quantile(0.95),
          intervalSamples: intervals.length,
          framesWithoutIndividualInterval: unobservedFrames,
          effectiveQualityAtStart: initialQuality,
          effectiveQualityAtEnd: element.dataset.quality,
          effectiveQualitiesObserved: [...qualities],
          dpr: Number(element.dataset.pixelRatio),
          drawCalls: Number(element.dataset.draws),
          triangles: Number(element.dataset.triangles),
          points: Number(element.dataset.points),
          planetaryDaysAtStart: initialDays,
          planetaryDaysAtEnd: Number(element.dataset.days),
          lightSecondsAtStart: Number.isFinite(initialLightSeconds) ? initialLightSeconds : null,
          lightSecondsAtEnd: Number(element.dataset.lightSeconds) || null,
          visibility: document.visibilityState,
        });
      }
    };
    requestAnimationFrame(tick);
  }), durationMs);
}

async function idleCheck(page) {
  // Wait for late texture uploads and control damping to settle, then measure
  // one full second. This is a demand-rendering check, not a low-FPS benchmark.
  await page.waitForFunction(async () => {
    const scene = document.querySelector('[data-testid="scene"]');
    const before = Number(scene.dataset.frames);
    for (let i = 0; i < 8; i++) await new Promise(resolve => requestAnimationFrame(resolve));
    return Number(scene.dataset.frames) === before;
  }, undefined, { polling: 150 });
  return page.evaluate(() => new Promise(resolve => {
    const element = document.querySelector('[data-testid="scene"]');
    const before = Number(element.dataset.frames), start = performance.now();
    const tick = now => {
      if (now - start < 1000) requestAnimationFrame(tick);
      else resolve({
        kind: "on-demand idle check; zero additional renders is expected",
        elapsedMs: now - start,
        additionalRenderedFrames: Number(element.dataset.frames) - before,
        quality: element.dataset.quality,
        dpr: Number(element.dataset.pixelRatio),
        drawCallsAtLastRender: Number(element.dataset.draws),
        visibility: document.visibilityState,
      });
    };
    requestAnimationFrame(tick);
  }));
}

async function inputToFrame(page, locator, event, action, expectedDataset) {
  await locator.evaluate((element, { event, expected }) => {
    window.__orbitaDiscoveryLatency = new Promise((resolve, reject) => {
      const scene = document.querySelector('[data-testid="scene"]');
      element.addEventListener(event, () => {
        const before = Number(scene.dataset.frames), start = performance.now();
        const timeout = setTimeout(() => reject(new Error("No rendered response within 15 seconds")), 15000);
        const tick = now => {
          const after = Number(scene.dataset.frames);
          const expectedState = !expected || scene.dataset[expected.key] === expected.value;
          if (after > before && expectedState) {
            clearTimeout(timeout);
            resolve({ event, inputToRenderedFrameMs: now - start, additionalFrames: after - before });
          } else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { once: true, capture: true });
    });
  }, { event, expected: expectedDataset });
  await action();
  return page.evaluate(() => window.__orbitaDiscoveryLatency);
}

let browser;
try {
  browser = await chromium.launch({
    headless: !headed,
    args: ["--enable-webgl", "--ignore-gpu-blocklist", ...(headed ? ["--use-angle=metal"] : [])],
  });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const mobileEmulation = viewport.width === 390;
    const context = await browser.newContext({
      viewport, deviceScaleFactor: 1, reducedMotion: "no-preference",
      isMobile: mobileEmulation, hasTouch: mobileEmulation,
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(url);
      await page.bringToFront();
      await ready(page);
      const environment = await page.evaluate(() => {
        const canvas = document.querySelector("canvas"), gl = canvas.getContext("webgl2");
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        return {
          userAgent: navigator.userAgent,
          gpuRenderer: renderer,
          gpuVendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          softwareRenderer: /swiftshader|llvmpipe|software/i.test(renderer),
          viewport: { width: innerWidth, height: innerHeight },
          devicePixelRatio: devicePixelRatio,
        };
      });
      const result = { viewport, deviceDescription: mobileEmulation
        ? "Phone viewport/touch emulation on the host computer; not a physical phone"
        : "Desktop browser on the host computer", ...environment, errors };
      report.viewports.push(result);
      console.log(`${viewport.width}×${viewport.height}: ${environment.gpuRenderer}`);

      await page.getByRole("button", { name: "Select Earth", exact: true }).click();
      await page.getByRole("button", { name: "Explore moons", exact: true }).click();
      await page.getByRole("navigation", { name: "Moons", exact: true })
        .getByRole("button", { name: "Select Moon", exact: true }).click();
      await page.waitForFunction(() => {
        const data = document.querySelector('[data-testid="scene"]')?.dataset;
        return data?.target === "moon" && data.flight === "false";
      });
      await actualFrames(page, 60);
      result.movingMoonCloseUp = await measureMotion(page);
      console.log(`  Moon: ${result.movingMoonCloseUp.fps.toFixed(1)} delivered FPS`);

      await tool(page, "Light journey");
      await mode(page, "light");
      const light = page.getByRole("region", { name: "Light journey", exact: true });
      await light.getByRole("combobox", { name: "Light playback speed", exact: true }).selectOption("600");
      await light.getByRole("button", { name: "Start light pulse", exact: true }).click();
      await actualFrames(page, 60);
      result.lightPulse = { physicalSecondsPerRealSecond: 600, ...await measureMotion(page) };
      await light.getByRole("button", { name: "Pause light pulse", exact: true }).click();
      console.log(`  Light pulse: ${result.lightPulse.fps.toFixed(1)} delivered FPS`);

      await tool(page, "Size comparison");
      await mode(page, "compare");
      result.comparisonIdle = await idleCheck(page);
      const pair = page.getByRole("region", { name: "Size comparison", exact: true })
        .getByRole("combobox", { name: /^Second object\b/ });
      result.comparisonInputResponse = await inputToFrame(page, pair, "change", () => pair.selectOption("saturn"));

      await tool(page, "Solar neighborhood");
      await mode(page, "neighborhood");
      result.neighborhood100Idle = await idleCheck(page);
      const range = page.getByRole("region", { name: "Stellar neighborhood", exact: true })
        .getByRole("button", { name: "3,000 ly", exact: true });
      result.neighborhoodRangeResponse = await inputToFrame(page, range, "click", () => range.click());
      result.neighborhood3000Idle = await idleCheck(page);

      await tool(page, "Moon phases & eclipses");
      await mode(page, "phases");
      await idleCheck(page);
      const quarter = page.getByRole("region", { name: "Moon phases and eclipses", exact: true })
        .getByRole("button", { name: "First quarter", exact: true });
      result.phasePresetResponse = await inputToFrame(page, quarter, "click", () => quarter.click(),
        { key: "phaseAngle", value: "90" });
      result.quarterPhaseIdle = await idleCheck(page);
      result.finalCanvas = await page.locator("canvas").evaluate(canvas => ({ width: canvas.width, height: canvas.height }));
      console.log(`  Static idle renders: compare=${result.comparisonIdle.additionalRenderedFrames}, neighborhood100=${result.neighborhood100Idle.additionalRenderedFrames}, neighborhood3000=${result.neighborhood3000Idle.additionalRenderedFrames}, phases=${result.quarterPhaseIdle.additionalRenderedFrames}`);
    } finally {
      await context.close();
    }
  }
} catch (error) {
  report.failure = error.stack || String(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await fs.mkdir("artifacts", { recursive: true });
  await fs.writeFile("artifacts/discovery-performance.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
