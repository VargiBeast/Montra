import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultOutputDirectory = join(projectRoot, "dist");
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function respond(response, status, message) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(message);
}

export function createProductionServer(outputDirectory = defaultOutputDirectory) {
  const root = resolve(outputDirectory);
  const indexFile = join(root, "index.html");

  return createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      respond(response, 405, "Method not allowed");
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? "/", "http://replit.local").pathname);
    } catch {
      respond(response, 400, "Invalid request path");
      return;
    }
    if (pathname.includes("\0")) {
      respond(response, 400, "Invalid request path");
      return;
    }

    let requestedFile = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (requestedFile !== root && !requestedFile.startsWith(`${root}${sep}`)) {
      respond(response, 403, "Forbidden");
      return;
    }

    try {
      if (!(await stat(requestedFile)).isFile()) requestedFile = "";
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") {
        console.error("Could not inspect a production asset.", error);
        respond(response, 500, "Could not read this page");
        return;
      }
      requestedFile = "";
    }

    if (!requestedFile) {
      if (extname(pathname)) {
        respond(response, 404, "Not found");
        return;
      }
      requestedFile = indexFile;
    }

    try {
      const body = await readFile(requestedFile);
      const pathnameForCache = pathname === "/" ? "/index.html" : pathname;
      const immutableAsset = /^\/assets\/.+-[\w-]{8,}\./.test(pathnameForCache);
      response.writeHead(200, {
        "Content-Type": contentTypes.get(extname(requestedFile).toLowerCase()) ?? "application/octet-stream",
        "Cache-Control": immutableAsset ? "public, max-age=31536000, immutable" : "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      console.error("Could not serve a production asset.", error);
      respond(response, 500, "Could not read this page");
    }
  });
}

function getPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}

const entryPoint = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPoint === fileURLToPath(import.meta.url)) {
  const port = getPort(process.env.PORT ?? "5000");
  const server = createProductionServer();
  server.on("error", (error) => {
    console.error("Production server failed to start.", error);
    process.exit(1);
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`Saldo production server listening on 0.0.0.0:${port}`);
  });
}