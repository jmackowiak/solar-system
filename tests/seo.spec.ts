import { expect, test } from "@playwright/test";
const canonical = "https://solar-system-six-opal.vercel.app/";
test("serves complete search and social metadata in HTML without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto(baseURL!);
    expect(response?.status()).toBe(200);
    expect((await response!.text()).indexOf('charset="UTF-8"')).toBeLessThan(
      1024,
    );
    await expect(page).toHaveTitle("Orbita — Solar System and Milky Way in 3D");
    await expect(page.locator('head meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Explore the Solar System and Milky Way in 3D. Fly between planets, find our place in the galaxy and discover facts from NASA.",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      canonical,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow, max-image-preview:large",
    );
    for (const [property, value] of [
      ["og:title", "Orbita — Solar System and Milky Way in 3D"],
      ["og:url", canonical],
      ["og:site_name", "Orbita"],
      ["og:image", `${canonical}og-image.png`],
      ["og:locale", "en_GB"],
    ])
      await expect(
        page.locator(`meta[property="${property}"]`),
      ).toHaveAttribute("content", value);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    const structured = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    expect(structured).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Orbita",
      url: canonical,
      inLanguage: ["en", "pl"],
    });
    await expect(
      page.getByRole("heading", {
        name: "Orbita — Solar System and Milky Way in 3D",
      }),
    ).toBeVisible();
    await expect(page.getByText(/Enable JavaScript/)).toBeVisible();
    expect((await response!.headerValue("x-robots-tag")) || "").not.toMatch(
      /noindex/i,
    );
  } finally {
    await context.close();
  }
});
test("exposes crawlable robots, a canonical-only sitemap and the real preview image", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${canonical}sitemap.xml`);
  expect(await robots.text()).toContain("Allow: /");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toMatch(/xml/);
  const xml = await sitemap.text();
  expect([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])).toEqual([
    canonical,
  ]);
  expect(xml).not.toContain("fallback");
  const image = await request.get("/og-image.png");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toMatch(/image\/png/);
  const png = await image.body();
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});
test("keeps canonical stable while translating metadata with the language preference", async ({
  page,
}) => {
  await page.goto("/?fallback=1");
  const picker = page.getByRole("combobox", { name: "Language / Język" });
  await picker.selectOption("pl");
  await expect(page).toHaveTitle("Orbita — Układ Słoneczny i Droga Mleczna 3D");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Układ Słoneczny i Drogę Mleczną/,
  );
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "pl_PL",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Orbita — Układ Słoneczny i Droga Mleczna 3D",
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Orbita — Układ Słoneczny i Droga Mleczna 3D",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonical,
  );
  await picker.selectOption("en");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "en_GB",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Orbita — Solar System and Milky Way in 3D",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    (await page
      .locator('meta[name="description"]')
      .getAttribute("content")) as string,
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
});
