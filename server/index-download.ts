import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const files: Record<string, { filePath: string; type: string }> = {
  "/mysql-schema.sql": { filePath: path.join(root, "mysql-schema.sql"), type: "text/plain; charset=utf-8" },
  "/seamlier-mysql.zip": { filePath: path.join(root, "seamlier-mysql.zip"), type: "application/zip" },
};

const server = http.createServer((req, res) => {
  const file = files[req.url || ""];
  if (file && fs.existsSync(file.filePath)) {
    const stat = fs.statSync(file.filePath);
    res.writeHead(200, {
      "Content-Type": file.type,
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="${path.basename(file.filePath)}"`,
    });
    fs.createReadStream(file.filePath).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<html><body style="font-family:sans-serif;padding:40px">
      <h2>SEAMLIER - Fichiers de déploiement</h2>
      <ul style="font-size:18px;line-height:2">
        <li><a href="/mysql-schema.sql">📄 mysql-schema.sql</a></li>
        <li><a href="/seamlier-mysql.zip">📦 seamlier-mysql.zip</a></li>
      </ul></body></html>`);
  }
});

server.listen(5000, "0.0.0.0", () => {
  console.log("Download server running on port 5000");
});
