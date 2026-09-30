// Festivals & Awards section = festivals from every project + extra entries from festivals.json.
// If both are empty, the section is hidden.
import fs from "node:fs";

export default function () {
  const projects = JSON.parse(fs.readFileSync("src/_data/projects.json", "utf8"));
  const extra = JSON.parse(fs.readFileSync("src/_data/festivals.json", "utf8"));
  const fromProjects = projects.flatMap((p) =>
    (p.festivals || []).map((f) => ({ ...f, projectSlug: p.slug, projectTitle: p.title }))
  );
  return [...fromProjects, ...extra].sort((a, b) => b.year - a.year);
}
