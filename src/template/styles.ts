// @ts-ignore
import defaultTheme from "../styles/themes/default.css" with { type: "file" };
// @ts-ignore
import darkTheme from "../styles/themes/dark.css" with { type: "file" };

export const themes = {
  default: defaultTheme as string,
  dark: darkTheme as string,
};

// @ts-ignore
import base from "../styles/base.css" with { type: "file" };
// @ts-ignore
import print from "../styles/print.css" with { type: "file" };
// @ts-ignore
import viewUi from "../styles/view-ui.css" with { type: "file" };

export const styles = {
  base: base as string,
  print: print as string,
  viewUi: viewUi as string,
};
