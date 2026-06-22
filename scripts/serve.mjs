import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

if (!fs.existsSync(dist)) {
  console.error("Run npm run build first.");
  process.exit(1);
}

http
  .createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = path.join(dist, urlPath);
    if (urlPath.endsWith("/")) file = path.join(file, "index.html");
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, "404.html");
    response.writeHead(fs.existsSync(file) && file.endsWith("404.html") ? 404 : 200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(response);
  })
  .listen(4173, "127.0.0.1", () => console.log("Preview: http://127.0.0.1:4173"));
