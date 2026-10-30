import { expect, test, type Page } from "@playwright/test";

const scene = (page: Page) => page.getByTestId("scene");
const metric = async (page: Page, key: string) =>
  Number(await scene(page).getAttribute(`data-${key}`));
const copy = {
  en: { objects: "Object information", select: "Select Earth", expand: "Expand information", collapse: "Collapse information", pause: "Pause simulation", resume: "Resume simulation", speed: "Simulation speed", reset: "Reset simulation", tour: "Start journey", next: "Next stop", end: "End journey", galaxy: "Milky Way", galaxyInfo: "About the Milky Way" },
  pl: { objects: "Informacje o obiekcie", select: "Wybierz Ziemia", expand: "Rozwiń informacje", collapse: "Zwiń informacje", pause: "Wstrzymaj symulację", resume: "Wznów symulację", speed: "Szybkość symulacji", reset: "Resetuj symulację", tour: "Rozpocznij podróż", next: "Następny przystanek", end: "Zakończ podróż", galaxy: "Droga Mleczna", galaxyInfo: "O Drodze Mlecznej" },
} as const;

async function ready(page: Page, language: keyof typeof copy = "en") {
  await page.addInitScript((lang) => localStorage.setItem("orbita-language", lang), language);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
}
async function canvasMatchesScene(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const host = document.querySelector('[data-testid="scene"]')!.getBoundingClientRect();
    const canvas = document.querySelector("canvas")!.getBoundingClientRect();
    return Math.abs(host.height - canvas.height);
  })).toBeLessThan(1);
}
async function expectClearPlanetCenter(page: Page) {
  await canvasMatchesScene(page);
  await expect.poll(() => page.evaluate(() => {
    const host = document.querySelector<HTMLElement>('[data-testid="scene"]')!;
    const projected = host.dataset.projected?.split(",").map(Number);
    if (!projected || projected.length !== 3 || !projected.every(Number.isFinite)) return false;
    const canvas = host.querySelector("canvas")!.getBoundingClientRect();
    const point = { x: canvas.left + ((projected[0] + 1) / 2) * canvas.width, y: canvas.top + ((1 - projected[1]) / 2) * canvas.height };
    const radius = 35;
    return [".simulation", ".object-nav", ".object-panel", ".mode-switch", ".topbar"].every((selector) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el || getComputedStyle(el).display === "none") return true;
      const r = el.getBoundingClientRect();
      return point.x + radius < r.left || point.x - radius > r.right || point.y + radius < r.top || point.y - radius > r.bottom;
    });
  })).toBe(true);
}

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", (error) => list.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") list.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) list.push(`${response.status()} ${response.url()}`); });
});
test.afterEach(async ({ page }) => expect(errors.get(page), "No unexpected app, WebGL or resource errors").toEqual([]));

