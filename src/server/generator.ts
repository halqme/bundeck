import { HTMLRenderer } from "../template/renderer";
import type { Presentation } from "../types";
import { consoleError } from "../cli/utils";

export class ServerHTMLGenerator {
  private renderer: HTMLRenderer;

  constructor(options: { enableMinify?: boolean; inlineAssets?: boolean } = {}) {
    this.renderer = new HTMLRenderer({
      enableMinify: options.enableMinify,
      inlineAssets: options.inlineAssets,
    });
  }

  async generate(
    presentation: Presentation,
  ): Promise<
    string | { html: string; assets: { mainCss: string; printCss: string; themeCss: string } }
  > {
    const buildResult = await Bun.build({
      entrypoints: ["src/client/runtime-server.ts"],
      target: "browser",
      minify: true,
    });

    if (!buildResult.success || buildResult.outputs.length === 0) {
      consoleError("Failed to build client runtime", JSON.stringify(buildResult.logs));
      throw new Error("Failed to build client runtime");
    }

    const runtimeJs = await buildResult.outputs[0]!.text();
    return this.renderer.generate(presentation, runtimeJs);
  }
}
