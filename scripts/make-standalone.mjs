import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
const htmlPath = join(distDir, "index.html");
let html = readFileSync(htmlPath, "utf8");

const cssMatch = html.match(/<link rel="stylesheet" crossorigin href="(.+?)">/);
if (cssMatch) {
  const css = readFileSync(join(distDir, cssMatch[1]), "utf8");
  html = html.replace(cssMatch[0], () => `<style>\n${css}\n</style>`);
}

const jsMatch = html.match(/<script type="module" crossorigin src="(.+?)"><\/script>/);
if (jsMatch) {
  let js = readFileSync(join(distDir, jsMatch[1]), "utf8");
  const logoPath = join(distDir, "zhiboxing-logo.png");
  try {
    const logoData = readFileSync(logoPath).toString("base64");
    js = js.replaceAll("./zhiboxing-logo.png", `data:image/png;base64,${logoData}`);
  } catch {
    // Keep the relative URL if the optional public logo is not present.
  }
  const loginVisualPath = join(distDir, "login-visual.svg");
  try {
    const loginVisualData = readFileSync(loginVisualPath).toString("base64");
    js = js.replaceAll("./login-visual.svg", `data:image/svg+xml;base64,${loginVisualData}`);
  } catch {
    // Keep the relative URL if the optional login visual is not present.
  }
  const inlineScript = `<script>\n${js}\n</script>`;
  html = html.replace(jsMatch[0], "");
  html = html.replace("</body>", () => `    ${inlineScript}\n  </body>`);
}

writeFileSync(htmlPath, html);
writeFileSync(join(distDir, "zhiboxing-merchant-brand-service-prototype.html"), html);

const adminHtml = html.replace(
  "<div id=\"root\"></div>",
  "<script>if (!location.search && !location.hash) location.hash = 'admin';</script><div id=\"root\"></div>",
);
writeFileSync(join(distDir, "zhiboxing-platform-admin-prototype.html"), adminHtml);