for (const { width, height, language } of [
  { width: 390, height: 844, language: "en" },
  { width: 360, height: 640, language: "pl" },
] as const) {
  test(`reserves the mobile scene and keeps a compact usable player at ${width}×${height} in ${language}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await ready(page, language);
    const text = copy[language];
    const player = page.getByRole("region", { name: language === "en" ? "Simulation controls" : "Sterowanie symulacją" });
    await expect(player).toBeVisible();
    expect((await player.boundingBox())!.height).toBeLessThanOrEqual(60);
    const clearOverviewHeight = await page.evaluate(() => {
      const visibleRect = (selector: string) => {
        const el = document.querySelector<HTMLElement>(selector);
        return el && getComputedStyle(el).display !== "none" ? el.getBoundingClientRect() : null;
      };
      const top = Math.max(...[".topbar", ".mode-switch", ".intro"].map((s) => visibleRect(s)?.bottom ?? 0));
      const bottom = Math.min(...[".simulation", ".object-nav"].map((s) => visibleRect(s)?.top ?? innerHeight));
      return bottom - top;
    });
    expect(clearOverviewHeight).toBeGreaterThanOrEqual(height > 700 ? 320 : 240);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const speed = page.getByRole("slider", { name: text.speed, exact: true });
    await expect(speed).toBeVisible();
    await speed.fill("24");
    await expect(speed).toHaveValue("24");
    await page.getByRole("button", { name: text.resume, exact: true }).click();
    await expect.poll(() => metric(page, "days")).toBeGreaterThan(0.1);
    await page.getByRole("button", { name: text.pause, exact: true }).click();
    await page.getByRole("button", { name: text.reset, exact: true }).click();
    await expect(speed).toHaveValue("8");
    await expect.poll(() => metric(page, "days")).toBe(0);
    await expect(scene(page)).toHaveAttribute("data-target", "overview");

    const before = await metric(page, "frames");
    await page.getByRole("button", { name: text.select, exact: true }).click();
    await expect(scene(page)).toHaveAttribute("data-target", "earth");
    await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
    const info = page.getByRole("region", { name: text.objects, exact: true });
    await expect(info).toHaveClass(/collapsed/);
    expect((await info.boundingBox())!.height).toBeLessThanOrEqual(90);
    await expect(info.getByRole("button", { name: text.expand, exact: true })).toHaveAttribute("aria-expanded", "false");
    await canvasMatchesScene(page);
    expect((await scene(page).boundingBox())!.height).toBeGreaterThanOrEqual(height > 700 ? 400 : 260);
    await expectClearPlanetCenter(page);
    expect((await player.boundingBox())!.height).toBeLessThanOrEqual(60);

    await info.getByRole("button", { name: text.expand, exact: true }).click();
    await expect(info).not.toHaveClass(/collapsed/);
    await expect(info.locator(".description")).toBeVisible();
    const source = info.getByRole("link", { name: /NASA/ });
    await source.scrollIntoViewIfNeeded();
    await expect(source).toBeInViewport();
    expect(await info.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await info.getByRole("button", { name: text.collapse, exact: true }).click();
    await expect(info).toHaveClass(/collapsed/);
    await expectClearPlanetCenter(page);
  });
}

test("opens a readable tour deliberately and collapses the galactic sheet before exploration", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.getByRole("button", { name: copy.en.tour, exact: true }).click();
  const info = page.getByRole("region", { name: copy.en.objects, exact: true });
  await expect(info).not.toHaveClass(/collapsed/);
  await expect(info.getByRole("button", { name: copy.en.next, exact: true })).toBeVisible();
  await info.getByRole("button", { name: copy.en.next, exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await info.getByRole("button", { name: copy.en.end, exact: true }).click();
  await expect(page.getByRole("button", { name: copy.en.next, exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: copy.en.galaxy, exact: true }).click();
  const galaxy = page.getByRole("region", { name: copy.en.galaxyInfo, exact: true });
  await expect(galaxy).toHaveClass(/collapsed/);
  expect((await galaxy.boundingBox())!.height).toBeLessThanOrEqual(90);
  await expect(page.getByTestId("galaxy-marker")).toBeVisible();
  await galaxy.getByRole("button", { name: copy.en.expand, exact: true }).click();
  await expect(galaxy.locator(".description")).toBeVisible();
  await galaxy.getByRole("button", { name: "TRAPPIST-1", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "trappist-1");
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page).locator("canvas")).toHaveCount(1);
});

test("retains expanded desktop information and the full-size simulation controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.getByRole("button", { name: copy.en.select, exact: true }).click();
  const info = page.getByRole("region", { name: copy.en.objects, exact: true });
  await expect(info).not.toHaveClass(/collapsed/);
  await expect(info.locator(".description")).toBeVisible();
  await expect(info.getByRole("link", { name: /NASA/ })).toBeVisible();
  await expect(page.getByRole("slider", { name: copy.en.speed, exact: true })).toBeVisible();
});

test("keeps the compact landscape viewport and player usable at both phone widths", async ({ page }) => {
  for (const viewport of [{ width: 640, height: 360 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await ready(page);
    const headerControls = [
      page.getByRole("button", { name: "Solar System", exact: true }),
      page.getByRole("button", { name: "Milky Way", exact: true }),
      page.getByRole("combobox", { name: "Planetary system", exact: true }),
      page.getByRole("combobox", { name: "Language / Język", exact: true }),
      page.getByRole("button", { name: "Reduce motion", exact: true }),
      page.getByRole("button", { name: "About the atlas", exact: true }),
    ];
    const headerBoxes = [];
    for (const control of headerControls) {
      await expect(control).toBeVisible();
      const box = (await control.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(await control.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit !== null && (hit === el || el.contains(hit));
      }), "Header control center remains reachable").toBe(true);
      headerBoxes.push(box);
    }
    for (let i = 0; i < headerBoxes.length; i++) {
      for (let j = i + 1; j < headerBoxes.length; j++) {
        const a = headerBoxes[i], b = headerBoxes[j];
        expect(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1, "Header controls do not overlap").toBe(true);
      }
    }
    expect(headerBoxes[2].x + headerBoxes[2].width).toBeLessThanOrEqual(headerBoxes[3].x + 1);
    const player = page.getByRole("region", { name: "Simulation controls", exact: true });
    await expect(player).toBeVisible();
    const playerBox = (await player.boundingBox())!;
    expect(playerBox.height).toBeLessThanOrEqual(60);
    expect(playerBox.y + playerBox.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Select Earth", exact: true }).click();
    const info = page.getByRole("region", { name: "Object information", exact: true });
    await expect(info).toHaveClass(/collapsed/);
    expect((await info.boundingBox())!.height).toBeLessThanOrEqual(50);
    await canvasMatchesScene(page);
    expect((await scene(page).boundingBox())!.height).toBeGreaterThanOrEqual(180);
    await expectClearPlanetCenter(page);
    await expect(page.getByRole("slider", { name: "Simulation speed", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Resume simulation", exact: true }).click();
    await expect.poll(() => metric(page, "days")).toBeGreaterThan(0.1);
    await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
    await info.getByRole("button", { name: "Expand information", exact: true }).click();
    await expect(info).not.toHaveClass(/collapsed/);
    const box = (await info.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    const source = info.getByRole("link", { name: /NASA/ });
    await source.scrollIntoViewIfNeeded();
    await expect(source).toBeInViewport();
    const before = await metric(page, "frames");
    await page.getByRole("combobox", { name: "Planetary system", exact: true }).selectOption("trappist-1");
    await expect(scene(page)).toHaveAttribute("data-system", "trappist-1");
    await expect(scene(page)).toHaveAttribute("data-ready", "true");
    await expect(page.getByRole("navigation", { name: "Planetary system objects", exact: true }).getByRole("button")).toHaveCount(8);
    await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
    await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  }
});
