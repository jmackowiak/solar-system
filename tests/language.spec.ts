import { expect, test } from "@playwright/test";
test.use({ locale: "pl-PL" });
const picker = (page: import("@playwright/test").Page) =>
  page.getByRole("combobox", { name: "Language / Język", exact: true });
const scene = (page: import("@playwright/test").Page) =>
  page.getByTestId("scene");
test("defaults to English even for a Polish browser and persists an explicit language choice", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(picker(page)).toHaveValue("en");
  await expect(
    page.getByRole("button", { name: "Select Earth", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start journey", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Orbita — Solar System atlas");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /interactive Solar System atlas/,
  );
  await picker(page).selectOption("pl");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(
    page.getByRole("button", { name: "Wybierz Ziemia", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(picker(page)).toHaveValue("pl");
  await expect(page).toHaveTitle("Orbita — atlas Układu Słonecznego");
  await picker(page).selectOption("en");
  await page.reload();
  await expect(picker(page)).toHaveValue("en");
  await expect(
    page.getByRole("button", { name: "Select Sun", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("translates an open object and 3D labels without resetting time, selection or camera", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await page.getByRole("button", { name: "Select Earth", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  const days = await scene(page).getAttribute("data-days");
  const camera = await scene(page).getAttribute("data-camera");
  const en = page.getByRole("region", { name: "Object information" });
  await expect(
    en.getByRole("heading", { name: "Earth", exact: true }),
  ).toBeVisible();
  await expect(en).toContainText("12,742");
  await expect(en).toContainText("MEAN DIAMETER");
  await expect(page.locator(".planet-label.active")).toHaveText("Earth");
  await picker(page).selectOption("pl");
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await expect(scene(page)).toHaveAttribute("data-flight", "false");
  await expect(scene(page)).toHaveAttribute("data-days", days!);
  await expect(scene(page)).toHaveAttribute("data-camera", camera!);
  const pl = page.getByRole("region", { name: "Informacje o obiekcie" });
  await expect(
    pl.getByRole("heading", { name: "Ziemia", exact: true }),
  ).toBeVisible();
  await expect(pl).toContainText("12 742");
  await expect(page.locator(".planet-label.active")).toHaveText("Ziemia");
  await picker(page).selectOption("en");
  await page
    .getByRole("button", { name: "Close information", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select Earth", exact: true }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
test("translates an active journey, view settings and about dialog", async ({
  page,
}) => {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("button", { name: "Start journey", exact: true })
    .click();
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-target", "earth");
  await picker(page).selectOption("pl");
  await expect(
    page.getByRole("button", { name: "Następny przystanek", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Informacje o obiekcie" })
      .getByRole("heading", { name: "Nasz błękitny adres" }),
  ).toBeVisible();
  await picker(page).selectOption("en");
  await expect(
    page
      .getByRole("region", { name: "Object information" })
      .getByRole("heading", { name: "Our blue address" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "End journey", exact: true }).click();
  await page
    .getByRole("button", { name: "View settings", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Orbits", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Graphics quality" }),
  ).toHaveValue("auto");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "About the atlas", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("without ephemerides");
  await page
    .getByRole("button", { name: "Close atlas description", exact: true })
    .click();
});
test("keeps both languages available without WebGL and without localStorage", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked storage");
      },
    });
  });
  await page.goto("/?fallback=1");
  await expect(page.getByTestId("fallback")).toBeVisible();
  await expect(picker(page)).toHaveValue("en");
  await page.getByRole("button", { name: "Select Mars", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Object information" }),
  ).toContainText("Olympus Mons");
  await picker(page).selectOption("pl");
  await expect(
    page.getByRole("region", { name: "Informacje o obiekcie" }),
  ).toContainText("największy wulkan");
});
