import { expect, test, type Page } from "@playwright/test";

const systems = [
  { id: "trappist-1", name: "TRAPPIST-1", letters: "bcdefgh", target: "e" },
  { id: "kepler-90", name: "Kepler-90", letters: "bcdefghi", target: "i" },
  { id: "toi-700", name: "TOI-700", letters: "bcde", target: "d" },
] as const;
const scene = (page: Page) => page.getByTestId("scene");
const picker = (page: Page) =>
  page.getByRole("combobox", { name: "Planetary system", exact: true });
const destinations = (page: Page) =>
  page.getByRole("navigation", { name: "Planetary system objects", exact: true });
const panel = (page: Page) =>
  page.getByRole("region", { name: "Object information", exact: true });
const metric = async (page: Page, key: string) =>
  Number(await scene(page).getAttribute(`data-${key}`));
async function frames(page: Page, count = 20) {
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }, count);
}
async function expandInformation(page: Page) {
  const expand = page.getByRole("button", { name: /^(Expand information|Rozwiń informacje)$/ });
  if (await expand.count()) await expand.click();
}
async function ready(page: Page) {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(1);
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  await expect(scene(page)).toHaveAttribute("data-system", "solar");
}
async function chooseSystem(page: Page, id: string, settle = true) {
  await picker(page).selectOption(id);
  await expect(scene(page)).toHaveAttribute("data-system", id);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  if (settle) {
    await expect(scene(page)).toHaveAttribute("data-ready", "true");
    await expect(scene(page)).toHaveAttribute("data-flight", "false");
    await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  }
}

const errorsByPage = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  errorsByPage.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (!request.failure()?.errorText.includes("ERR_ABORTED"))
      errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
});
test.afterEach(async ({ page }) => {
  expect(errorsByPage.get(page), "No unexpected application or asset errors").toEqual([]);
});

