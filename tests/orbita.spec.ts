import { expect, test, type Page } from "@playwright/test";

const objects = [
  ["sun", "Słońce"],
  ["mercury", "Merkury"],
  ["venus", "Wenus"],
  ["earth", "Ziemia"],
  ["mars", "Mars"],
  ["jupiter", "Jowisz"],
  ["saturn", "Saturn"],
  ["uranus", "Uran"],
  ["neptune", "Neptun"],
] as const;

const scene = (page: Page) => page.getByTestId("scene");
const panel = (page: Page) =>
  page.getByRole("region", { name: "Informacje o obiekcie" });
const choose = (page: Page, name: string) =>
  page.getByRole("button", { name: `Wybierz ${name}`, exact: true });
async function ready(page: Page) {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-frames")))
    .toBeGreaterThan(2);
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-draws")))
    .toBeGreaterThan(0);
}
async function frames(page: Page, count = 20) {
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
  }, count);
}

let unexpectedErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("orbita-language", "pl"));
  unexpectedErrors = [];
  page.on("pageerror", (error) => unexpectedErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") unexpectedErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (!request.failure()?.errorText.includes("ERR_ABORTED"))
      unexpectedErrors.push(
        `${request.url()}: ${request.failure()?.errorText}`,
      );
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      unexpectedErrors.push(`${response.status()} ${response.url()}`);
  });
});
test.afterEach(() =>
  expect(
    unexpectedErrors,
    "No unexpected application, WebGL, or asset errors",
  ).toEqual([]),
);

test("renders a working WebGL scene and exposes honest astronomical context", async ({
  page,
}) => {
  await ready(page);
  await expect(page).toHaveTitle(/Orbita/);
  await expect(
    page.getByText(
      /Widok poglądowy — rozmiary i odległości nie zachowują wspólnej skali/,
    ),
  ).toBeVisible();
  await expect(scene(page).locator("canvas")).toBeVisible();
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await scene(page).screenshot({
    path: `test-results/scene-${test.info().project.name}.png`,
  });
});

