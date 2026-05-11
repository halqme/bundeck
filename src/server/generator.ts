import { HTMLRenderer } from "../template/renderer";
import type { Presentation } from "../types";
import { consoleError } from "../cli/utils";

export class ServerHTMLGenerator {
  private renderer: HTMLRenderer;

  constructor(options: { enableMinify?: boolean; inlineAssets?: boolean } = {}) {
    this.renderer = new HTMLRenderer({
      enableMinify: options.enableMinify,
      inlineAssets: options.inlineAssets,
      includePresenterAssets: true,
    });
  }

  async generate(presentation: Presentation): Promise<
    | string
    | {
        html: string;
        assets: {
          mainCss: string;
          printCss: string;
          themeCss: string;
          viewUiCss: string;
          presenterCss: string;
        };
      }
  > {
    const buildResult = await Bun.build({
      entrypoints: ["src/client/runtime-server.ts"],
      target: "browser",
      minify: true,
    });

    if (!buildResult.success || buildResult.outputs.length === 0) {
      const logDetail = buildResult.logs
        .map((log) => (typeof log === "string" ? log : (log.message ?? JSON.stringify(log))))
        .join("; ");
      consoleError("Client runtime build failed", logDetail);
      throw new Error(`Client runtime build failed: ${logDetail}`);
    }

    const runtimeJs = await buildResult.outputs[0]!.text();
    return this.renderer.generate(presentation, runtimeJs);
  }
}
