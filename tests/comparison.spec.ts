import { expect, test, type Page } from "@playwright/test";
import { getSystemBodies } from "../src/data/systems";
import { getMoons } from "../src/data/moons";

const scene = (page: Page) => page.getByTestId("scene");
const panel = (page: Page) => page.getByRole("region", { name: "Size comparison", exact: true });
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
async function openComparison(page: Page) {
  await page.getByRole("button", { name: "Explore tools", exact: true }).click();
  await page.getByRole("navigation", { name: "Discovery tools", exact: true })
    .getByRole("button", { name: "Size comparison", exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(scene(page)).toHaveAttribute("data-mode", "compare");
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
  expect(errors.get(page), "No unexpected application, shader or asset errors").toEqual([]);
});

test("compares Earth and Jupiter in the existing renderer and freezes only the orbital clock", async ({ page }) => {
  await ready(page);
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(0);
  const canvas = await scene(page).locator("canvas").elementHandle();
  expect(canvas).not.toBeNull();
  const before = await metric(page, "frames");
  await openComparison(page);
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  await expect(panel(page).getByRole("combobox", { name: /^First object\b/ })).toHaveValue("earth");
  await expect(panel(page).getByRole("combobox", { name: /^Second object\b/ })).toHaveValue("jupiter");
  await expect(panel(page).locator(".comparison-diameter").nth(0)).toHaveText("12,742 km");
  await expect(panel(page).locator(".comparison-diameter").nth(1)).toHaveText("139,822 km");
  await expect(panel(page).locator(".comparison-ratio strong")).toHaveText("11×");
  await expect(panel(page)).toContainText("solid-body diameters, rings omitted");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  const stopped = await metric(page, "days");
  await frames(page);
  await panel(page).getByRole("combobox", { name: /^First object\b/ }).selectOption("mars");
  await expect(scene(page)).toHaveAttribute("data-days", String(stopped));
  await expect(scene(page).locator("canvas")).toHaveCount(1);
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
  await panel(page).getByRole("button", { name: "Close comparison", exact: true }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(stopped);
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
});

test("updates real diameters and framing for planets, moons and exoplanets", async ({ page }) => {
  await ready(page, true);
  await openComparison(page);
  const catalog = [...getSystemBodies("solar", "en").slice(1), ...getMoons("en"), ...getSystemBodies("trappist-1", "en").slice(1)];
  const first = panel(page).getByRole("combobox", { name: /^First object\b/ });
  const second = panel(page).getByRole("combobox", { name: /^Second object\b/ });
  await expect(first.locator("option")).toHaveCount(33);
  for (const [left, right] of [["mars", "neptune"], ["ganymede", "earth"], ["earth", "trappist-1-e"], ["saturn", "saturn"]]) {
    const before = await metric(page, "frames");
    await first.selectOption(left);
    await second.selectOption(right);
    const a = catalog.find(body => body.id === left)!, b = catalog.find(body => body.id === right)!;
    await expect(panel(page).locator(".comparison-diameter").nth(0)).toHaveText(`${a.diameterKm.toLocaleString("en-GB")} km`);
    await expect(panel(page).locator(".comparison-diameter").nth(1)).toHaveText(`${b.diameterKm.toLocaleString("en-GB")} km`);
    const text = await panel(page).locator(".comparison-ratio strong").innerText();
    const ratio = Number(text.replace(/[×,]/g, ""));
    expect(Math.abs(ratio / (b.diameterKm / a.diameterKm) - 1), "Shown ratio agrees with physical diameters within display rounding").toBeLessThan(0.005);
    await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
    await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
    await expect(scene(page)).toHaveAttribute("data-flight", "false");
    const camera = (await scene(page).getAttribute("data-camera"))!.split(",").map(Number);
    expect(camera.every(Number.isFinite)).toBe(true);
    expect(camera[2]).toBeGreaterThan(10);
    await expect(page.locator(".comparison-label").filter({ hasText: a.name }).first()).toBeVisible();
  }
});

test("supports Polish keyboard controls and reduced motion without starting a flight", async ({ page }) => {
  await ready(page, true);
  await page.getByRole("combobox", { name: "Language / Język", exact: true }).selectOption("pl");
  const discover = page.getByRole("button", { name: "Narzędzia odkrywania", exact: true });
  await discover.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("navigation", { name: "Narzędzia odkrywania", exact: true })
    .getByRole("button", { name: "Porównanie rozmiarów", exact: true }).focus();
  await page.keyboard.press("Enter");
  const info = page.getByRole("region", { name: "Porównanie rozmiarów", exact: true });
  await expect(info).toBeVisible();
  await expect(info.getByRole("heading", { name: "Porównanie rozmiarów", exact: true })).toBeFocused();
  await expect(scene(page)).toHaveAttribute("data-mode", "compare");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await info.getByRole("combobox", { name: /^Pierwszy obiekt\b/ }).focus();
  // Native select type-ahead works on both macOS and Linux without relying on
  // browser-external popup arrow handling in headless Chromium.
  await page.keyboard.type("Mars");
  await expect(info.getByRole("combobox", { name: /^Pierwszy obiekt\b/ })).toHaveValue("mars");
  await expect(info).toContainText("Jedna skala");
  await page.keyboard.press("Escape");
  await expect(info).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect(discover).toBeFocused();
  await expect(page.getByRole("button", { name: "Resume simulation", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Wznów symulację", exact: true })).toBeVisible();
});

test("preserves physical diameter ratios in the 2D fallback", async ({ page }) => {
  await page.goto("/?fallback=1");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await openComparison(page);
  const circles = page.locator(".comparison-fallback-sphere");
  await expect(circles).toHaveCount(2);
  const ratio = async () => {
    const a = (await circles.nth(0).boundingBox())!, b = (await circles.nth(1).boundingBox())!;
    expect(a.width).toBeGreaterThan(0);
    expect(b.width).toBeGreaterThan(0);
    expect(a.width).toBeCloseTo(a.height, 1);
    expect(b.width).toBeCloseTo(b.height, 1);
    return b.width / a.width;
  };
  expect(Math.abs((await ratio()) / (139822 / 12742) - 1)).toBeLessThan(0.01);
  await panel(page).getByRole("combobox", { name: /^Second object\b/ }).selectOption("moon");
  await expect(panel(page).locator(".comparison-diameter").nth(1)).toHaveText("3,475 km");
  expect(Math.abs((await ratio()) / (3475 / 12742) - 1)).toBeLessThan(0.01);
  await expect(page.getByRole("img", { name: /Earth and Moon at the same scale/ })).toBeVisible();
  await panel(page).getByRole("button", { name: "Close comparison", exact: true }).click();
  await expect(circles).toHaveCount(0);
  await expect(page.getByTestId("fallback")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Solar System objects", exact: true })).toBeVisible();
});

test("keeps comparison controls and the rendered scene clear on narrow and landscape screens", async ({ page }) => {
  await ready(page, true);
  await openComparison(page);
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
    expect(dock.height).toBeLessThanOrEqual(200);
    expect(canvas.height).toBeGreaterThanOrEqual(viewport.height > 500 ? 260 : 100);
    expect(canvas.y + canvas.height, "Comparison dock does not cover the rendered viewport").toBeLessThanOrEqual(dock.y + 1);
    for (const control of [
      panel(page).getByRole("combobox", { name: /^First object\b/ }),
      panel(page).getByRole("combobox", { name: /^Second object\b/ }),
      panel(page).getByRole("button", { name: "Close comparison", exact: true }),
    ]) {
      await expect(control).toBeInViewport();
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await control.evaluate(el => {
        const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit && (hit === el || el.contains(hit));
      })).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await panel(page).getByRole("combobox", { name: /^First object\b/ }).selectOption("moon");
    await expect(panel(page).locator(".comparison-diameter").nth(0)).toHaveText("3,475 km");
    await panel(page).getByRole("combobox", { name: /^First object\b/ }).selectOption("earth");
  }
});
