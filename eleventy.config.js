import fs from "node:fs";
import { HtmlBasePlugin } from "@11ty/eleventy";

const site = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8"));

// Absolute site address for canonical, hreflang, Open Graph and sitemap.
// GitHub Actions passes SITE_URL, Netlify passes URL; otherwise site.json is used.
const SITE_URL = (process.env.SITE_URL || process.env.URL || site.url).replace(/\/+$/, "");

const PATH_PREFIX = process.env.PATH_PREFIX || "/";

const escapeAttr = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function (eleventyConfig) {
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });

  // Adds pathPrefix to every root-relative link, image and stylesheet in the HTML
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addGlobalData("pathPrefix", PATH_PREFIX);

  eleventyConfig.addPassthroughCopy({
    "src/assets/css": "assets/css",
    "src/assets/js": "assets/js",
    "src/assets/resume": "assets/resume",
    "src/assets/video": "assets/video",
    "src/assets/favicon.svg": "favicon.svg",
  });
  eleventyConfig.addWatchTarget("src/assets/");

  // Pick the value for a language from {en, ru, uk, es}; fall back to English.
  eleventyConfig.addFilter("tr", (value, lang) => {
    if (value == null) return "";
    if (typeof value !== "object" || Array.isArray(value)) return value;
    return value[lang] ?? value.en ?? "";
  });

  // Film titles stay original unless a translation is given for this language.
  eleventyConfig.addFilter("filmTitle", (title, lang) =>
    typeof title === "string" ? title : title[lang] || title.original
  );

  // "Still {n} from {title}" + {n: 2, title: "…"}
  eleventyConfig.addFilter("fmt", (str, vars = {}) =>
    String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""))
  );

  // /ru/work/slug/ -> /es/work/slug/
  eleventyConfig.addFilter("swapLang", (url, lang) => url.replace(/^\/[a-z]{2}\//, `/${lang}/`));

  eleventyConfig.addFilter("absUrl", (url) => SITE_URL + url);

  // Responsive <picture> from metadata prepared in _data/images.js
  eleventyConfig.addFilter("picture", (meta, alt = "", sizes = "100vw", eager = false) => {
    if (!meta) {
      console.warn("[picture] image not found — check the path in projects.json / site.json");
      return `<div class="img-missing" role="img" aria-label="${escapeAttr(alt)}"></div>`;
    }
    const jpeg = meta.jpeg;
    const largest = jpeg[jpeg.length - 1];
    const fallback = jpeg[Math.min(1, jpeg.length - 1)];
    const webp = meta.webp.map((e) => e.srcset).join(", ");
    const loading = eager ? `loading="eager" fetchpriority="high"` : `loading="lazy"`;
    return (
      `<picture><source type="image/webp" srcset="${webp}" sizes="${sizes}">` +
      `<img src="${fallback.url}" srcset="${jpeg.map((e) => e.srcset).join(", ")}" sizes="${sizes}" ` +
      `width="${largest.width}" height="${largest.height}" alt="${escapeAttr(alt)}" ${loading} decoding="async"></picture>`
    );
  });

  // Absolute URL of a ~1600px JPEG for og:image
  eleventyConfig.addFilter("ogImage", (meta) => {
    if (!meta) return "";
    const jpeg = meta.jpeg;
    const pick = jpeg.find((e) => e.width >= 1200) || jpeg[jpeg.length - 1];
    return SITE_URL + pick.url;
  });

  // For the photo lightbox: all WebP sizes, and the largest JPEG as a plain link
  eleventyConfig.addFilter("srcsetWebp", (meta) => (meta ? meta.webp.map((e) => e.srcset).join(", ") : ""));
  eleventyConfig.addFilter("largestJpeg", (meta) => (meta ? meta.jpeg[meta.jpeg.length - 1].url : ""));

  eleventyConfig.addFilter("langCodes", (langs) => langs.map((l) => l.code));

  eleventyConfig.addGlobalData("buildYear", new Date().getFullYear());

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    // "/repo-name/" when the site lives in a GitHub Pages sub-folder
    pathPrefix: PATH_PREFIX,
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
  };
}
