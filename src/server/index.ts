import { watch } from "fs";
import * as path from "path";
import { parseMarkdown } from "../core/parser";
import { ServerHTMLGenerator } from "./generator";
import { consoleInfo, consoleError, consoleWarn } from "../cli/utils";

export async function startServer(inputPath: string, port: number) {
  const absoluteInputPath = path.resolve(inputPath);
  const inputDir = path.dirname(absoluteInputPath);
  const generator = new ServerHTMLGenerator({ inlineAssets: false });

  // State
  let currentHTML = "";
  // assets kept in memory when serve mode externalizes CSS
  let assetsMemory: {
    mainCss: string;
    printCss: string;
    themeCss: string;
    viewUiCss: string;
    presenterCss: string;
  } | null = null;
  let presentation = await loadPresentation(absoluteInputPath);
  const initial = await generator.generate(presentation);
  if (typeof initial === "string") {
    currentHTML = initial;
    consoleInfo("Generated HTML with inline assets");
  } else {
    currentHTML = initial.html;
    assetsMemory = initial.assets;
  }

  // Clients for HMR
  const clients = new Set<ReadableStreamDefaultController>();

  consoleInfo(`Starting server for ${inputPath} on http://localhost:${port}`);
  consoleInfo(`Presenter Mode on http://localhost:${port}/presenter`);

  // Watch for changes
  const watcher = watch(absoluteInputPath, async (event, filename) => {
    consoleInfo(`File changed: ${filename}. Rebuilding...`);
    try {
      presentation = await loadPresentation(absoluteInputPath);
      const result = await generator.generate(presentation);
      if (typeof result === "string") {
        currentHTML = result;
        assetsMemory = null;
      } else {
        currentHTML = result.html;
        assetsMemory = result.assets;
      }

      // Notify clients
      const closedControllers: ReadableStreamDefaultController[] = [];
      for (const controller of clients) {
        try {
          controller.enqueue("data: reload\n\n");
        } catch (error: any) {
          if (error.code === "ERR_INVALID_STATE") {
            // Controller is already closed, mark for removal
            closedControllers.push(controller);
          } else {
            consoleError("Error notifying client", (error as Error).message);
          }
        }
      }

      // Remove closed controllers
      for (const controller of closedControllers) {
        clients.delete(controller);
      }
    } catch (e) {
      consoleError("Error rebuilding", (e as Error).message);
    }
  });

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // SSE Endpoint
      if (url.pathname === "/_reload") {
        return new Response(
          new ReadableStream({
            start(controller) {
              clients.add(controller);
            },
            cancel() {},
          }),
          {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          },
        );
      }

      // Serve HTML
      if (url.pathname === "/" || url.pathname === "/presenter") {
        return new Response(currentHTML, {
          headers: { "Content-Type": "text/html", "Cache-Control": "no-cache" },
        });
      }

      // Serve in-memory CSS assets for serve mode
      if (url.pathname === "/assets/styles.css") {
        if (assetsMemory?.mainCss) {
          return new Response(assetsMemory.mainCss, { headers: { "Content-Type": "text/css" } });
        }
        consoleWarn("CSS assets not found in memory");
        return new Response("Not Found", { status: 404 });
      }

      if (url.pathname === "/assets/theme.css") {
        if (assetsMemory?.themeCss) {
          return new Response(assetsMemory.themeCss, { headers: { "Content-Type": "text/css" } });
        }
        return new Response("Not Found", { status: 404 });
      }

      if (url.pathname === "/assets/view-ui.css") {
        if (assetsMemory?.viewUiCss) {
          return new Response(assetsMemory.viewUiCss, { headers: { "Content-Type": "text/css" } });
        }
        return new Response("Not Found", { status: 404 });
      }

      if (url.pathname === "/assets/presenter.css") {
        if (assetsMemory?.presenterCss) {
          return new Response(assetsMemory.presenterCss, {
            headers: { "Content-Type": "text/css" },
          });
        }
        return new Response("Not Found", { status: 404 });
      }

      if (url.pathname === "/assets/print.css") {
        if (assetsMemory?.printCss) {
          return new Response(assetsMemory.printCss, { headers: { "Content-Type": "text/css" } });
        }
        return new Response("Not Found", { status: 404 });
      }

      // Static assets (images, etc) relative to markdown file
      // SECURITY: Prevent directory traversal
      const safePath = path
        .normalize(decodeURIComponent(url.pathname))
        .replace(/^(\.\.[/\\])+/, "");
      const filePath = path.join(inputDir, safePath);

      if (!filePath.startsWith(inputDir)) {
        return new Response("Forbidden", { status: 403 });
      }

      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  // Handle cleanup
  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
}

async function loadPresentation(filePath: string) {
  const markdown = await Bun.file(filePath).text();
  return parseMarkdown(markdown);
}