test("renders all three observed systems with complete object lists, NASA data and honest appearance labels", async ({ page }) => {
  await ready(page);
  const canvas = await scene(page).locator("canvas").elementHandle();
  expect(canvas).not.toBeNull();
  for (const system of systems) {
    await chooseSystem(page, system.id);
    const nav = destinations(page);
    await expect(nav.getByRole("button")).toHaveCount(system.letters.length + 1);
    await expect(nav.getByRole("button", { name: `Select ${system.name}`, exact: true })).toBeVisible();
    for (const letter of system.letters)
      await expect(nav.getByRole("button", { name: `Select ${system.name} ${letter}`, exact: true })).toHaveCount(1);
    await expect(page.getByText("Planet appearances are artistic interpretations.", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Start journey", exact: true })).toHaveCount(0);
    const name = `${system.name} ${system.target}`;
    await nav.getByRole("button", { name: `Select ${name}`, exact: true }).click();
    await expect(scene(page)).toHaveAttribute("data-target", `${system.id}-${system.target}`);
    await expect(panel(page).getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(panel(page)).toContainText("DISTANCE FROM STAR");
    await expandInformation(page);
    await expect(panel(page).getByRole("link", { name: /NASA/ })).toHaveAttribute(
      "href", /^https:\/\/(science\.nasa\.gov|exoplanetarchive\.ipac\.caltech\.edu|exoplanets\.nasa\.gov)/,
    );
    await expect(scene(page)).toHaveAttribute("data-flight", "false");
    await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
    expect(await canvas!.evaluate((node) => node === document.querySelector("canvas"))).toBe(true);
    await nav.getByRole("button", { name: `Select ${system.name}`, exact: true }).click();
    await expect(scene(page)).toHaveAttribute("data-target", system.id);
    await expect(panel(page).getByRole("heading", { name: system.name, exact: true })).toBeVisible();
  }
});

test("replaces planetary destinations and entire systems during flights without replacing the renderer", async ({ page }) => {
  await ready(page);
  const canvas = await scene(page).locator("canvas").elementHandle();
  await chooseSystem(page, "trappist-1", false);
  await destinations(page).getByRole("button", { name: "Select TRAPPIST-1 e", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-flight", "true");
  await destinations(page).getByRole("button", { name: "Select TRAPPIST-1 h", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "trappist-1-h");
  await chooseSystem(page, "kepler-90", false);
  await destinations(page).getByRole("button", { name: "Select Kepler-90 i", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "kepler-90-i");
  await chooseSystem(page, "toi-700", false);
  await destinations(page).getByRole("button", { name: "Select TOI-700 d", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "toi-700-d");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(panel(page).getByRole("heading", { name: "TOI-700 d", exact: true })).toBeVisible();
  const camera = (await scene(page).getAttribute("data-camera"))!.split(",").map(Number);
  expect(camera.every(Number.isFinite)).toBe(true);
  expect(await canvas!.evaluate((node) => node === document.querySelector("canvas"))).toBe(true);
  await page.locator(".scene-tools").getByRole("button", { name: "Whole system", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "toi-700");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
});

test("keeps independent clocks and speeds per system and resets only the current system", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  const speed = page.getByRole("slider", { name: "Simulation speed", exact: true });
  await expect(speed).toHaveValue("8");
  await speed.fill("31");
  await chooseSystem(page, "trappist-1");
  await expect(speed).toHaveValue("0.25");
  await expect.poll(() => metric(page, "days")).toBe(0);
  await speed.fill("1.5");
  await page.getByRole("button", { name: "Resume simulation", exact: true }).click();
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(0.3);
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
  await frames(page, 4);
  const trappistDays = await metric(page, "days");
  await frames(page);
  expect(await metric(page, "days")).toBe(trappistDays);
  await chooseSystem(page, "kepler-90");
  await expect(speed).toHaveValue("0.25");
  await expect.poll(() => metric(page, "days")).toBe(0);
  await speed.fill("0.5");
  await page.getByRole("button", { name: "Resume simulation", exact: true }).click();
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(0.2);
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
  await frames(page, 4);
  const keplerDays = await metric(page, "days");
  await chooseSystem(page, "trappist-1");
  await expect(speed).toHaveValue("1.5");
  await expect(page.getByRole("button", { name: "Resume simulation", exact: true })).toBeVisible();
  expect(await metric(page, "days")).toBe(trappistDays);
  await destinations(page).getByRole("button", { name: "Select TRAPPIST-1 e", exact: true }).click();
  await page.getByRole("button", { name: "Reset simulation", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-system", "trappist-1");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect(speed).toHaveValue("0.25");
  await expect.poll(() => metric(page, "days")).toBe(0);
  await chooseSystem(page, "kepler-90");
  await expect(speed).toHaveValue("0.5");
  expect(await metric(page, "days")).toBe(keplerDays);
  await chooseSystem(page, "solar");
  await expect(speed).toHaveValue("31");
  await expect.poll(() => metric(page, "days")).toBe(0);
});

test("supports keyboard selection and Polish content without overflowing a narrow viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await picker(page).focus();
  await page.keyboard.type("TRAPPIST");
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-system", "trappist-1");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await page.getByRole("combobox", { name: "Language / Język", exact: true }).selectOption("pl");
  await expect(page.getByRole("combobox", { name: "Układ planetarny", exact: true })).toHaveValue("trappist-1");
  const nav = page.getByRole("navigation", { name: "Obiekty układu planetarnego", exact: true });
  await nav.getByRole("button", { name: "Wybierz TRAPPIST-1 e", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-target", "trappist-1-e");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  const info = page.getByRole("region", { name: "Informacje o obiekcie", exact: true });
  await expect(info.getByRole("heading", { name: "TRAPPIST-1 e", exact: true })).toBeVisible();
  await expect(info).toContainText("ODLEGŁOŚĆ OD GWIAZDY");
  await expandInformation(page);
  await expect(page.getByText("Wygląd planet jest wizualizacją artystyczną.", { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(scene(page).locator("canvas")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("opens catalog systems from the galaxy and keeps the Solar System marker pointed at our own system", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await page.getByRole("button", { name: "Milky Way", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  await picker(page).selectOption("kepler-90");
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-system", "kepler-90");
  await expect(destinations(page).getByRole("button")).toHaveCount(9);
  await page.getByRole("button", { name: "Milky Way", exact: true }).click();
  const galaxy = page.getByRole("region", { name: "About the Milky Way", exact: true });
  await expandInformation(page);
  await galaxy.getByRole("button", { name: "TRAPPIST-1", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-system", "trappist-1");
  await page.getByRole("button", { name: "Milky Way", exact: true }).click();
  await page.getByRole("button", { name: "Enter Solar System", exact: true }).first().click();
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-system", "solar");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect(page.getByRole("button", { name: "Select Earth", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start journey", exact: true })).toBeVisible();
});

test("offers every exoplanet system and its data when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return /webgl|experimental-webgl/.test(type) ? null : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByTestId("fallback")).toBeVisible();
  for (const system of systems) {
    await picker(page).selectOption(system.id);
    await expect(page.getByTestId("fallback")).toBeVisible();
    await expect(destinations(page).getByRole("button")).toHaveCount(system.letters.length + 1);
    const name = `${system.name} ${system.target}`;
    await destinations(page).getByRole("button", { name: `Select ${name}`, exact: true }).click();
    await expect(panel(page).getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(panel(page)).toContainText("DISTANCE FROM STAR");
  }
});

test("renders every observed exoplanet with a finite centered close-up after keyboard-safe instant navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  for (const system of systems) {
    await chooseSystem(page, system.id);
    for (const letter of system.letters) {
      const before = await metric(page, "frames");
      const name = `${system.name} ${letter}`;
      await destinations(page).getByRole("button", { name: `Select ${name}`, exact: true }).click();
      await expect(scene(page)).toHaveAttribute("data-target", `${system.id}-${letter}`);
      await expect(scene(page)).toHaveAttribute("data-flight", "false");
      await expect(panel(page).getByRole("heading", { name, exact: true })).toBeVisible();
      await expect.poll(() => metric(page, "frames")).toBeGreaterThan(before);
      await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
      await expect.poll(async () => {
        const projected = (await scene(page).getAttribute("data-projected"))?.split(",").map(Number);
        if (!projected || projected.length !== 3 || !projected.every(Number.isFinite)) return Infinity;
        return Math.max(Math.abs(projected[0]), Math.abs(projected[1]));
      }, { message: `${name} is rendered at the center of its close-up` }).toBeLessThan(0.05);
      const projected = (await scene(page).getAttribute("data-projected"))!.split(",").map(Number);
      expect(projected.every(Number.isFinite)).toBe(true);
      expect(projected[2]).toBeGreaterThan(-1);
      expect(projected[2]).toBeLessThan(1);
    }
  }
});
