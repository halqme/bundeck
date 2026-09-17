import type { JSX as SolidJSX } from "solid-js/h/jsx-runtime";

declare global {
  namespace JSX {
    type Element = SolidJSX.Element;
    interface IntrinsicElements extends SolidJSX.IntrinsicElements {}
    interface IntrinsicAttributes extends SolidJSX.IntrinsicAttributes {}
    interface ElementChildrenAttribute extends SolidJSX.ElementChildrenAttribute {}
  }
}

export {};
