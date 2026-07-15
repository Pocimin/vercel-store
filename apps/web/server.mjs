import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("/app/apps/web/dist");
const port = Number(process.env.PORT || 3000);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function safePath(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const candidate = resolve(root, `.${normalize(pathname)}`);
  return candidate === root || candidate.startsWith(`${root}/`) ? candidate : null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let filePath;
  try {
    filePath = safePath(request.url || "/");
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  if (!filePath) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    filePath = join(root, "index.html");
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
      "Content-Type": types[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN"
    });
    if (request.method === "HEAD") response.end();
    else response.end(content);
  } catch {
    response.writeHead(500);
    response.end("Internal server error");
  }
});

server.listen(port, "0.0.0.0", () => console.log(`[web] listening on ${port}`));
