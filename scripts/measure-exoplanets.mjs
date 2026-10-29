// Production WebGL frame delivery. HEADED=1 uses native Metal on macOS.
// Start npm run preview -- --port 4174 first. Phone sizes emulate this computer.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts', { recursive: true });
const native = process.env.HEADED === '1';
const browser = await chromium.launch({ headless: !native, args: [
  '--enable-webgl', '--ignore-gpu-blocklist',
  ...(native ? ['--use-angle=metal'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
] });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference', isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(process.env.ORBITA_URL || 'http://localhost:4174');
    const scene = page.getByTestId('scene');
    await scene.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('[data-testid="scene"]').dataset.ready === 'true');
    const environment = await page.evaluate(() => {
      const gl = document.querySelector('canvas').getContext('webgl2');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const ready = performance.getEntriesByName('orbita-ready')[0].startTime;
      return { userAgent: navigator.userAgent, gpu: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL), firstUsefulMs: ready,
        transferBeforeReady: [...performance.getEntriesByType('resource'), ...performance.getEntriesByType('navigation')].filter(r => r.responseEnd <= ready).reduce((sum, r) => sum + r.transferSize, 0) };
    });
    async function capture(duration, flight = false) {
      return page.evaluate(({ duration, flight }) => new Promise(resolve => {
        const el = document.querySelector('[data-testid="scene"]');
        const start = performance.now(), times = [];
        let last = start, frames = Number(el.dataset.frames);
        function tick(now) {
          const current = Number(el.dataset.frames);
          if (current !== frames) { times.push(now - last); last = now; frames = current; }
          const done = flight ? el.dataset.flight === 'false' && times.length > 2 : now - start >= duration;
          if (!done && now - start < 15000) requestAnimationFrame(tick);
          else { times.sort((a,b) => a-b); resolve({ elapsedMs: now-start, frames: times.length, fps: times.length / ((now-start)/1000), medianMs: times[Math.floor(times.length*.5)] ?? null, p95Ms: times[Math.floor(times.length*.95)] ?? null, maxMs: times.at(-1), quality: el.dataset.quality, dpr: el.dataset.pixelRatio, draws: el.dataset.draws, triangles: el.dataset.triangles }); }
        }
        requestAnimationFrame(tick);
      }), { duration, flight });
    }
    const systems = [];
    for (const [id, target, name] of [['trappist-1','e','TRAPPIST-1 e'], ['kepler-90','g','Kepler-90 g'], ['toi-700','d','TOI-700 d']]) {
      await page.getByRole('combobox', { name: 'Planetary system', exact: true }).selectOption(id);
      await page.waitForFunction(() => document.querySelector('[data-testid="scene"]').dataset.flight === 'false');
      const overview = await capture(3000);
      await page.screenshot({ path: `artifacts/${id}-overview-${viewport.width}.png` });
      await page.getByRole('button', { name: `Select ${name}`, exact: true }).click();
      const flight = await capture(0, true);
      await page.waitForFunction(() => document.querySelector('[data-testid="scene"]').dataset.target !== 'overview');
      const closeup = await capture(3000);
      await page.screenshot({ path: `artifacts/${id}-closeup-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
      // Let the paused frame and UI-triggered invalidations settle before idle sampling.
      await page.evaluate(async () => { for(let i=0;i<4;i++) await new Promise(r => requestAnimationFrame(r)); });
      const idle = await page.evaluate(async () => {
        const el = document.querySelector('[data-testid="scene"]'), before = Number(el.dataset.frames), days = el.dataset.days;
        for(let i=0;i<120;i++) await new Promise(r => requestAnimationFrame(r));
        return { renderedFrames: Number(el.dataset.frames)-before, unchangedDays: days === el.dataset.days };
      });
      systems.push({ id, target, overview, flight, closeup, idle });
    }
    results.push({ viewport, ...environment, systems, errors });
    await context.close();
  }
} finally { await browser.close(); }
await fs.writeFile('artifacts/exoplanet-performance.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
