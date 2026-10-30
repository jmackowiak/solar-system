import { expect, test, type Page } from "@playwright/test";

const families = [
  { id: "earth", name: "Earth", moons: [{ id: "moon", name: "Moon" }] },
  { id: "jupiter", name: "Jupiter", moons: [
    { id: "io", name: "Io" }, { id: "europa", name: "Europa" },
    { id: "ganymede", name: "Ganymede" }, { id: "callisto", name: "Callisto" },
  ] },
  { id: "saturn", name: "Saturn", moons: [{ id: "titan", name: "Titan" }] },
] as const;
const scene = (page: Page) => page.getByTestId("scene");
const moonNav = (page: Page) => page.getByRole("navigation", { name: "Moons", exact: true });
const panel = (page: Page) => page.getByRole("region", { name: "Object information", exact: true });
const choose = (page: Page, name: string) => page.getByRole("button", { name: `Select ${name}`, exact: true });
const metric = async (page: Page, key: string) => Number(await scene(page).getAttribute(`data-${key}`));
async function frames(page: Page, count = 20) {
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }, count);
}
async function ready(page: Page) {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(1);
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  await expect(scene(page)).toHaveAttribute("data-system", "solar");
}
async function enterParent(page: Page, name: string) {
  await choose(page, name).click();
  await page.locator(".scene-tools").getByRole("button", { name: "Explore moons", exact: true }).click();
  await expect(moonNav(page)).toBeVisible();
}
async function expandInformation(page: Page) {
  const expand = page.getByRole("button", { name: /^(Expand information|Rozwiń informacje)$/ });
  if (await expand.count()) await expand.click();
}
async function centered(page: Page, tolerance = 0.05) {
  await expect.poll(async () => {
    const p = (await scene(page).getAttribute("data-projected"))?.split(",").map(Number);
    if (!p || p.length !== 3 || !p.every(Number.isFinite) || p[2] <= -1 || p[2] >= 1) return Infinity;
    return Math.max(Math.abs(p[0]), Math.abs(p[1]));
  }, { message: "The selected moon is centered in the actual camera view" }).toBeLessThan(tolerance);
}

const errorsByPage = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  errorsByPage.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", (request) => {
    if (!request.failure()?.errorText.includes("ERR_ABORTED"))
      errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
});
test.afterEach(async ({ page }) => {
  expect(errorsByPage.get(page), "No unexpected application, shader or asset errors").toEqual([]);
});

