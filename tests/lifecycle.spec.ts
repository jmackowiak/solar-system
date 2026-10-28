import { expect, test, type Page } from "@playwright/test";

const scene = (page: Page) => page.getByTestId("scene");
const number = async (page: Page, key: string) =>
  Number(await scene(page).getAttribute(`data-${key}`));
async function ready(page: Page) {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect.poll(() => number(page, "draws")).toBeGreaterThan(0);
}
async function browserFrames(page: Page, count: number) {
  return page.evaluate(async (n) => {
    const start = performance.now();
    for (let i = 0; i < n; i++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    return performance.now() - start;
  }, count);
}
async function pause(page: Page) {
  await page
    .getByRole("button", { name: "Wstrzymaj symulację", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Wznów symulację", exact: true }),
  ).toBeVisible();
  await browserFrames(page, 4);
}

test("reduced motion permits an explicit time resume while keeping navigation instant", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await expect(
    page.getByRole("button", { name: "Ogranicz animacje", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Wznów symulację", exact: true }),
  ).toBeVisible();
  const start = await number(page, "days");
  await page
    .getByRole("button", { name: "Wybierz Ziemia", exact: true })
    .click();
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await page
    .getByRole("button", { name: "Wznów symulację", exact: true })
    .click();
  await expect.poll(() => number(page, "days")).toBeGreaterThan(start + 1);
  await page
    .getByRole("button", { name: "Wybierz Merkury", exact: true })
    .click();
  await expect(scene(page)).toHaveAttribute("data-target", "mercury");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(
    page.getByRole("button", { name: "Ogranicz animacje", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("resuming after a pause counts only time spent running", async ({
  page,
}) => {
  await ready(page);
  await pause(page);
  const stopped = await number(page, "days");
  const stoppedDuration = await browserFrames(page, 40);
  expect(stoppedDuration).toBeGreaterThan(0);
  expect(await number(page, "days")).toBe(stopped);
  const resumed = await page.evaluate(async () => {
    const button = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Wznów symulację"]',
    )!;
    const start = performance.now();
    button.click();
    for (let i = 0; i < 5; i++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    const element = document.querySelector<HTMLElement>(
      '[data-testid="scene"]',
    )!;
    return {
      elapsed: performance.now() - start,
      days: Number(element.dataset.days),
    };
  });
  expect(resumed.days).toBeGreaterThan(stopped);
  // One additional frame/timing sample is allowed; a stopped interval must not leak into time.
  expect(resumed.days - stopped).toBeLessThan((resumed.elapsed / 1000) * 8 + 1);
});

test("quality switches change rendered geometry and orbit visibility changes draw calls", async ({
  page,
}) => {
  await ready(page);
  await pause(page);
  await page
    .getByRole("button", { name: "Ustawienia widoku", exact: true })
    .click();
  const quality = page.getByRole("combobox", {
    name: "Jakość grafiki",
    exact: true,
  });
  await quality.selectOption("low");
  await expect(scene(page)).toHaveAttribute("data-quality", "low");
  await browserFrames(page, 4);
  const lowTriangles = await number(page, "triangles");
  expect(lowTriangles).toBeGreaterThan(0);
  await quality.selectOption("high");
  await expect(scene(page)).toHaveAttribute("data-quality", "high");
  await expect
    .poll(() => number(page, "triangles"))
    .toBeGreaterThan(lowTriangles * 2);
  await browserFrames(page, 4);
  const withOrbits = await number(page, "draws");
  await page.getByRole("checkbox", { name: "Orbity", exact: true }).uncheck();
  await expect.poll(() => number(page, "draws")).toBeLessThan(withOrbits);
  const withoutOrbits = await number(page, "draws");
  await page.getByRole("checkbox", { name: "Orbity", exact: true }).check();
  await expect.poll(() => number(page, "draws")).toBeGreaterThan(withoutOrbits);
});

test("the first camera step to Mercury does not snap close to the destination", async ({
  page,
}) => {
  await ready(page);
  await pause(page);
  const samples = await page.evaluate(async () => {
    const element = document.querySelector<HTMLElement>(
      '[data-testid="scene"]',
    )!;
    const position = () =>
      (element.dataset.camera || "").split(",").map(Number);
    const initial = position();
    const result = [initial];
    document
      .querySelector<HTMLButtonElement>('button[aria-label="Wybierz Merkury"]')!
      .click();
    for (let i = 0; i < 240; i++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      result.push(position());
      if (i > 3 && element.dataset.flight === "false") break;
    }
    return {
      result,
      target: element.dataset.target,
      flight: element.dataset.flight,
    };
  });
  expect(samples.target).toBe("mercury");
  expect(samples.flight).toBe("false");
  const distance = (a: number[], b: number[]) =>
    Math.hypot(...a.map((v, i) => v - b[i]));
  const initial = samples.result[0];
  const totalDistance = distance(initial, samples.result.at(-1)!);
  expect(totalDistance).toBeGreaterThan(30);
  const firstMovement = samples.result.find(
    (point) => distance(initial, point) > 0.01,
  );
  expect(firstMovement).toBeDefined();
  expect(distance(initial, firstMovement!)).toBeLessThan(totalDistance * 0.25);
});

test("simulated document visibility freezes frames and time, then resumes without a time jump", async ({
  page,
}) => {
  await ready(page);
  await expect.poll(() => number(page, "days")).toBeGreaterThan(1);
  // This deliberately simulates visibilitychange; it is not a physical tab-backgrounding test.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await browserFrames(page, 4);
  const hiddenDays = await number(page, "days");
  const hiddenFrames = await number(page, "frames");
  await browserFrames(page, 40);
  expect(await number(page, "days")).toBe(hiddenDays);
  expect(await number(page, "frames")).toBe(hiddenFrames);
  const resumed = await page.evaluate(async () => {
    const start = performance.now();
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    for (let i = 0; i < 5; i++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    const element = document.querySelector<HTMLElement>(
      '[data-testid="scene"]',
    )!;
    return {
      elapsed: performance.now() - start,
      days: Number(element.dataset.days),
      frames: Number(element.dataset.frames),
    };
  });
  expect(resumed.frames).toBeGreaterThan(hiddenFrames);
  expect(resumed.days - hiddenDays).toBeGreaterThanOrEqual(0);
  expect(resumed.days - hiddenDays).toBeLessThan(
    (resumed.elapsed / 1000) * 8 + 1,
  );
});
