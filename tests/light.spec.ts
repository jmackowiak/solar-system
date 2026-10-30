import { expect, test, type Page } from "@playwright/test";

const scene = (page: Page) => page.getByTestId("scene");
const panel = (page: Page) => page.getByRole("region", { name: "Light journey", exact: true });
const metric = async (page: Page, key: string) => Number(await scene(page).getAttribute(`data-${key}`));
const destinations = [
  { id: "mercury", distance: 57.9, duration: "00:03:13" },
  { id: "venus", distance: 108.2, duration: "00:06:00" },
  { id: "earth", distance: 149.6, duration: "00:08:19" },
  { id: "mars", distance: 228, duration: "00:12:40" },
  { id: "jupiter", distance: 778.5, duration: "00:43:16" },
  { id: "saturn", distance: 1432, duration: "01:19:36" },
  { id: "uranus", distance: 2867, duration: "02:39:23" },
  { id: "neptune", distance: 4515, duration: "04:11:00" },
] as const;
const vacuumSpeedKmS = 299_792.458;
const maxSeconds = 4_515_000_000 / vacuumSpeedKmS;

async function frames(page: Page, count = 20) {
  await page.evaluate(async n => {
    for (let i = 0; i < n; i++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }, count);
}
async function ready(page: Page, reduced = false) {
  if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
}
async function openLight(page: Page) {
  await page.getByRole("button", { name: "Explore tools", exact: true }).click();
  await page.getByRole("navigation", { name: "Discovery tools", exact: true })
    .getByRole("button", { name: "Light journey", exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(scene(page)).toHaveAttribute("data-mode", "light");
}
async function pulseAt(page: Page, seconds: number) {
  await expect.poll(async () => Math.abs(await metric(page, "light-seconds") - seconds)).toBeLessThan(0.000001);
  const expectedX = -24 + seconds * vacuumSpeedKmS / 100_000_000;
  await expect.poll(async () => Math.abs(await metric(page, "pulse-x") - expectedX), {
    message: "The actual rendered pulse has moved to the physical light-travel distance",
  }).toBeLessThan(0.00001);
}

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", error => list.push(error.message));
  page.on("console", message => { if (message.type() === "error") list.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) list.push(`${response.status()} ${response.url()}`); });
  page.on("requestfailed", request => {
    if (!request.failure()?.errorText.includes("ERR_ABORTED")) list.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page), "No unexpected application, shader or resource errors").toEqual([]);
});

