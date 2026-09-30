// Turns links from videos.json into player IDs and thumbnails.
// Understands youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…, vimeo.com/123456.
import fs from "node:fs";

function parse(url = "") {
  let m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { provider: "youtube", id: m[1], thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
  m = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  if (m) return { provider: "vimeo", id: m[1], thumb: `https://vumbnail.com/${m[1]}.jpg` };
  return null;
}

export default function () {
  const list = JSON.parse(fs.readFileSync("src/_data/videos.json", "utf8"));
  return list.flatMap((v) => {
    const found = parse(v.url);
    if (!found) {
      console.warn(`[videos] link not recognised, skipped: ${v.url}`);
      return [];
    }
    return [{ ...v, ...found }];
  });
}
