// Resizes every photo in src/assets/img/ into WebP + JPEG at several widths.
// Templates look images up by their path relative to src/assets/img/, e.g. "projects/quiet-hours/poster.jpg".
import fs from "node:fs";
import path from "node:path";
import Image from "@11ty/eleventy-img";

const ROOT = "src/assets/img";
const EXT = /\.(jpe?g|png|webp|avif|tiff?)$/i;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full) : EXT.test(d.name) ? [full] : [];
  });
}

export default async function () {
  const result = {};
  for (const file of walk(ROOT)) {
    const key = path.relative(ROOT, file).split(path.sep).join("/");
    result[key] = await Image(file, {
      widths: [480, 960, 1600, 2400],
      formats: ["webp", "jpeg"],
      outputDir: "_site/img/",
      urlPath: "/img/",
      sharpJpegOptions: { quality: 80, progressive: true },
      sharpWebpOptions: { quality: 78 },
    });
  }
  return result;
}
