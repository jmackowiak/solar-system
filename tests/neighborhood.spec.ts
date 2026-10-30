import { expect, test, type Page } from "@playwright/test";
import { planetarySystems } from "../src/data/systems";
import { equatorialToGalactic } from "../src/lib/discovery";

const scene = (page: Page) => page.getByTestId("scene");
const panel = (page: Page) => page.getByRole("region", { name: "Stellar neighborhood", exact: true });
const catalog = (page: Page) => page.getByRole("navigation", { name: "Nearby system catalogue", exact: true });
const metric = async (page: Page, key: string) => Number(await scene(page).getAttribute(`data-${key}`));
type PositionMap = Record<string, [number, number, number]>;
async function frames(page: Page, count = 20) {
  await page.evaluate(async n => {
    for (let i = 0; i < n; i++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }, count);
}
async function ready(page: Page, reduced = true) {
  if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
}
async function openNeighborhood(page: Page) {
  await page.getByRole("button", { name: "Explore tools", exact: true }).click();
  await page.getByRole("navigation", { name: "Discovery tools", exact: true })
    .getByRole("button", { name: "Solar neighborhood", exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(scene(page)).toHaveAttribute("data-mode", "neighborhood");
}
async function positions(page: Page, key: "neighborhood-positions" | "galaxy-systems"): Promise<PositionMap> {
  const raw = await scene(page).getAttribute(`data-${key}`);
  return raw ? JSON.parse(raw) as PositionMap : {};
}
async function expectPositions(page: Page, ids: string[], galactic = false) {
  const key = galactic ? "galaxy-systems" : "neighborhood-positions";
  await expect.poll(async () => Object.keys(await positions(page, key)).sort()).toEqual([...ids].sort());
  const actual = await positions(page, key);
  // The conversion itself has independent unit tests. Here we verify that actual
  // Three.js world positions use that conversion, the documented scale and origin.
  const length = Math.hypot(22, 14), u = 22 / length, v = 14 / length;
  const unitLy = galactic ? 1000 : 100;
  const origin = galactic ? [22, 0, 14] : [0, 0, 0];
  for (const id of ids) {
    const system = planetarySystems.find(item => item.id === id)!;
    const g = equatorialToGalactic(system.ra, system.dec, system.distanceLightYears);
    const expected = [
      origin[0] + (-u * g.x - v * g.y) / unitLy,
      origin[1] + g.z / unitLy,
      origin[2] + (-v * g.x + u * g.y) / unitLy,
    ];
    expect(actual[id]).toHaveLength(3);
    expect(actual[id].every(Number.isFinite)).toBe(true);
    actual[id].forEach((value, axis) => expect(value, `${id} world axis ${axis}`).toBeCloseTo(expected[axis], 5));
    const heliocentric = actual[id].map((value, axis) => value - origin[axis]);
    expect(Math.hypot(...heliocentric) * unitLy, `${id} has its measured distance from the Sun`).toBeCloseTo(system.distanceLightYears, 2);
  }
}
async function expectClearLabels(page: Page) {
  await expect.poll(() => page.locator(".neighborhood-marker").evaluateAll(markers => {
    const rectangles = markers.map(marker => marker.getBoundingClientRect());
    return rectangles.every((a, index) => rectangles.slice(index + 1).every(b => {
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return width <= 3 || height <= 3;
    }));
  }), { message: "Stellar labels remain distinct without moving the measured star positions" }).toBe(true);
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

test("renders measured stellar positions at 100 and 3000 ly in the existing WebGL renderer", async ({ page }) => {
  await ready(page);
  const canvas = await scene(page).locator("canvas").elementHandle();
  expect(canvas).not.toBeNull();
  const before = await metric(page, "frames");
  await openNeighborhood(page);
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  await expect(panel(page)).toHaveAttribute("data-range", "100");
  await expect(panel(page)).toContainText("2/4 in range");
  await expect(page.locator(".neighborhood-marker")).toHaveCount(2);
  await expectPositions(page, ["solar", "trappist-1"]);
  await expect(page.getByRole("button", { name: "Enter TOI-700", exact: true })).toHaveCount(0);
  await expect(catalog(page).getByRole("button")).toHaveCount(4);
  await expect(catalog(page).getByRole("button", { name: "Visit TOI-700", exact: true })).toContainText("beyond range");
  await panel(page).getByRole("button", { name: "3,000 ly", exact: true }).click();
  await expect(panel(page)).toHaveAttribute("data-range", "3000");
  await expect(panel(page)).toContainText("4/4 in range");
  await expect(page.locator(".neighborhood-marker")).toHaveCount(4);
  await expectPositions(page, ["solar", "trappist-1", "toi-700", "kepler-90"]);
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(scene(page).locator("canvas")).toHaveCount(1);
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
  const camera = await scene(page).getAttribute("data-camera");
  const box = (await scene(page).locator("canvas").boundingBox())!;
  const x = box.x + box.width * 0.7, y = box.y + box.height * 0.65;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 45, y + 20, { steps: 5 });
  await page.mouse.up();
  await expect(scene(page)).not.toHaveAttribute("data-camera", camera!);
  await expectPositions(page, ["solar", "trappist-1", "toi-700", "kepler-90"]);
  await panel(page).getByRole("button", { name: "100 ly", exact: true }).click();
  await expectPositions(page, ["solar", "trappist-1"]);
  await page.getByRole("button", { name: "Enter TRAPPIST-1", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "trappist-1");
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("navigation", { name: "Planetary system objects", exact: true }).getByRole("button")).toHaveCount(8);
  await expect(page.getByRole("button", { name: "Select TRAPPIST-1 e", exact: true })).toBeVisible();
});

test("places all catalogued systems in the Milky Way and opens their local map", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Milky Way", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "points")).toBeGreaterThan(10_000);
  await expectPositions(page, ["solar", "trappist-1", "toi-700", "kepler-90"], true);
  const expand = page.getByRole("button", { name: "Expand information", exact: true });
  if (await expand.count()) await expand.click();
  await page.getByRole("button", { name: "Explore solar neighborhood", exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(scene(page)).toHaveAttribute("data-mode", "neighborhood");
  await expectPositions(page, ["solar", "trappist-1"]);
  await expect(catalog(page).getByRole("link", { name: /^NASA source for / })).toHaveCount(4);
  await panel(page).getByText("About this map", { exact: true }).click();
  await expect(panel(page)).toContainText("not a complete stellar catalogue");
  await expect(panel(page)).toContainText("Markers are enlarged");
  await expect(panel(page).getByRole("link", { name: /ESA Gaia/ })).toHaveAttribute("href", /^https:\/\/gea\.esac\.esa\.int\//);
});

test("visits TOI-700, Kepler-90 and the Solar System without losing their separate simulation clocks", async ({ page }) => {
  await ready(page, false);
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
  await frames(page, 3);
  const solarDays = await metric(page, "days");
  await openNeighborhood(page);
  await frames(page);
  expect(await metric(page, "days")).toBe(solarDays);
  await catalog(page).getByRole("button", { name: "Visit TOI-700", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-system", "toi-700");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("navigation", { name: "Planetary system objects", exact: true }).getByRole("button")).toHaveCount(5);
  const speed = page.getByRole("slider", { name: "Simulation speed", exact: true });
  await speed.fill("0.5");
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(0.05);
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
  await frames(page, 3);
  const toiDays = await metric(page, "days");
  await page.getByRole("button", { name: "Select TOI-700 d", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "toi-700-d");
  await expect(page.getByRole("region", { name: "Object information", exact: true }).getByRole("heading", { name: "TOI-700 d", exact: true })).toBeVisible();
  await openNeighborhood(page);
  await catalog(page).getByRole("button", { name: "Visit Kepler-90", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "kepler-90");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("navigation", { name: "Planetary system objects", exact: true }).getByRole("button")).toHaveCount(9);
  await page.getByRole("button", { name: "Select Kepler-90 i", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "kepler-90-i");
  await expect(page.getByRole("region", { name: "Object information", exact: true }).getByRole("heading", { name: "Kepler-90 i", exact: true })).toBeVisible();
  await openNeighborhood(page);
  await catalog(page).getByRole("button", { name: "Visit Solar System", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "solar");
  await expect.poll(() => metric(page, "days")).toBe(solarDays);
  await expect(speed).toHaveValue("8");
  await expect(page.getByRole("button", { name: "Resume simulation", exact: true })).toBeVisible();
  await openNeighborhood(page);
  await catalog(page).getByRole("button", { name: "Visit TOI-700", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "toi-700");
  await expect.poll(() => metric(page, "days")).toBe(toiDays);
  await expect(speed).toHaveValue("0.5");
  await expect(page.getByRole("button", { name: "Resume simulation", exact: true })).toBeVisible();
});

test("supports Polish keyboard navigation and returns focus after closing the stellar map", async ({ page }) => {
  await ready(page);
  await page.getByRole("combobox", { name: "Language / Język", exact: true }).selectOption("pl");
  const explore = page.getByRole("button", { name: "Narzędzia odkrywania", exact: true });
  await explore.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("navigation", { name: "Narzędzia odkrywania", exact: true })
    .getByRole("button", { name: "Sąsiedztwo Słońca", exact: true }).focus();
  await page.keyboard.press("Enter");
  const info = page.getByRole("region", { name: "Sąsiedztwo Słońca", exact: true });
  await expect(info.getByRole("heading", { name: "Sąsiedztwo Słońca", exact: true })).toBeFocused();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  const range = info.getByRole("button", { name: /^3.*000 lat św\.$/ });
  await range.focus();
  await page.keyboard.press("Enter");
  await expect(info).toHaveAttribute("data-range", "3000");
  await expectPositions(page, ["solar", "trappist-1", "toi-700", "kepler-90"]);
  await page.keyboard.press("Escape");
  await expect(info).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(explore).toBeFocused();
  await expect(page.getByRole("button", { name: "Wznów symulację", exact: true })).toBeVisible();
});

test("keeps the catalogue, ranges, sources and system visits usable when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return /webgl|experimental-webgl/.test(type) ? null : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await openNeighborhood(page);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(catalog(page).getByRole("button")).toHaveCount(4);
  await panel(page).getByRole("button", { name: "3,000 ly", exact: true }).click();
  await expect(panel(page)).toContainText("4/4 in range");
  await expect(catalog(page).getByRole("link", { name: "NASA source for Kepler-90", exact: true })).toHaveAttribute("href", /^https:\/\/science\.nasa\.gov\//);
  await catalog(page).getByRole("button", { name: "Visit Kepler-90", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "kepler-90");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await page.getByRole("button", { name: "Select Kepler-90 i", exact: true }).click();
  await expect(page.getByRole("region", { name: "Object information", exact: true }).getByRole("heading", { name: "Kepler-90 i", exact: true })).toBeVisible();
  await openNeighborhood(page);
  await catalog(page).getByRole("button", { name: "Visit Solar System", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "solar");
  await expect(page.getByRole("navigation", { name: "Solar System objects", exact: true }).getByRole("button")).toHaveCount(9);
});

test("leaves a clear interactive map and compact controls on portrait and landscape phones", async ({ page }) => {
  await ready(page);
  await openNeighborhood(page);
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
    if (viewport.height > 500) {
      expect(dock.height).toBeLessThanOrEqual(220);
      expect(canvas.height).toBeGreaterThanOrEqual(260);
      expect(canvas.y + canvas.height, "The bottom sheet does not cover the rendered map").toBeLessThanOrEqual(dock.y + 1);
    } else {
      expect(canvas.width).toBeGreaterThanOrEqual(300);
      expect(canvas.height).toBeGreaterThanOrEqual(240);
      expect(canvas.x + canvas.width, "The side sheet does not cover the rendered map").toBeLessThanOrEqual(dock.x + 1);
    }
    for (const control of [
      panel(page).getByRole("button", { name: "100 ly", exact: true }),
      panel(page).getByRole("button", { name: "3,000 ly", exact: true }),
      panel(page).getByRole("button", { name: "Back to exploration", exact: true }),
    ]) {
      await expect(control).toBeInViewport();
      const minimumHeight = await control.getAttribute("aria-label") === "Back to exploration" ? 44 : 36;
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(minimumHeight);
      expect(await control.evaluate(element => {
        const r = element.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit && (hit === element || element.contains(hit));
      })).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await panel(page).getByRole("button", { name: "3,000 ly", exact: true }).click();
    await expectPositions(page, ["solar", "trappist-1", "toi-700", "kepler-90"]);
    await expectClearLabels(page);
    await panel(page).getByRole("button", { name: "100 ly", exact: true }).click();
    await expectPositions(page, ["solar", "trappist-1"]);
    await expectClearLabels(page);
  }
});
