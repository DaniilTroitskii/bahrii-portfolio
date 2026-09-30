// Every image in src/assets/img/photos/ appears in the Photo section, sorted by file name.
// Captions (optional) come from photoCaptions.json.
import fs from "node:fs";

const DIR = "src/assets/img/photos";

export default function () {
  if (!fs.existsSync(DIR)) return [];
  const captions = JSON.parse(fs.readFileSync("src/_data/photoCaptions.json", "utf8"));
  return fs
    .readdirSync(DIR)
    .filter((f) => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => ({ key: `photos/${file}`, caption: captions[file] || null }));
}
