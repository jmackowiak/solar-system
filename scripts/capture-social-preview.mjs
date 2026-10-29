// Run a production preview on port 4174 first. No image services or external assets.
import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4174");
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="scene"]')?.dataset.ready === "true",
  );
  await page.waitForFunction(() =>
    document.querySelector(".sr-only")?.textContent.includes("8 surface maps"),
  );
  if (process.env.ORBITA_SOCIAL_MODE === "galaxy") {
    await page.getByRole("button", { name: "Milky Way", exact: true }).click();
    await page.waitForFunction(() => {
      const d = document.querySelector('[data-testid="scene"]').dataset;
      return (
        d.galaxyBlend === "1" && d.ready === "true" && d.flight === "false"
      );
    });
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "public/og-image.png" });
} finally {
  await browser.close();
}
