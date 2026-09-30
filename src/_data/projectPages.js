// One page per language × project. Built from projects.json — no need to edit this file.
import fs from "node:fs";

export default function () {
  const projects = JSON.parse(fs.readFileSync("src/_data/projects.json", "utf8"));
  const site = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8"));
  return site.languages.flatMap(({ code }) =>
    projects.map((project, i) => ({
      lang: code,
      project,
      next: projects[(i + 1) % projects.length],
    }))
  );
}