test("renders a moving light pulse in the same WebGL scene while preserving the orbital clock", async ({ page }) => {
  await ready(page);
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(0);
  const canvas = await scene(page).locator("canvas").elementHandle();
  expect(canvas).not.toBeNull();
  const before = await metric(page, "frames");
  await openLight(page);
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  await expect(page.locator(".light-label")).toHaveCount(9);
  await expect(panel(page).getByRole("button", { name: "Start light pulse", exact: true })).toBeVisible();
  await pulseAt(page, 0);
  const orbitalDays = await metric(page, "days");
  await frames(page);
  expect(await metric(page, "days")).toBe(orbitalDays);
  await panel(page).getByRole("button", { name: "Start light pulse", exact: true }).click();
  await expect(panel(page).getByRole("button", { name: "Pause light pulse", exact: true })).toBeVisible();
  await expect.poll(() => metric(page, "light-seconds")).toBeGreaterThan(1);
  await expect.poll(() => metric(page, "pulse-x")).toBeGreaterThan(-24);
  await panel(page).getByRole("button", { name: "Pause light pulse", exact: true }).click();
  await frames(page, 3);
  const lightSeconds = await metric(page, "light-seconds");
  await pulseAt(page, lightSeconds);
  await frames(page);
  expect(await metric(page, "light-seconds")).toBe(lightSeconds);
  expect(await metric(page, "days")).toBe(orbitalDays);
  await expect(scene(page).locator("canvas")).toHaveCount(1);
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
  await panel(page).getByRole("button", { name: "Close light journey", exact: true }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(orbitalDays);
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
});

test("shows all eight physical arrival times and places the pulse at each destination", async ({ page }) => {
  await ready(page, true);
  await openLight(page);
  const destination = panel(page).getByRole("combobox", { name: "Light destination", exact: true });
  await expect(destination.locator("option")).toHaveCount(8);
  await expect(destination).toHaveValue("earth");
  for (const planet of destinations) {
    await destination.selectOption(planet.id);
    const jump = panel(page).getByRole("button", { name: "Jump to arrival", exact: true });
    await expect(jump).toContainText(planet.duration);
    const before = await metric(page, "frames");
    await jump.click();
    await pulseAt(page, planet.distance * 1_000_000 / vacuumSpeedKmS);
    await expect(panel(page).getByRole("status", { name: "Elapsed light time", exact: true })).toHaveText(planet.duration);
    await expect(panel(page).getByRole("button", { name: "Start light pulse", exact: true })).toBeVisible();
    await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
    await expect(scene(page)).toHaveAttribute("data-flight", "false");
  }
  await panel(page).getByText("Mean distances · sizes enlarged", { exact: true }).click();
  await expect(panel(page)).toContainText("Distances share one scale");
  await expect(panel(page)).toContainText("not an astronomical prediction");
  await expect(panel(page).getByRole("link", { name: /NASA \/ JPL/ })).toHaveAttribute("href", "https://ssd.jpl.nasa.gov/astro_par.html");
});

test("scrubs, changes playback speed, resets and stops exactly at Neptune without resetting the Solar System", async ({ page }) => {
  await ready(page, true);
  await openLight(page);
  const scrubber = panel(page).getByRole("slider", { name: "Light travel time", exact: true });
  const speed = panel(page).getByRole("combobox", { name: "Light playback speed", exact: true });
  await expect(speed).toHaveValue("60");
  await speed.selectOption("600");
  await expect(speed).toHaveValue("600");
  await scrubber.fill("1000");
  await pulseAt(page, 1000);
  await expect(scrubber).toHaveAttribute("aria-valuetext", "00:16:40");
  await panel(page).getByRole("button", { name: "Start light pulse", exact: true }).click();
  await expect.poll(() => metric(page, "light-seconds")).toBeGreaterThan(1100);
  await panel(page).getByRole("button", { name: "Reset light pulse", exact: true }).click();
  await pulseAt(page, 0);
  await expect(speed).toHaveValue("600");
  await expect(panel(page).getByRole("button", { name: "Start light pulse", exact: true })).toBeVisible();
  await scrubber.fill("15060");
  await pulseAt(page, 15060);
  await panel(page).getByRole("button", { name: "Start light pulse", exact: true }).click();
  await pulseAt(page, maxSeconds);
  await expect(panel(page).getByRole("button", { name: "Start light pulse", exact: true })).toBeVisible();
  await frames(page);
  await pulseAt(page, maxSeconds);
  expect(await metric(page, "days")).toBe(0);
});

test("supports Polish keyboard controls and explicit playback with reduced motion", async ({ page }) => {
  await ready(page, true);
  await page.getByRole("combobox", { name: "Language / Język", exact: true }).selectOption("pl");
  const explore = page.getByRole("button", { name: "Narzędzia odkrywania", exact: true });
  await explore.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("navigation", { name: "Narzędzia odkrywania", exact: true })
    .getByRole("button", { name: "Podróż światła", exact: true }).focus();
  await page.keyboard.press("Enter");
  const info = page.getByRole("region", { name: "Podróż światła", exact: true });
  await expect(info.getByRole("heading", { name: "Podróż światła", exact: true })).toBeFocused();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await frames(page);
  await pulseAt(page, 0);
  const start = info.getByRole("button", { name: "Uruchom impuls światła", exact: true });
  await start.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => metric(page, "light-seconds")).toBeGreaterThan(1);
  await info.getByRole("button", { name: "Wstrzymaj impuls światła", exact: true }).focus();
  await page.keyboard.press("Enter");
  await frames(page, 3);
  const stopped = await metric(page, "light-seconds");
  await frames(page);
  expect(await metric(page, "light-seconds")).toBe(stopped);
  await page.keyboard.press("Escape");
  await expect(info).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(explore).toBeFocused();
  await expect(page.getByRole("button", { name: "Wznów symulację", exact: true })).toBeVisible();
});

