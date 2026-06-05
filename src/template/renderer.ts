import { Marked } from "marked";
import {
  styledHeadingExtension,
  styledSpanExtension,
  containerExtension,
  styledImageExtension,
} from "../core/extensions";
import { getSlideFontSizeAttribute } from "../core/layout-design";
import { HTMLMinifier } from "../utils/minifier";
import { generateAspectRatioCSSVariables } from "../utils/aspect-ratio";
import type { Presentation, PresentationMeta } from "../types";
import path from "node:path";

import { themes, styles } from "./styles";

// Constants
const DEFAULT_TITLE = "Untitled Presentation";
const DEFAULT_THEME = "default";
const FONT_SIZE_PRESETS = new Set(["xs", "s", "m", "l", "xl"]);

function escapeHTML(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFontSizeClass(fontSize: PresentationMeta["fontSize"]): string {
  if (typeof fontSize !== "string") {
    return "";
  }

  const normalized = fontSize.toLowerCase();
  return FONT_SIZE_PRESETS.has(normalized) ? "font-size-" + normalized : "";
}

export class HTMLRenderer {
  private markedInstance: Marked;
  private minifier: HTMLMinifier;
  private enableMinify: boolean;
  private inlineAssets: boolean;
  private includePresenterAssets: boolean;

  constructor(
    options: {
      enableMinify?: boolean;
      inlineAssets?: boolean;
      includePresenterAssets?: boolean;
    } = {},
  ) {
    this.enableMinify = options.enableMinify ?? false;
    this.inlineAssets = options.inlineAssets ?? true;
    this.includePresenterAssets = options.includePresenterAssets ?? false;
    this.markedInstance = this.createMarkedInstance();
    this.minifier = new HTMLMinifier();
  }

  async generate(
    presentation: Presentation,
    runtimeScriptContent: string,
  ): Promise<
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
    const { slides, meta } = presentation;
    const config = this.extractConfig(meta);

    const assets = await this.loadAssets(config.theme);
    const slidesHtml = this.renderSlides(slides);

    return this.buildHTML(config, assets, slidesHtml, runtimeScriptContent);
  }

  private createMarkedInstance(): Marked {
    const marked = new Marked();
    marked.use({
      extensions: [
        styledHeadingExtension,
        styledSpanExtension,
        containerExtension,
        styledImageExtension,
      ],
      renderer: {
        paragraph(token) {
          const tokens = token.tokens || [];
          const isOnlyImages = tokens.every(
            (t) =>
              t.type === "image" ||
              t.type === "styledImage" ||
              (t.type === "text" && t.raw.trim() === ""),
          );

          const hasImage = tokens.some((t) => t.type === "image" || t.type === "styledImage");

          if (hasImage && isOnlyImages) {
            return this.parser.parseInline(tokens) + "\n";
          }

          return "<p>" + this.parser.parseInline(tokens) + "</p>\n";
        },
      },
    });
    return marked;
  }

  private extractConfig(meta: PresentationMeta): {
    title: string;
    theme: string;
    fontSize: string;
    aspectRatioCSS: Record<string, string>;
  } {
    return {
      title: typeof meta.title === "string" ? meta.title : DEFAULT_TITLE,
      theme: typeof meta.theme === "string" ? meta.theme : DEFAULT_THEME,
      fontSize: getFontSizeClass(meta.fontSize),
      aspectRatioCSS: generateAspectRatioCSSVariables(meta.aspectRatio),
    };
  }

  private resolve = (filepath: string) => path.resolve(path.dirname(Bun.main), filepath);

  private async loadAssets(theme: string) {
    const readFileSafe = async (filepath: string, label: string): Promise<string> => {
      try {
        return await Bun.file(this.resolve(filepath)).text();
      } catch (e) {
        console.warn(
          "Failed to load " + label + " stylesheet (" + filepath + "):",
          (e as Error).message,
        );
        return "";
      }
    };

    const mainCss = await readFileSafe(styles.base, "base");

    const themePath =
      theme in themes && themes[theme as keyof typeof themes]
        ? themes[theme as keyof typeof themes]
        : themes.default;
    const themeUsed = await readFileSafe(themePath, 'theme "' + theme + '"');

    const printCss = await readFileSafe(styles.print, "print");

    const viewUiCss = await readFileSafe(styles.viewUi, "view-ui");

    const presenterCss = this.includePresenterAssets
      ? await readFileSafe(styles.presenter, "presenter")
      : "";

    return {
      mainCss,
      printCss,
      themeUsed,
      viewUiCss,
      presenterCss,
    };
  }

  private renderSlides(slides: Presentation["slides"]): string {
    return slides.map((slide, index) => this.renderSlide(slide, index === 0)).join("\n");
  }

  private renderSlide(slide: Presentation["slides"][0], isFirst: boolean = false): string {
    const contentHtml = this.markedInstance.parser(slide.contentTokens);
    let notesHtml = "";
    if (slide.noteTokens && slide.noteTokens.length > 0) {
      notesHtml =
        '<div class="speaker-notes" hidden>' +
        this.markedInstance.parser(slide.noteTokens) +
        "</div>";
    }

    const contentLength = slide.contentLength ?? 0;
    const fontSizeAttr = getSlideFontSizeAttribute(contentLength);
    const activeClass = isFirst ? " active" : "";

    return (
      '<section class="slide' +
      activeClass +
      '" id="slide-' +
      slide.id +
      '" data-id="' +
      slide.id +
      '" style="' +
      fontSizeAttr +
      '">' +
      contentHtml +
      notesHtml +
      "</section>"
    );
  }

  private buildHTML(
    config: {
      title: string;
      theme: string;
      fontSize: string;
      aspectRatioCSS: Record<string, string>;
    },
    assets: Awaited<ReturnType<typeof this.loadAssets>>,
    slidesHtml: string,
    runtimeScript: string,
  ):
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
      } {
    const processedAssets = this.enableMinify ? this.minifyAssets(assets) : assets;

    if (this.inlineAssets) {
      const html = this.buildInlineHTML(config, processedAssets, slidesHtml, runtimeScript);
      return this.processFinalHTML(html);
    }

    return this.buildExternalHTML(config, processedAssets, slidesHtml, runtimeScript);
  }

  private minifyAssets(assets: Awaited<ReturnType<typeof this.loadAssets>>) {
    return {
      themeUsed: this.minifier.minifyCSS(assets.themeUsed),
      mainCss: this.minifier.minifyCSS(assets.mainCss),
      printCss: this.minifier.minifyCSS(assets.printCss),
      viewUiCss: this.minifier.minifyCSS(assets.viewUiCss),
      presenterCss: this.minifier.minifyCSS(assets.presenterCss),
    };
  }

  private buildInlineHTML(
    config: {
      title: string;
      theme: string;
      fontSize: string;
      aspectRatioCSS: Record<string, string>;
    },
    assets: Awaited<ReturnType<typeof this.loadAssets>>,
    slidesHtml: string,
    runtimeScript: string,
  ): string {
    const aspectRatioStyles = Object.entries(config.aspectRatioCSS)
      .map(([property, value]) => property + ": " + value + ";")
      .join(" ");

    const inlineStyles =
      ":root { " +
      aspectRatioStyles +
      " }" +
      assets.themeUsed +
      assets.mainCss +
      assets.viewUiCss +
      assets.presenterCss +
      assets.printCss;

    return this.createHTMLTemplate({
      config,
      headContent: "<style>" + inlineStyles + "</style>",
      bodyContent: this.buildBodyContent(slidesHtml, runtimeScript),
    });
  }

  private buildExternalHTML(
    config: {
      title: string;
      theme: string;
      fontSize: string;
      aspectRatioCSS: Record<string, string>;
    },
    assets: Awaited<ReturnType<typeof this.loadAssets>>,
    slidesHtml: string,
    runtimeScript: string,
  ) {
    const aspectRatioStyles = Object.entries(config.aspectRatioCSS)
      .map(([property, value]) => property + ": " + value + ";")
      .join(" ");

    const presenterLink = this.includePresenterAssets
      ? '<link rel="stylesheet" href="/assets/presenter.css">'
      : "";

    const headContent =
      "<style>:root { " +
      aspectRatioStyles +
      ' }</style><link rel="stylesheet" href="/assets/theme.css"><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/view-ui.css">' +
      presenterLink +
      '<link rel="stylesheet" href="/assets/print.css" media="print">';

    const html = this.createHTMLTemplate({
      config,
      headContent,
      bodyContent: this.buildBodyContent(slidesHtml, runtimeScript),
    });

    const processedHTML = this.processFinalHTML(html);

    return {
      html: processedHTML,
      assets: {
        mainCss: assets.mainCss,
        printCss: assets.printCss,
        themeCss: assets.themeUsed,
        viewUiCss: assets.viewUiCss,
        presenterCss: assets.presenterCss,
      },
    };
  }

  private createHTMLTemplate({
    config,
    headContent,
    bodyContent,
  }: {
    config: {
      title: string;
      theme: string;
      fontSize: string;
      aspectRatioCSS: Record<string, string>;
    };
    headContent: string;
    bodyContent: string;
  }): string {
    const bodyClass = config.fontSize ? ' class="' + config.fontSize + '"' : "";

    return (
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' +
      escapeHTML(config.title) +
      "</title>" +
      headContent +
      "</head><body" +
      bodyClass +
      ">" +
      bodyContent +
      "</body></html>"
    );
  }

  private buildBodyContent(slidesHtml: string, runtimeScript: string): string {
    return (
      '<div class="slide-viewport"><div id="slide-container">' +
      slidesHtml +
      "</div></div><script>" +
      runtimeScript +
      "</script>"
    );
  }

  private processFinalHTML(html: string): string {
    if (this.enableMinify) {
      return this.minifier.minify(html);
    }
    return this.minifier.removeComments(html);
  }
}
