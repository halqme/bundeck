import { HTMLRenderer } from "../template/renderer.js";
import { loadRuntimeScript } from "../utils/runtime.js";
import type { Presentation } from "../types/index.js";

export class ServerHTMLGenerator {
  private renderer: HTMLRenderer;
  private enableMinify: boolean;

  constructor(options: { enableMinify?: boolean; inlineAssets?: boolean } = {}) {
    this.enableMinify = options.enableMinify ?? false;
    this.renderer = new HTMLRenderer({
      enableMinify: this.enableMinify,
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
    const runtimeJs = await loadRuntimeScript("server", { minify: this.enableMinify });
    return this.renderer.generate(presentation, runtimeJs);
  }
}