test("retains the destination times and playback controls when the renderer is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return /webgl|experimental-webgl/.test(type) ? null : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await openLight(page);
  await expect(page.locator("canvas")).toHaveCount(0);
  const destination = panel(page).getByRole("combobox", { name: "Light destination", exact: true });
  await expect(destination.locator("option")).toHaveCount(8);
  await destination.selectOption("earth");
  await panel(page).getByRole("button", { name: "Jump to arrival", exact: true }).click();
  const counter = panel(page).getByRole("status", { name: "Elapsed light time", exact: true });
  await expect(counter).toHaveText("00:08:19");
  await panel(page).getByRole("button", { name: "Reset light pulse", exact: true }).click();
  await expect(counter).toHaveText("00:00:00");
  await panel(page).getByRole("button", { name: "Start light pulse", exact: true }).click();
  await expect(counter).not.toHaveText("00:00:00");
  await panel(page).getByRole("button", { name: "Pause light pulse", exact: true }).click();
  const stopped = await counter.innerText();
  await frames(page);
  await expect(counter).toHaveText(stopped);
  await panel(page).getByRole("button", { name: "Close light journey", exact: true }).click();
  await expect(page.getByTestId("fallback")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Solar System objects", exact: true })).toBeVisible();
});

test("keeps the scene and light controls usable in narrow and landscape layouts", async ({ page }) => {
  await ready(page, true);
  await openLight(page);
  for (const viewport of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 640, height: 360 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => {
      const host = document.querySelector('[data-testid="scene"]')!.getBoundingClientRect();
      const canvas = document.querySelector("canvas")!.getBoundingClientRect();
      return Math.abs(host.height - canvas.height);
    })).toBeLessThan(1);
    const dock = (await panel(page).boundingBox())!, canvas = (await scene(page).locator("canvas").boundingBox())!;
    expect(dock.x).toBeGreaterThanOrEqual(0);
    expect(dock.x + dock.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(dock.y + dock.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(dock.height).toBeLessThanOrEqual(220);
    expect(canvas.height).toBeGreaterThanOrEqual(viewport.height > 500 ? 260 : 100);
    expect(canvas.y + canvas.height, "The light panel leaves the rendered viewport clear").toBeLessThanOrEqual(dock.y + 1);
    await expect.poll(() => page.locator(".light-label").evaluateAll(labels => {
      const boxes = labels.map(label => label.getBoundingClientRect());
      return boxes.length === 9 && boxes.every((a, i) => boxes.slice(i + 1).every(b =>
        a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
      ));
    }), { message: "The inner-planet labels remain readable without overlapping on a small screen" }).toBe(true);
    for (const control of [
      panel(page).getByRole("combobox", { name: "Light destination", exact: true }),
      panel(page).getByRole("combobox", { name: "Light playback speed", exact: true }),
      panel(page).getByRole("button", { name: "Start light pulse", exact: true }),
      panel(page).getByRole("button", { name: "Close light journey", exact: true }),
    ]) {
      await expect(control).toBeInViewport();
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await control.evaluate(element => {
        const r = element.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit && (hit === element || element.contains(hit));
      })).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await panel(page).getByRole("combobox", { name: "Light destination", exact: true }).selectOption("jupiter");
    await panel(page).getByRole("button", { name: "Jump to arrival", exact: true }).click();
    await pulseAt(page, 778_500_000 / vacuumSpeedKmS);
    await panel(page).getByRole("button", { name: "Reset light pulse", exact: true }).click();
  }
});
