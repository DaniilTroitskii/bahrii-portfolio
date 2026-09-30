// Generates placeholder images (and a placeholder résumé PDF) for every project in projects.json.
// Existing files are never overwritten, so real photos are safe.
// Usage: npm run placeholders
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const IMG = "src/assets/img";
const projects = JSON.parse(fs.readFileSync("src/_data/projects.json", "utf8"));
const site = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8"));

const palettes = [
  ["#1c2530", "#3a2a22"], ["#2b2419", "#10161c"], ["#1e1430", "#301a24"],
  ["#262017", "#2c1d12"], ["#16201d", "#2a2220"], ["#1a2233", "#2a2016"],
];

function svg(w, h, [c1, c2], label, sub, y = 0.5) {
  const fs1 = Math.round(w / 22);
  const fs2 = Math.round(w / 60);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <radialGradient id="v" cx="0.5" cy="0.5" r="0.75"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0e0e10"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#v)"/>
  <g fill="none" stroke="#ecebe8" stroke-opacity="0.12">
    <line x1="${w / 3}" y1="0" x2="${w / 3}" y2="${h}"/><line x1="${(2 * w) / 3}" y1="0" x2="${(2 * w) / 3}" y2="${h}"/>
    <line x1="0" y1="${h / 3}" x2="${w}" y2="${h / 3}"/><line x1="0" y1="${(2 * h) / 3}" x2="${w}" y2="${(2 * h) / 3}"/>
  </g>
  <text x="50%" y="${h * y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fs1}" letter-spacing="${fs1 / 8}" fill="#ecebe8" fill-opacity="0.85">${label}</text>
  <text x="50%" y="${h * y + fs1 * 1.1}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fs2}" letter-spacing="${fs2 / 4}" fill="#e3a857">${sub}</text>
</svg>`;
}

async function make(rel, w, h, palette, label, sub, y) {
  const out = path.join(IMG, rel);
  if (fs.existsSync(out)) return;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg(w, h, palette, label, sub, y))).jpeg({ quality: 82 }).toFile(out);
  console.log("created", out);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

await make(site.reel.poster, 2400, 1350, ["#1d2530", "#2e2016"], "SHOWREEL", "PLACEHOLDER — REPLACE WITH A REAL FRAME", 0.3);
await make(site.portrait, 1200, 1500, ["#232326", "#2a2119"], "PORTRAIT", "PLACEHOLDER — 4:5");

for (const [i, p] of projects.entries()) {
  const pal = palettes[i % palettes.length];
  const name = esc(p.title.original.toUpperCase());
  const [sw, sh] = p.aspect === "2.39" ? [2400, 1004] : [2400, 1350];
  await make(p.poster, 1920, 1080, pal, name, "POSTER / STILL — PLACEHOLDER", 0.74);
  for (const [n, s] of p.stills.entries()) {
    await make(typeof s === "string" ? s : s.src, sw, sh, [pal[1], pal[0]], name, `STILL ${n + 1} — PLACEHOLDER`);
  }
}

// Photo gallery: only when the folder has no photos yet.
const photoDir = path.join(IMG, "photos");
const hasPhotos = fs.existsSync(photoDir) && fs.readdirSync(photoDir).some((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (!hasPhotos) {
  const sizes = [[1800, 1200], [1200, 1800], [1600, 2000], [1920, 1080], [1800, 1200], [1200, 1500], [1920, 1080], [1200, 1800], [1800, 1200]];
  for (const [i, [w, h]] of sizes.entries()) {
    const n = String(i + 1).padStart(2, "0");
    await make(`photos/${n}.jpg`, w, h, palettes[i % palettes.length], `PHOTO ${n}`, "PLACEHOLDER");
  }
}

// Minimal one-page PDF so the résumé button works before the real file is added.
const pdfOut = "src/assets/resume/resume-en.pdf";
if (!fs.existsSync(pdfOut)) {
  fs.mkdirSync(path.dirname(pdfOut), { recursive: true });
  const stream = "BT /F1 24 Tf 72 720 Td (Yevhenii Bahrii - Resume) Tj 0 -36 Td /F1 12 Tf (TODO: replace this file with the real resume PDF.) Tj ET";
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  fs.writeFileSync(pdfOut, pdf, "latin1");
  console.log("created", pdfOut);
}
