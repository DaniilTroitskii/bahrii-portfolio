// Uses resume-<lang>.pdf when it exists in src/assets/resume/, otherwise resume-en.pdf.
import fs from "node:fs";

export default function () {
  const site = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8"));
  return Object.fromEntries(
    site.languages.map(({ code }) => [
      code,
      fs.existsSync(`src/assets/resume/resume-${code}.pdf`)
        ? `/assets/resume/resume-${code}.pdf`
        : "/assets/resume/resume-en.pdf",
    ])
  );
}
