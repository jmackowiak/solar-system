import { expect, test, type Page } from "@playwright/test";

const scene = (page: Page) => page.getByTestId("scene");
const mode = (page: Page, name: "Solar System" | "Milky Way") =>
  page.getByRole("button", { name, exact: true });
const galaxyInfo = (page: Page) =>
  page.getByRole("region", { name: "About the Milky Way", exact: true });
const metric = async (page: Page, name: string) =>
  Number(await scene(page).getAttribute(`data-${name}`));
async function browserFrames(page: Page, count: number) {
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
  }, count);
}
async function ready(page: Page) {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => metric(page, "frames")).toBeGreaterThan(1);
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
}
async function enterGalaxy(page: Page) {
  await mode(page, "Milky Way").click();
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  await expect(scene(page)).toHaveAttribute("data-target", "galaxy");
  await expect(mode(page, "Milky Way")).toHaveAttribute("aria-pressed", "true");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
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
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
});
test.afterEach(async ({ page }) => {
  expect(
    errorsByPage.get(page),
    "No unexpected application or asset errors",
  ).toEqual([]);
});

test("explores the Milky Way using the same renderer and preserves Solar System simulation settings", async ({
  page,
}) => {
  await ready(page);
  const canvas = await scene(page).locator("canvas").elementHandle();
  expect(canvas).not.toBeNull();
  const speed = page.getByRole("slider", {
    name: "Simulation speed",
    exact: true,
  });
  await speed.fill("31");
  await expect(speed).toHaveValue("31");
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(0);
  await enterGalaxy(page);
  await expect(
    galaxyInfo(page).getByRole("heading", { level: 2, name: /Milky\s*Way/i }),
  ).toBeVisible();
  await expect(
    page.getByText("You are here", { exact: true }).first(),
  ).toBeVisible();
  await expect(scene(page).locator("canvas")).toHaveCount(1);
  expect(
    await canvas!.evaluate((node) => node === document.querySelector("canvas")),
  ).toBe(true);
  await expect.poll(() => metric(page, "draws")).toBeGreaterThan(0);
  const frozenDays = await metric(page, "days");
  await browserFrames(page, 30);
  expect(await metric(page, "days")).toBe(frozenDays);
  const pause = page.getByRole("button", {
    name: "Pause simulation",
    exact: true,
  });
  if (await pause.isVisible()) await expect(pause).toBeDisabled();
  else await expect(pause).toBeHidden();
  if (await speed.isVisible()) await expect(speed).toBeDisabled();
  else await expect(speed).toBeHidden();
  await mode(page, "Solar System").click();
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect(mode(page, "Solar System")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(speed).toHaveValue("31");
  await expect(pause).toBeEnabled();
  await expect.poll(() => metric(page, "days")).toBeGreaterThan(frozenDays);
  expect(
    await canvas!.evaluate((node) => node === document.querySelector("canvas")),
  ).toBe(true);
  await page.getByRole("button", { name: "Select Earth", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(
    page
      .getByRole("region", { name: "Object information" })
      .getByRole("heading", { name: "Earth", exact: true }),
  ).toBeVisible();
});

test("replaces rapid mode transitions and lets a drag interrupt the current flight", async ({
  page,
}) => {
  await ready(page);
  const canvas = await scene(page).locator("canvas").elementHandle();
  await mode(page, "Milky Way").click();
  await expect(scene(page)).toHaveAttribute("data-flight", "true");
  await mode(page, "Solar System").click();
  await mode(page, "Milky Way").click();
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  await expect(scene(page)).toHaveAttribute("data-target", "galaxy");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await mode(page, "Solar System").click();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await mode(page, "Milky Way").click();
  await expect(scene(page)).toHaveAttribute("data-flight", "true");
  const box = await scene(page).locator("canvas").boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width * 0.45;
  const y = box!.y + box!.height * 0.4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 65, y + 25, { steps: 5 });
  await page.mouse.up();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  await expect(scene(page).locator("canvas")).toHaveCount(1);
  expect(
    await canvas!.evaluate((node) => node === document.querySelector("canvas")),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Enter Solar System", exact: true })
    .first()
    .click();
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
});

test("supports keyboard mode switching, reduced motion and translated galaxy information", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await mode(page, "Milky Way").focus();
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(galaxyInfo(page)).toBeVisible();
  await page
    .getByRole("button", { name: "Enter Solar System", exact: true })
    .first()
    .focus();
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await mode(page, "Milky Way").focus();
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  const frozen = await metric(page, "days");
  await page
    .getByRole("combobox", { name: "Language / Język", exact: true })
    .selectOption("pl");
  await expect(
    page.getByRole("button", { name: "Droga Mleczna", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("region", { name: "O Drodze Mlecznej", exact: true }),
  ).toBeVisible();
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  expect(await metric(page, "days")).toBe(frozen);
  await page
    .getByRole("button", { name: "Układ Słoneczny", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await page
    .getByRole("button", { name: "Wybierz Ziemia", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(
    page
      .getByRole("region", { name: "Informacje o obiekcie" })
      .getByRole("heading", { name: "Ziemia", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Language / Język", exact: true }),
  ).toHaveValue("pl");
  await expect(
    page.getByRole("button", { name: "Układ Słoneczny", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("toggles the position label and provides a usable galaxy view on narrow touch screens", async ({
  page,
}) => {
  await ready(page);
  await enterGalaxy(page);
  const marker = page.getByTestId("galaxy-marker");
  await expect(marker).toBeVisible();
  await expect(marker).toContainText("You are here");
  await page
    .getByRole("button", { name: "View settings", exact: true })
    .click();
  const labels = page.getByRole("checkbox", { name: "Labels", exact: true });
  await labels.uncheck();
  await expect(marker).toBeHidden();
  await labels.check();
  await expect(marker).toBeVisible();
  const quality = page.getByRole("combobox", {
    name: "Graphics quality",
    exact: true,
  });
  await quality.selectOption("low");
  // Each population also includes the three measured exoplanet-host markers.
  await expect(scene(page)).toHaveAttribute("data-points", "13103");
  await quality.selectOption("high");
  await expect(scene(page)).toHaveAttribute("data-points", "38603");
  await quality.selectOption("auto");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(galaxyInfo(page)).toBeVisible();
  await page
    .getByRole("button", { name: "Enter Solar System", exact: true })
    .first()
    .click();
  await expect(scene(page)).toHaveAttribute("data-mode", "solar");
  await expect(scene(page).locator("canvas")).toBeVisible();
});

test("keeps the galaxy diagram and the Solar System accessible without a renderer", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      return /webgl|experimental-webgl/.test(type)
        ? null
        : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await mode(page, "Milky Way").click();
  await expect(page.getByTestId("galaxy-fallback")).toBeVisible();
  await expect(galaxyInfo(page)).toBeVisible();
  await expect(
    page.getByText("You are here", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enter Solar System", exact: true })
    .first()
    .click();
  await expect(page.getByTestId("fallback")).toBeVisible();
  await page.getByRole("button", { name: "Select Mars", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Object information" })
      .getByRole("heading", { name: "Mars", exact: true }),
  ).toBeVisible();
});

test("can choose the galaxy before the initial 3D module has finished loading", async ({
  page,
}) => {
  const pending: import("@playwright/test").Route[] = [];
  const pattern = "**/SolarScene-*.js";
  await page.route(pattern, (route) => {
    pending.push(route);
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => pending.length).toBeGreaterThan(0);
  await mode(page, "Milky Way").click();
  await expect(scene(page)).toHaveAttribute("data-mode", "galaxy");
  for (const route of pending) await route.continue();
  await page.unroute(pattern);
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect(scene(page)).toHaveAttribute("data-galaxy-blend", "1");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(page.getByTestId("galaxy-marker")).toBeVisible();
  await expect.poll(() => metric(page, "points")).toBeGreaterThan(10_000);
});
