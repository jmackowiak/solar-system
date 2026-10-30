import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import type { SharedView } from "../src/lib/share";

const scene = (page: Page) => page.getByTestId("scene");
const metric = async (page: Page, key: string) => Number(await scene(page).getAttribute(`data-${key}`));
const sharing = (page: Page, pl = false) => page.getByRole("dialog", { name: pl ? "Udostępnij widok" : "Share view", exact: true });
async function frames(page: Page, count = 12) {
  await page.evaluate(async n => {
    for (let i = 0; i < n; i++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }, count);
}
async function rendered(page: Page) {
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  await expect(scene(page).locator("canvas")).toHaveCount(1);
}
async function ready(page: Page, reduced = true) {
  if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await rendered(page);
}
async function tool(page: Page, name: string, pl = false) {
  await page.getByRole("button", { name: pl ? "Narzędzia odkrywania" : "Explore tools", exact: true }).click();
  await page.getByRole("navigation", { name: pl ? "Narzędzia odkrywania" : "Discovery tools", exact: true })
    .getByRole("button", { name, exact: true }).click();
}
async function snapshot(page: Page, pl = false, close = true) {
  await tool(page, pl ? "Udostępnij widok" : "Share view", pl);
  const dialog = sharing(page, pl);
  await expect(dialog).toBeVisible();
  const url = await dialog.getByRole("textbox", { name: pl ? "Link do widoku" : "View link", exact: true }).inputValue();
  const parsed = new URL(url);
  expect(parsed.origin).toBe(new URL(page.url()).origin);
  expect(parsed.searchParams.has("view")).toBe(true);
  const view = JSON.parse(parsed.searchParams.get("view")!) as SharedView;
  expect(view.v).toBe(1);
  expect(view.paused, "Shared views open with a frozen simulation clock").toBe(true);
  if (close) {
    await dialog.getByRole("button", { name: pl ? "Zamknij udostępnianie" : "Close sharing", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
  return { url, view };
}
async function reopen(context: BrowserContext, url: string) {
  const restored = await context.newPage();
  await restored.emulateMedia({ reducedMotion: "reduce" });
  await restored.goto(url);
  await rendered(restored);
  await expect(scene(restored)).toHaveAttribute("data-flight", "false");
  return restored;
}
async function cameraEquals(page: Page, expected: number[]) {
  await expect.poll(async () => {
    const actual = (await scene(page).getAttribute("data-camera"))?.split(",").map(Number);
    if (!actual || actual.length !== 3 || !actual.every(Number.isFinite)) return Infinity;
    return Math.max(...actual.map((value, index) => Math.abs(value - expected[index])));
  }, { message: "The real camera restores the shared framing" }).toBeLessThan(0.03);
}

const errorLists = new WeakMap<BrowserContext, string[]>();
function track(page: Page, list: string[]) {
  page.on("pageerror", error => list.push(error.message));
  page.on("console", message => { if (message.type() === "error") list.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) list.push(`${response.status()} ${response.url()}`); });
  page.on("requestfailed", request => {
    if (!request.failure()?.errorText.includes("ERR_ABORTED")) list.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
}
test.beforeEach(async ({ page, context }) => {
  const list: string[] = [];
  errorLists.set(context, list);
  track(page, list);
  context.on("page", next => track(next, list));
});
test.afterEach(async ({ context }) => {
  expect(errorLists.get(context), "No unexpected application, shader or resource errors in either view").toEqual([]);
});

test("round-trips an Earth close-up with a manually rotated camera, time and view settings", async ({ page, context }) => {
  await ready(page, false);
  await page.getByRole("slider", { name: "Simulation speed", exact: true }).fill("31");
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
  await page.getByRole("button", { name: "Select Earth", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  const cameraBefore = await scene(page).getAttribute("data-camera");
  const box = await scene(page).locator("canvas").boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.43, box!.y + box!.height * 0.35);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.43 + 70, box!.y + box!.height * 0.35 + 25, { steps: 6 });
  await page.mouse.up();
  await expect(scene(page)).not.toHaveAttribute("data-camera", cameraBefore!);
  await frames(page, 30);
  await page.getByRole("button", { name: "View settings", exact: true }).click();
  const settings = page.getByRole("region", { name: "View settings", exact: true });
  await settings.getByRole("checkbox", { name: "Orbits", exact: true }).uncheck();
  await settings.getByRole("checkbox", { name: "Labels", exact: true }).uncheck();
  await settings.getByRole("button", { name: "Close settings", exact: true }).click();
  const { url, view } = await snapshot(page);
  expect(view.selected).toBe("earth");
  expect(view.system).toBe("solar");
  expect(view.speed).toBe(31);
  expect(view.days).toBeGreaterThan(0);
  expect(view.orbits).toBe(false);
  expect(view.labels).toBe(false);
  expect(view.camera).not.toBeNull();
  const restored = await reopen(context, url);
  await expect(scene(restored)).toHaveAttribute("data-target", "earth");
  await expect(restored.getByRole("region", { name: "Object information", exact: true }).getByRole("heading", { name: "Earth", exact: true })).toBeVisible();
  await cameraEquals(restored, view.camera!.position);
  await expect.poll(async () => Math.abs(await metric(restored, "days") - view.days)).toBeLessThan(0.00001);
  const heldDays = await metric(restored, "days");
  await frames(restored);
  expect(await metric(restored, "days")).toBe(heldDays);
  await expect(restored.getByRole("button", { name: "Resume simulation", exact: true })).toBeVisible();
  await expect(restored.getByRole("slider", { name: "Simulation speed", exact: true })).toHaveValue("31");
  await restored.getByRole("button", { name: "View settings", exact: true }).click();
  const restoredSettings = restored.getByRole("region", { name: "View settings", exact: true });
  await expect(restoredSettings.getByRole("checkbox", { name: "Orbits", exact: true })).not.toBeChecked();
  await expect(restoredSettings.getByRole("checkbox", { name: "Labels", exact: true })).not.toBeChecked();
  await restored.close();
});

test("restores a moon's parent system and a cross-system size comparison", async ({ page, context }) => {
  test.setTimeout(75_000);
  await ready(page);
  await page.getByRole("button", { name: "Select Jupiter", exact: true }).click();
  await page.getByRole("button", { name: "Explore moons", exact: true }).click();
  await page.getByRole("navigation", { name: "Moons", exact: true }).getByRole("button", { name: "Select Ganymede", exact: true }).click();
  const moon = await snapshot(page);
  expect(moon.view.selected).toBe("ganymede");
  let restored = await reopen(context, moon.url);
  await expect(scene(restored)).toHaveAttribute("data-target", "ganymede");
  await expect(restored.getByRole("navigation", { name: "Moons", exact: true }).getByRole("button")).toHaveCount(6);
  await expect(restored.getByRole("region", { name: "Object information", exact: true }).getByRole("heading", { name: "Ganymede", exact: true })).toBeVisible();
  await restored.close();
  await tool(page, "Size comparison");
  const compare = page.getByRole("region", { name: "Size comparison", exact: true });
  await compare.getByRole("combobox", { name: /^First object\b/ }).selectOption("earth");
  await compare.getByRole("combobox", { name: /^Second object\b/ }).selectOption("trappist-1-e");
  const pair = await snapshot(page);
  expect(pair.view.pair).toEqual(["earth", "trappist-1-e"]);
  restored = await reopen(context, pair.url);
  await expect(scene(restored)).toHaveAttribute("data-mode", "compare");
  const pairPanel = restored.getByRole("region", { name: "Size comparison", exact: true });
  await expect(pairPanel.getByRole("combobox", { name: /^First object\b/ })).toHaveValue("earth");
  await expect(pairPanel.getByRole("combobox", { name: /^Second object\b/ })).toHaveValue("trappist-1-e");
  await expect(restored.locator(".comparison-label").filter({ hasText: "TRAPPIST-1 e" })).toBeVisible();
  await restored.close();
});

test("restores galaxy, neighborhood range, eclipse position and the light pulse's physical time", async ({ page, context }) => {
  test.setTimeout(120_000);
  for (const mode of ["galaxy", "neighborhood", "phases", "light"] as const) {
    await ready(page);
    if (mode === "galaxy") await page.getByRole("button", { name: "Milky Way", exact: true }).click();
    if (mode === "neighborhood") {
      await tool(page, "Solar neighborhood");
      await page.getByRole("region", { name: "Stellar neighborhood", exact: true }).getByRole("button", { name: "3,000 ly", exact: true }).click();
    }
    if (mode === "phases") {
      await tool(page, "Moon phases & eclipses");
      const phases = page.getByRole("region", { name: "Moon phases and eclipses", exact: true });
      await phases.getByRole("combobox", { name: "Scenario", exact: true }).selectOption("lunar");
      await phases.getByRole("slider", { name: "Moon position", exact: true }).fill("210");
    }
    if (mode === "light") {
      await tool(page, "Light journey");
      await page.getByRole("region", { name: "Light journey", exact: true }).getByRole("slider", { name: "Light travel time", exact: true }).fill("1000");
    }
    await expect(scene(page)).toHaveAttribute("data-mode", mode);
    await expect(scene(page)).toHaveAttribute("data-flight", "false");
    const { url, view } = await snapshot(page);
    expect(view.mode).toBe(mode);
    const restored = await reopen(context, url);
    await expect(scene(restored)).toHaveAttribute("data-mode", mode);
    if (mode === "galaxy") await expect(restored.getByRole("region", { name: "About the Milky Way", exact: true })).toBeVisible();
    if (mode === "neighborhood") {
      await expect(restored.getByTestId("neighborhood-panel")).toHaveAttribute("data-range", "3000");
      await expect(restored.locator(".neighborhood-marker")).toHaveCount(4);
    }
    if (mode === "phases") {
      await expect(scene(restored)).toHaveAttribute("data-eclipse-scenario", "lunar");
      await expect(scene(restored)).toHaveAttribute("data-phase-angle", "210");
      await expect(scene(restored)).toHaveAttribute("data-eclipse-shadow", "true");
    }
    if (mode === "light") {
      await expect.poll(() => metric(restored, "light-seconds")).toBe(1000);
      await expect(restored.getByRole("button", { name: "Start light pulse", exact: true })).toBeVisible();
    }
    await cameraEquals(restored, view.camera!.position);
    await restored.close();
  }
});

test("confirms only completed clipboard writes and keeps a usable selected link after clipboard denial", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { copiedView?: string; finishCopy?: () => void };
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: (value: string) => new Promise<void>(resolve => { state.copiedView = value; state.finishCopy = resolve; }),
    } });
  });
  await ready(page);
  await page.getByRole("button", { name: "Select Earth", exact: true }).click();
  const { url } = await snapshot(page, false, false);
  const dialog = sharing(page);
  await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Copying…", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("status")).not.toContainText("Link copied");
  expect(await page.evaluate(() => (window as Window & { copiedView?: string }).copiedView)).toBe(url);
  await page.evaluate(() => (window as Window & { finishCopy?: () => void }).finishCopy?.());
  await expect(dialog.getByRole("status")).toHaveText("Link copied. Ready to share.");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Permission denied"); } } });
  });
  await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("Ctrl+C / ⌘C");
  await expect(dialog.getByRole("status")).not.toContainText("Link copied");
  const input = dialog.getByRole("textbox", { name: "View link", exact: true });
  await expect(input).toBeFocused();
  expect(await input.evaluate(element => {
    const field = element as HTMLInputElement;
    return field.selectionStart === 0 && field.selectionEnd === field.value.length;
  })).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(page.getByRole("button", { name: "Explore tools", exact: true })).toBeFocused();
});

