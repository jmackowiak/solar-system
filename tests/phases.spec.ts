import { expect, test, type Page } from "@playwright/test";

const scene = (page: Page) => page.getByTestId("scene");
const panel = (page: Page) => page.getByRole("region", { name: "Moon phases and eclipses", exact: true });
const metric = async (page: Page, key: string) => Number(await scene(page).getAttribute(`data-${key}`));
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
async function openPhases(page: Page) {
  await page.getByRole("button", { name: "Explore tools", exact: true }).click();
  await page.getByRole("navigation", { name: "Discovery tools", exact: true })
    .getByRole("button", { name: "Moon phases & eclipses", exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(scene(page)).toHaveAttribute("data-mode", "phases");
}
async function renderedPhase(page: Page, angle: number, fraction: number) {
  await expect.poll(() => metric(page, "phase-angle")).toBe(angle);
  await expect.poll(async () => Math.abs(await metric(page, "phase-fraction") - fraction)).toBeLessThan(0.00001);
  await expect(panel(page).getByTestId("phase-illumination")).toHaveText(`${Math.round(fraction * 100)}%`);
  const p = (await scene(page).getAttribute("data-moon-position"))?.split(",").map(Number);
  expect(p, "A real rendered Moon reports its actual position").toHaveLength(3);
  expect(p!.every(Number.isFinite)).toBe(true);
  expect(Math.abs(Math.hypot(...p!) - 5), "The Moon stays on its local orbit").toBeLessThan(0.01);
  return p!;
}
async function idle(page: Page) {
  await expect.poll(async () => {
    const before = await metric(page, "frames");
    await frames(page, 8);
    return await metric(page, "frames") - before;
  }, { message: "The static phase scene settles to on-demand rendering" }).toBe(0);
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
  expect(errors.get(page), "No unexpected application, shader or local-resource errors").toEqual([]);
});

test("renders the changing Moon geometry in the same Canvas and preserves the planetary clock", async ({ page }) => {
  await ready(page);
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(0);
  const canvas = await scene(page).locator("canvas").elementHandle();
  const before = await metric(page, "frames");
  await openPhases(page);
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(scene(page)).toHaveAttribute("data-eclipse-scenario", "phases");
  await expect(scene(page)).toHaveAttribute("data-eclipse-shadow", "false");
  const start = await renderedPhase(page, 0, 0);
  expect(start[0]).toBeLessThan(-4.9);
  const days = await metric(page, "days");
  const oldPosition = await scene(page).getAttribute("data-moon-position");
  await panel(page).getByRole("button", { name: "First quarter", exact: true }).click();
  const quarter = await renderedPhase(page, 90, 0.5);
  expect(quarter[2]).toBeLessThan(-4.9);
  await expect(scene(page)).not.toHaveAttribute("data-moon-position", oldPosition!);
  await idle(page);
  const stoppedFrames = await metric(page, "frames");
  await frames(page);
  expect(await metric(page, "frames")).toBe(stoppedFrames);
  expect(await metric(page, "days")).toBe(days);
  await expect(scene(page).locator("canvas")).toHaveCount(1);
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
  await panel(page).getByRole("button", { name: "Back to exploration", exact: true }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(days);
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
});

test("shows both quarters, full and new phases using a continuous position slider", async ({ page }) => {
  await ready(page, true);
  await openPhases(page);
  const slider = panel(page).getByRole("slider", { name: "Moon position", exact: true });
  const fractions = [[0, 0], [45, (1 - Math.SQRT1_2) / 2], [90, 0.5], [180, 1], [270, 0.5], [360, 0]];
  for (const [angle, fraction] of fractions) {
    await slider.fill(String(angle));
    await renderedPhase(page, angle, fraction);
    await expect(slider).toHaveAttribute("aria-valuetext", new RegExp(`^${angle}°`));
    const image = panel(page).getByRole("img");
    await expect(image).toHaveAttribute("aria-label", new RegExp(`${Math.round(fraction * 100)}%`));
    await expect(scene(page)).toHaveAttribute("data-flight", "false");
  }
  await panel(page).getByRole("button", { name: "Full", exact: true }).click();
  const full = await renderedPhase(page, 180, 1);
  expect(full[0]).toBeGreaterThan(4.9);
  await panel(page).getByRole("button", { name: "Last quarter", exact: true }).click();
  const last = await renderedPhase(page, 270, 0.5);
  expect(last[2]).toBeGreaterThan(4.9);
  await panel(page).getByText("Why not every month?", { exact: true }).click();
  await expect(panel(page)).toContainText("5.14°");
  await expect(panel(page)).toContainText("not a prediction");
  await expect(panel(page).getByRole("link", { name: /NASA/ })).toHaveAttribute("href", "https://science.nasa.gov/moon/eclipses/");
});

test("switches between eclipse alignments and the inclined phase model without an automatic animation", async ({ page }) => {
  await ready(page, true);
  await openPhases(page);
  const scenario = panel(page).getByRole("combobox", { name: "Scenario", exact: true });
  await scenario.selectOption("solar");
  await expect(scene(page)).toHaveAttribute("data-eclipse-scenario", "solar");
  await expect(scene(page)).toHaveAttribute("data-eclipse-shadow", "true");
  const solar = await renderedPhase(page, 0, 0);
  expect(Math.abs(solar[1])).toBeLessThan(0.001);
  expect(Math.abs(solar[2])).toBeLessThan(0.001);
  expect(solar[0]).toBeCloseTo(-5, 3);
  await expect(page.locator(".phases-scene-label.umbra")).toBeVisible();
  await scenario.selectOption("lunar");
  await expect(scene(page)).toHaveAttribute("data-eclipse-scenario", "lunar");
  const lunar = await renderedPhase(page, 180, 1);
  expect(lunar[0]).toBeCloseTo(5, 3);
  expect(Math.abs(lunar[1])).toBeLessThan(0.001);
  await expect(scene(page)).toHaveAttribute("data-eclipse-shadow", "true");
  await panel(page).getByRole("slider", { name: "Moon position", exact: true }).fill("90");
  const away = await renderedPhase(page, 90, 0.5);
  expect(away[2]).toBeCloseTo(-5, 3);
  await scenario.selectOption("phases");
  await expect(scene(page)).toHaveAttribute("data-eclipse-scenario", "phases");
  await expect(scene(page)).toHaveAttribute("data-eclipse-shadow", "false");
  await expect(page.locator(".phases-scene-label.umbra")).toHaveCount(0);
  await idle(page);
  const held = await scene(page).getAttribute("data-moon-position");
  const days = await metric(page, "days");
  await frames(page);
  await expect(scene(page)).toHaveAttribute("data-moon-position", held!);
  expect(await metric(page, "days")).toBe(days);
});

test("supports Polish keyboard navigation and reduced motion without a camera flight", async ({ page }) => {
  await ready(page, true);
  await page.getByRole("combobox", { name: "Language / Język", exact: true }).selectOption("pl");
  const explore = page.getByRole("button", { name: "Narzędzia odkrywania", exact: true });
  await explore.focus(); await page.keyboard.press("Enter");
  await page.getByRole("navigation", { name: "Narzędzia odkrywania", exact: true })
    .getByRole("button", { name: "Fazy Księżyca i zaćmienia", exact: true }).focus();
  await page.keyboard.press("Enter");
  const info = page.getByRole("region", { name: "Fazy Księżyca i zaćmienia", exact: true });
  await expect(info.getByRole("heading", { name: "Fazy Księżyca", exact: true })).toBeFocused();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  const position = info.getByRole("slider", { name: "Pozycja Księżyca", exact: true });
  await position.focus(); await page.keyboard.press("Home"); await page.keyboard.press("ArrowRight");
  await expect(position).toHaveValue("1");
  await expect(scene(page)).toHaveAttribute("data-phase-angle", "1");
  await info.getByRole("button", { name: "Pełnia", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(info.getByTestId("phase-illumination")).toHaveText("100%");
  await expect(scene(page)).toHaveAttribute("data-phase-angle", "180");
  await page.keyboard.press("Escape");
  await expect(info).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(explore).toBeFocused();
  await expect(page.getByRole("button", { name: "Wznów symulację", exact: true })).toBeVisible();
});

test("retains a meaningful phase diagram and interactive controls without a renderer", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return /webgl|experimental-webgl/.test(type) ? null : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await openPhases(page);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(panel(page).getByRole("img")).toBeVisible();
  await expect(panel(page).getByTestId("phase-illumination")).toHaveText("0%");
  await panel(page).getByRole("button", { name: "Full", exact: true }).click();
  await expect(panel(page).getByTestId("phase-illumination")).toHaveText("100%");
  await expect(panel(page).getByRole("img")).toHaveAttribute("aria-label", /^Full Moon: 100%/);
  await panel(page).getByRole("combobox", { name: "Scenario", exact: true }).selectOption("solar");
  await expect(panel(page).getByRole("slider", { name: "Moon position", exact: true })).toHaveValue("0");
  await expect(panel(page).getByTestId("phase-illumination")).toHaveText("0%");
  await panel(page).getByRole("button", { name: "Back to exploration", exact: true }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Solar System objects", exact: true })).toBeVisible();
});

test("keeps phase controls and a visible scene on narrow and landscape screens", async ({ page }) => {
  await ready(page, true);
  await openPhases(page);
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const canvas = scene(page).locator("canvas");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box!.width).toBeGreaterThan(180);
    expect(box!.height).toBeGreaterThan(160);
    const controls = [panel(page).getByRole("combobox", { name: "Scenario", exact: true }),
      panel(page).getByRole("slider", { name: "Moon position", exact: true }),
      panel(page).getByRole("button", { name: "Full", exact: true })];
    for (const control of controls) {
      await expect(control).toBeVisible();
      expect(await control.evaluate(element => {
        const r = element.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit && (hit === element || element.contains(hit));
      }), "Controls are not covered by the scene or another panel").toBe(true);
    }
    await panel(page).getByRole("button", { name: "Full", exact: true }).click();
    await renderedPhase(page, 180, 1);
    await panel(page).getByRole("button", { name: "New", exact: true }).click();
    await renderedPhase(page, 0, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  }
});
