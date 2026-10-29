import type { HtmlTagDescriptor, Plugin } from "vite";
import { seo, siteUrl, socialImage } from "../src/seo.ts";
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc></url>\n</urlset>\n`;
const resources: Record<string, { type: string; body: string }> = {
  "/robots.txt": { type: "text/plain; charset=utf-8", body: robots },
  "/sitemap.xml": { type: "application/xml; charset=utf-8", body: sitemap },
};
export function seoPlugin(): Plugin {
  const name = (key: string, content: string): HtmlTagDescriptor => ({
    tag: "meta",
    attrs: { name: key, content },
  });
  const property = (key: string, content: string): HtmlTagDescriptor => ({
    tag: "meta",
    attrs: { property: key, content },
  });
  return {
    name: "orbita-seo",
    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [
        { tag: "title", children: seo.en.title },
        name("description", seo.en.description),
        name("application-name", "Orbita"),
        name("robots", "index, follow, max-image-preview:large"),
        { tag: "link", attrs: { rel: "canonical", href: siteUrl } },
        property("og:type", "website"),
        property("og:site_name", "Orbita"),
        property("og:url", siteUrl),
        property("og:title", seo.en.title),
        property("og:description", seo.en.description),
        property("og:locale", seo.en.locale),
        property("og:locale:alternate", seo.pl.locale),
        property("og:image", socialImage),
        property("og:image:type", "image/png"),
        property("og:image:width", "1200"),
        property("og:image:height", "630"),
        property("og:image:alt", seo.en.imageAlt),
        name("twitter:card", "summary_large_image"),
        name("twitter:title", seo.en.title),
        name("twitter:description", seo.en.description),
        name("twitter:image", socialImage),
        name("twitter:image:alt", seo.en.imageAlt),
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${siteUrl}#website`,
            name: "Orbita",
            alternateName: "Orbita Solar System",
            url: siteUrl,
            inLanguage: ["en", "pl"],
          }).replace(/</g, "\\u003c"),
        },
      ];
      return tags.map((tag) => ({ ...tag, injectTo: "head" as const }));
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const resource = resources[(req.url || "").split("?")[0]];
        if (!resource) {
          next();
          return;
        }
        res.setHeader("Content-Type", resource.type);
        res.end(resource.body);
      });
    },
    generateBundle() {
      for (const [path, resource] of Object.entries(resources))
        this.emitFile({
          type: "asset",
          fileName: path.slice(1),
          source: resource.body,
        });
    },
  };
}