test("rejects malformed and oversized view links while keeping the normal atlas usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const value of ["{bad", "x".repeat(4000), JSON.stringify({ v: 2, mode: "unknown" })]) {
    await page.goto(`/?view=${encodeURIComponent(value)}`);
    await rendered(page);
    await expect(scene(page)).toHaveAttribute("data-mode", "solar");
    await expect(scene(page)).toHaveAttribute("data-system", "solar");
    await expect(page.getByRole("navigation", { name: "Solar System objects", exact: true }).getByRole("button")).toHaveCount(9);
    await page.getByRole("button", { name: "Select Mars", exact: true }).click();
    await expect(scene(page)).toHaveAttribute("data-target", "mars");
    await expect(page.getByRole("region", { name: "Object information", exact: true }).getByRole("heading", { name: "Mars", exact: true })).toBeVisible();
  }
});

test("uses the shared language ahead of saved preferences and keeps the sharing dialog inside a narrow viewport", async ({ page, context }) => {
  test.setTimeout(75_000);
  await ready(page);
  await page.getByRole("button", { name: "Select Earth", exact: true }).click();
  const english = await snapshot(page);
  let restored = await context.newPage();
  await restored.addInitScript(() => localStorage.setItem("orbita-language", "pl"));
  await restored.goto(english.url);
  await rendered(restored);
  await expect(restored.locator("html")).toHaveAttribute("lang", "en");
  await expect(restored.getByRole("region", { name: "Object information", exact: true }).getByRole("heading", { name: "Earth", exact: true })).toBeVisible();
  await restored.close();
  await page.getByRole("combobox", { name: "Language / Język", exact: true }).selectOption("pl");
  await page.setViewportSize({ width: 360, height: 640 });
  const polish = await snapshot(page, true, false);
  expect(polish.view.language).toBe("pl");
  const dialog = sharing(page, true);
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(640);
  await expect(dialog).toContainText("wstrzymaną symulacją");
  await expect(dialog.getByRole("textbox", { name: "Link do widoku", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(page.getByRole("button", { name: "Narzędzia odkrywania", exact: true })).toBeFocused();
  restored = await context.newPage();
  await restored.addInitScript(() => localStorage.setItem("orbita-language", "en"));
  await restored.goto(polish.url);
  await rendered(restored);
  await expect(restored.locator("html")).toHaveAttribute("lang", "pl");
  await expect(restored.getByRole("region", { name: "Informacje o obiekcie", exact: true }).getByRole("heading", { name: "Ziemia", exact: true })).toBeVisible();
  await expect(restored.getByRole("button", { name: "Wznów symulację", exact: true })).toBeVisible();
  await restored.close();
});
