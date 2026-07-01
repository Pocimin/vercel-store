import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const htmlPath = path.join(process.cwd(), "public", "bio", "index.html");
  let html = await readFile(htmlPath, "utf8");

  if (!html.includes("<base ")) {
    html = html.replace("<head>", '<head>\n  <base href="/bio/">');
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