test("flies to the Moon and follows its moving world position with the existing renderer", async ({ page }) => {
  await ready(page);
  await expect(page.getByRole("navigation", { name: "Solar System objects", exact: true }).getByRole("button")).toHaveCount(9);
  const canvas = await scene(page).locator("canvas").elementHandle();
  expect(canvas).not.toBeNull();
  await enterParent(page, "Earth");
  await expect(moonNav(page)).toBeVisible();
  const before = await metric(page, "frames");
  await moonNav(page).getByRole("button", { name: "Select Moon", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "moon");
  await expect(scene(page)).toHaveAttribute("data-flight", "true");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(panel(page).getByRole("heading", { name: "Moon", exact: true })).toBeVisible();
  await expandInformation(page);
  await expect(panel(page)).toContainText("DISTANCE FROM PLANET");
  await expect(panel(page)).toContainText("Earth");
  await expect(panel(page).getByRole("link", { name: /NASA/ })).toHaveAttribute("href", /^https:\/\/(science|solarsystem|www|nssdc\.gsfc)\.nasa\.gov/);
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
  await centered(page, 0.1);
  const camera = await scene(page).getAttribute("data-camera");
  const days = await metric(page, "days");
  await frames(page);
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(days);
  await expect(scene(page)).not.toHaveAttribute("data-camera", camera!);
  await centered(page, 0.1);
  await expect(scene(page).locator("canvas")).toHaveCount(1);
  expect(await canvas!.evaluate((node) => node === document.querySelector("canvas"))).toBe(true);
  await moonNav(page).getByRole("button", { name: "Back to planet", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(moonNav(page)).toHaveCount(0);
  await page.locator(".scene-tools").getByRole("button", { name: "Whole system", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect(moonNav(page)).toHaveCount(0);
});

test("renders all six moons with parent-relative data and instant reduced-motion close-ups", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  for (const family of families) {
    await enterParent(page, family.name);
    await expect(moonNav(page).getByRole("button")).toHaveCount(family.moons.length + 2);
    for (const moon of family.moons) {
      const before = await metric(page, "frames");
      await moonNav(page).getByRole("button", { name: `Select ${moon.name}`, exact: true }).click();
      await expect(scene(page)).toHaveAttribute("data-target", moon.id);
      await expect(scene(page)).toHaveAttribute("data-flight", "false");
      await expect(panel(page).getByRole("heading", { name: moon.name, exact: true })).toBeVisible();
      await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
      await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
      await centered(page);
      await expandInformation(page);
      await expect(panel(page)).toContainText("DISTANCE FROM PLANET");
      await expect(panel(page)).toContainText(family.name);
      await expect(panel(page).getByRole("link", { name: /NASA/ })).toHaveAttribute("href", /^https:\/\/(science|solarsystem|www|nssdc\.gsfc)\.nasa\.gov/);
    }
    await moonNav(page).getByRole("button", { name: "Back to planet", exact: true }).click();
    await expect(scene(page)).toHaveAttribute("data-target", family.id);
    await expect(moonNav(page)).toHaveCount(0);
  }
});

test("replaces moon and parent flights and keeps the camera usable while simulation time is paused", async ({ page }) => {
  await ready(page);
  await enterParent(page, "Earth");
  await choose(page, "Moon").click();
  await expect(scene(page)).toHaveAttribute("data-flight", "true");
  await enterParent(page, "Jupiter");
  await choose(page, "Io").click();
  await expect(scene(page)).toHaveAttribute("data-target", "io");
  await choose(page, "Europa").click();
  await expect(scene(page)).toHaveAttribute("data-target", "europa");
  await enterParent(page, "Saturn");
  await choose(page, "Titan").click();
  await expect(scene(page)).toHaveAttribute("data-target", "titan");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(panel(page).getByRole("heading", { name: "Titan", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
  await frames(page, 4);
  const stopped = await metric(page, "days");
  const camera = await scene(page).getAttribute("data-camera");
  const before = await metric(page, "frames");
  const box = await scene(page).locator("canvas").boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width * 0.45;
  const y = box!.y + box!.height * 0.4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 65, y + 30, { steps: 5 });
  await page.mouse.up();
  await expect(scene(page)).not.toHaveAttribute("data-camera", camera!);
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
  await frames(page);
  expect(await metric(page, "days")).toBe(stopped);
  await expect(scene(page)).toHaveAttribute("data-target", "titan");
  await expect(page.getByRole("button", { name: "Resume simulation", exact: true })).toBeVisible();
});

test("supports Polish moon information and keyboard navigation on compact layouts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await page.getByRole("combobox", { name: "Language / Język", exact: true }).selectOption("pl");
  await page.getByRole("button", { name: "Wybierz Jowisz", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.locator(".scene-tools").getByRole("button", { name: "Odkrywaj księżyce", exact: true }).focus();
  await page.keyboard.press("Enter");
  const moons = page.getByRole("navigation", { name: "Księżyce", exact: true });
  await moons.getByRole("button", { name: "Wybierz Ganimedes", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-target", "ganymede");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  const info = page.getByRole("region", { name: "Informacje o obiekcie", exact: true });
  await expect(info.getByRole("heading", { name: "Ganimedes", exact: true })).toBeVisible();
  await expandInformation(page);
  await expect(info).toContainText("ODLEGŁOŚĆ OD PLANETY");
  await expect(info).toContainText("Jowisz");
  await expect(info.getByRole("link", { name: /NASA/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await moons.getByRole("button", { name: "Powrót do planety", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "jupiter");
  await expect(moons).toHaveCount(0);
  await page.locator(".scene-tools").getByRole("button", { name: "Cały układ", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect(moons).toHaveCount(0);
});

test("keeps every moon and its description accessible through HTML when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return /webgl|experimental-webgl/.test(type) ? null : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Solar System objects", exact: true }).getByRole("button")).toHaveCount(9);
  for (const family of families) {
    await enterParent(page, family.name);
    await expect(moonNav(page).getByRole("button")).toHaveCount(family.moons.length + 2);
    for (const moon of family.moons) {
      await moonNav(page).getByRole("button", { name: `Select ${moon.name}`, exact: true }).click();
      await expect(panel(page).getByRole("heading", { name: moon.name, exact: true })).toBeVisible();
      await expandInformation(page);
      await expect(panel(page)).toContainText("DISTANCE FROM PLANET");
      await expect(panel(page).getByRole("link", { name: /NASA/ })).toBeVisible();
    }
  }
});

test("uses a readable moon speed temporarily and restores the original clock settings on exit and reset", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  const speed = page.getByRole("slider", { name: "Simulation speed", exact: true });
  await speed.fill("24");
  await page.getByRole("button", { name: "Resume simulation", exact: true }).click();
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
  await frames(page, 3);
  const days = await metric(page, "days");
  await enterParent(page, "Jupiter");
  await expect(speed).toHaveValue("0.1");
  await moonNav(page).getByRole("button", { name: "Select Europa", exact: true }).click();
  await speed.fill("0.5");
  await moonNav(page).getByRole("button", { name: "Select Io", exact: true }).click();
  await expect(speed).toHaveValue("0.5");
  expect(await metric(page, "days")).toBe(days);
  await moonNav(page).getByRole("button", { name: "Back to planet", exact: true }).click();
  await expect(speed).toHaveValue("24");
  expect(await metric(page, "days")).toBe(days);
  await enterParent(page, "Earth");
  await expect(speed).toHaveValue("0.1");
  await moonNav(page).getByRole("button", { name: "Select Moon", exact: true }).click();
  await page.getByRole("button", { name: "Reset simulation", exact: true }).click();
  await expect(speed).toHaveValue("8");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect(moonNav(page)).toHaveCount(0);
  await expect.poll(() => metric(page, "days")).toBe(0);
  await expect(page.getByRole("button", { name: "Resume simulation", exact: true })).toBeVisible();
});

test("returns focus to the parent catalog after closing moon information in portrait and landscape", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await enterParent(page, "Earth");
    await moonNav(page).getByRole("button", { name: "Select Moon", exact: true }).click();
    await expect(panel(page).getByRole("heading", { name: "Moon", exact: true })).toBeFocused();
    await panel(page).getByRole("button", { name: "Close information", exact: true }).click();
    await expect(scene(page)).toHaveAttribute("data-target", "overview");
    await expect(choose(page, "Earth")).toBeFocused();
    await expect(moonNav(page)).toHaveCount(0);
  }
});

test("keeps view settings fully clickable beside the moon family navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await enterParent(page, "Jupiter");
    const view = page.getByRole("button", { name: "View settings", exact: true });
    await expect.poll(() => view.evaluate((button) => {
      const r = button.getBoundingClientRect();
      return [[5, 5], [r.width - 5, 5], [5, r.height - 5], [r.width - 5, r.height - 5]]
        .every(([x, y]) => button.contains(document.elementFromPoint(r.left + x, r.top + y)));
    }), { message: `View settings is unobstructed at ${viewport.width}×${viewport.height}` }).toBe(true);
    const box = (await view.boundingBox())!;
    await view.click({ position: { x: box.width / 2, y: box.height - 5 } });
    await expect(view).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("combobox", { name: "Graphics quality", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close settings", exact: true }).click();
    await expect(view).toHaveAttribute("aria-expanded", "false");
    await moonNav(page).getByRole("button", { name: "Back to planet", exact: true }).click();
  }
});