test("selects all nine objects, shows their real data, and returns to the complete system", async ({
  page,
}) => {
  await ready(page);
  for (const [id, name] of objects) {
    await choose(page, name).click();
    await expect(
      panel(page).getByRole("heading", { level: 2, name, exact: true }),
    ).toBeVisible();
    await expect(scene(page)).toHaveAttribute("data-target", id);
    await expect(
      panel(page).getByRole("link", { name: /NASA/ }),
    ).toHaveAttribute(
      "href",
      /https:\/\/(science\.nasa\.gov|ssd\.jpl\.nasa\.gov)/,
    );
  }
  await page.getByRole("button", { name: "Cały układ", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect(panel(page)).toHaveCount(0);
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
});

test("replaces a flight destination immediately and allows a manual interruption", async ({
  page,
}) => {
  await ready(page);
  await choose(page, "Ziemia").click();
  await expect(scene(page)).toHaveAttribute("data-flight", "true");
  await choose(page, "Neptun").click();
  await expect(scene(page)).toHaveAttribute("data-target", "neptune");
  await choose(page, "Saturn").click();
  await expect(
    panel(page).getByRole("heading", { name: "Saturn", exact: true }),
  ).toBeVisible();
  const box = await scene(page).locator("canvas").boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width * 0.6;
  const y = box!.y + box!.height * 0.48;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y + 30, { steps: 5 });
  await page.mouse.up();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(scene(page)).toHaveAttribute("data-target", "saturn");
  await page.getByRole("button", { name: "Cały układ", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
});

test("pauses time while exploration remains usable, resumes, changes speed, and resets", async ({
  page,
}) => {
  await ready(page);
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-days")))
    .toBeGreaterThan(3);
  await page
    .getByRole("button", { name: "Wstrzymaj symulację", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Wznów symulację", exact: true }),
  ).toBeVisible();
  // Allow the DOM clock's next sampled value to settle, then compare after browser frames.
  await frames(page);
  const stopped = await scene(page).getAttribute("data-days");
  await choose(page, "Ziemia").click();
  await expect(
    panel(page).getByRole("heading", { name: "Ziemia", exact: true }),
  ).toBeVisible();
  await frames(page);
  await expect(scene(page)).toHaveAttribute("data-days", stopped!);
  const speed = page.getByRole("slider", {
    name: "Szybkość symulacji",
    exact: true,
  });
  await speed.fill("24");
  await expect(speed).toHaveValue("24");
  await page
    .getByRole("button", { name: "Wznów symulację", exact: true })
    .click();
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-days")))
    .toBeGreaterThan(Number(stopped));
  await page
    .getByRole("button", { name: "Resetuj symulację", exact: true })
    .click();
  await expect(speed).toHaveValue("8");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-days")))
    .toBeLessThan(Number(stopped));
});

test("runs a user-paced tour forwards and backwards and ends it", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Rozpocznij podróż", exact: true })
    .click();
  await expect(
    panel(page).getByRole("heading", { name: "Słońce", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Następny przystanek", exact: true })
    .click();
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await page
    .getByRole("button", { name: "Poprzedni przystanek", exact: true })
    .click();
  await expect(scene(page)).toHaveAttribute("data-target", "sun");
  for (const target of ["earth", "jupiter", "saturn", "neptune"]) {
    await page
      .getByRole("button", { name: "Następny przystanek", exact: true })
      .click();
    await expect(scene(page)).toHaveAttribute("data-target", target);
  }
  await page
    .getByRole("button", { name: "Zakończ podróż", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Następny przystanek", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Rozpocznij podróż", exact: true }),
  ).toBeVisible();
});

test("controls orbit labels and render quality with accessible settings", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Ustawienia widoku", exact: true })
    .click();
  const orbits = page.getByRole("checkbox", { name: "Orbity", exact: true });
  const labels = page.getByRole("checkbox", { name: "Etykiety", exact: true });
  await orbits.uncheck();
  await expect(orbits).not.toBeChecked();
  await labels.uncheck();
  await expect(labels).not.toBeChecked();
  await expect(page.locator(".planet-label")).toHaveCount(0);
  const quality = page.getByRole("combobox", {
    name: "Jakość grafiki",
    exact: true,
  });
  await quality.selectOption({ label: "Niska" });
  await expect(quality).toHaveValue("low");
  await quality.selectOption({ label: "Wysoka" });
  await expect(quality).toHaveValue("high");
  await quality.selectOption({ label: "Auto" });
  await expect(quality).toHaveValue("auto");
  await orbits.check();
  await labels.check();
  await expect
    .poll(async () => page.locator(".planet-label").count())
    .toBeGreaterThan(0);
});

test("honors reduced motion and keyboard selection without animated flights", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByRole("button", { name: "Wznów symulację", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ogranicz animacje", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await choose(page, "Ziemia").focus();
  await expect(choose(page, "Ziemia")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(
    panel(page).getByRole("heading", { name: "Ziemia", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
});

test("offers useful descriptions when the renderer cannot initialize", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (/webgl|experimental-webgl/.test(type)) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await choose(page, "Mars").click();
  await expect(
    panel(page).getByRole("heading", { name: "Mars", exact: true }),
  ).toBeVisible();
  await expect(panel(page)).toContainText(/6\s?779/);
  await expect(panel(page).getByRole("link", { name: /NASA/ })).toBeVisible();
});

test("supports a narrow touch viewport and changes orientation without page overflow", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "Touch emulation scenario",
  );
  await ready(page);
  await choose(page, "Saturn").tap();
  await expect(
    panel(page).getByRole("heading", { name: "Saturn", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cały układ", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(scene(page).locator("canvas")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Cały układ", exact: true }).tap();
  await expect(scene(page)).toHaveAttribute("data-target", "overview");
});

test("recovers failed textures while retaining usable selection and descriptions", async ({
  page,
}) => {
  await page.route("**/textures/earth*.webp", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/webp",
      body: "invalid image data",
    }),
  );
  await ready(page);
  await expect(page.locator(".texture-notice")).toBeVisible();
  await choose(page, "Ziemia").click();
  await expect(
    panel(page).getByRole("heading", { name: "Ziemia", exact: true }),
  ).toBeVisible();
  await page.unroute("**/textures/earth*.webp");
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/textures/earth-low.webp") && r.ok(),
  );
  await page.getByRole("button", { name: "Ponów", exact: true }).click();
  await response;
  await expect(page.locator(".texture-notice")).toHaveCount(0);
});

test("keeps the selected body centered after resize and renders only on demand when paused", async ({
  page,
}) => {
  await ready(page);
  await choose(page, "Ziemia").click();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await page.setViewportSize({ width: 430, height: 850 });
  await expect
    .poll(async () => {
      const xy = (await scene(page).getAttribute("data-projected"))
        ?.split(",")
        .map(Number);
      return !!xy && Math.abs(xy[0]) < 0.05 && Math.abs(xy[1]) < 0.05;
    })
    .toBe(true);
  await page
    .getByRole("button", { name: "Wstrzymaj symulację", exact: true })
    .click();
  await frames(page, 40);
  const count = await scene(page).getAttribute("data-frames");
  await frames(page, 30);
  await expect(scene(page)).toHaveAttribute("data-frames", count!);
  const box = await scene(page).locator("canvas").boundingBox();
  await page.mouse.move(box!.width * 0.6, box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box!.width * 0.6 + 40, box!.height * 0.5 + 20, {
    steps: 5,
  });
  await page.mouse.up();
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-frames")))
    .toBeGreaterThan(Number(count));
});

test("touch gestures orbit and pinch the real camera while time is paused", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "mobile-chromium",
    "Multi-touch emulation scenario",
  );
  await ready(page);
  await choose(page, "Saturn").tap();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await page
    .getByRole("button", { name: "Wstrzymaj symulację", exact: true })
    .tap();
  const position = async () =>
    ((await scene(page).getAttribute("data-camera")) || "")
      .split(",")
      .map(Number);
  const before = await position();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, x: 130, y: 210 }],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ id: 1, x: 130 + i * 10, y: 210 + i * 4 }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () =>
      Math.hypot(...(await position()).map((v, i) => v - before[i])),
    )
    .toBeGreaterThan(0.5);
  await frames(page, 35);
  const rotated = await position();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: 150, y: 210 },
      { id: 2, x: 240, y: 210 },
    ],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { id: 1, x: 150 - i * 8, y: 210 },
        { id: 2, x: 240 + i * 8, y: 210 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () =>
      Math.hypot(...(await position()).map((v, i) => v - rotated[i])),
    )
    .toBeGreaterThan(0.5);
  await expect(scene(page)).toHaveAttribute("data-target", "saturn");
  await expect(
    page.getByRole("button", { name: "Wznów symulację", exact: true }),
  ).toBeVisible();
  await cdp.detach();
});
