import { Get } from "./check.js";

/**
 * Creates an HTML element with specified tag and content
 * @template K - The HTML element tag name type
 * @param {K} tagName - The HTML tag name for the element
 * @param {HTMLAttributes} attributes - The attributes to be added to the element
 * @param {string | HTMLElement} [appendTo] - Optional ID or element to append to
 * @returns {HTMLElementTagNameMap[K]} The created HTML element
 */
export function buildElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes: HTMLAttributes,
  appendTo?: string | HTMLElement,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  setElementAttributes(element, attributes);
  if (appendTo) {
    const target = typeof appendTo === "string" ? Get.elementByID(appendTo) : appendTo;
    if (!(target instanceof HTMLElement)) {
      console.error("The appendTo for target is not an HTML element.", target);
      return element;
    }
    target.appendChild(element);
  }
  return element;
}

/**
 * Creates an SVG element with specified tag and content
 * @template K - The SVG element tag name type
 * @param {K} tagName - The SVG tag name for the element
 * @param {SVGAttributes} attributes - The attributes to be added to the element
 * @param {string | HTMLElement | SVGElement} appendTo - ID or element to append to
 * @returns {SVGElementTagNameMap[K]} The created SVG element
 */
export function buildSVG<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes: SVGAttributes,
  appendTo: string | HTMLElement | SVGElement,
): SVGElementTagNameMap[K] {
  const svgNS = "http://www.w3.org/2000/svg";
  const element = document.createElementNS(svgNS, tagName);
  setElementAttributes(element, attributes);
  if (appendTo) {
    const target = typeof appendTo === "string" ? Get.elementByID(appendTo) : appendTo;
    if (!(target instanceof HTMLElement) && !(target instanceof SVGElement)) {
      console.error("The appendTo target is not an HTML or SVG element.", target);
      return element;
    }
    target.appendChild(element);
  }
  return element;
}

/**
 * Sets attributes on an HTML or SVG element
 * @param {HTMLElement|SVGElement} element - The element to set attributes on
 * @param {HTMLAttributes|SVGAttributes} attributes - An object containing attribute key-value pairs
 */
function setElementAttributes(element: HTMLElement | SVGElement, attributes: HTMLAttributes | SVGAttributes) {
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined) continue;

    // Handle classList separately
    if (key === "classList" && Array.isArray(value)) {
      element.classList.add(...value);
      continue;
    }

    // Handle data attributes
    if (key === "data" && typeof value === "object" && value !== null) {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.setAttribute(`data-${dataKey}`, String(dataValue));
      }
      continue;
    }

    // Handle event listeners and direct properties
    if (key.startsWith("on") || key === "innerText" || key === "innerHTML" || key === "textContent") {
      (element as any)[key] = value;
      continue;
    }

    // Handle all other attributes via setAttribute
    element.setAttribute(key, String(value));
  }
}

interface HTMLAttributes {
  id?: string;
  classList?: string[];
  innerText?: string;
  innerHTML?: string;
  innerHeight?: number;
  innerWidth?: number;
  textContent?: string;
  src?: string;
  href?: string;
  title?: string;
  alt?: string;
  style?: string;
  tabIndex?: number;
  target?: string;
  type?: string;
  name?: string;
  value?: string | string[];
  checked?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  for?: string;
  accept?: string;
  autocomplete?: string;
  autofocus?: boolean;
  cols?: number;
  rows?: number;
  max?: string | number;
  min?: string | number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  step?: string | number;
  width?: string | number;
  height?: string | number;
  size?: number;
  multiple?: boolean;
  selected?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-hidden"?: boolean;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-labelledby"?: string;
  "aria-live"?: "assertive" | "off" | "polite";
  lang?: string;
  draggable?: boolean;
  contenteditable?: boolean;
  hidden?: boolean;
  spellcheck?: boolean;
  rel?: string;
  role?: string;
  data?: Record<string, string>;
  onclick?: (event: MouseEvent) => void;
  onmouseover?: (event: MouseEvent) => void;
  onmouseout?: (event: MouseEvent) => void;
  onchange?: (event: Event) => void;
  onsubmit?: (event: Event) => void;
  onkeydown?: (event: KeyboardEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
  onfocus?: (event: FocusEvent) => void;
  onblur?: (event: FocusEvent) => void;
  oninput?: (event: Event) => void;
  onload?: (event: Event) => void;
  onerror?: (event: Event) => void;
  onreset?: (event: Event) => void;
  ondragstart?: (event: DragEvent) => void;
  ondragover?: (event: DragEvent) => void;
  ondrop?: (event: DragEvent) => void;
  oncontextmenu?: (event: MouseEvent) => void;
}

interface SVGAttributes {
  id?: string;
  classList?: string[];
  textContent?: string;
  style?: string;
  "font-size"?: string | number;
  "font-weight"?: string | number;
  "font-family"?: string;
  "font-style"?: "normal" | "italic" | "oblique";
  "text-anchor"?: "start" | "middle" | "end";
  "dominant-baseline"?:
    | "auto"
    | "middle"
    | "hanging"
    | "mathematical"
    | "central"
    | "text-before-edge"
    | "text-after-edge";
  "letter-spacing"?: string | number;
  "word-spacing"?: string | number;
  "text-decoration"?: string;
  "text-rendering"?: "auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision";
  "writing-mode"?: "lr-tb" | "rl-tb" | "tb-rl" | "lr" | "rl" | "tb";
  "text-length"?: string | number;
  "length-adjust"?: "spacing" | "spacingAndGlyphs";
  fill?: string;
  "fill-rule"?: string;
  "clip-rule"?: string;
  "fill-opacity"?: string | number;
  stroke?: string;
  "stroke-width"?: string | number;
  "stroke-opacity"?: string | number;
  opacity?: string | number;
  x?: string | number;
  y?: string | number;
  cx?: string | number;
  cy?: string | number;
  r?: string | number;
  rx?: string | number;
  ry?: string | number;
  d?: string;
  points?: string;
  width?: string | number;
  height?: string | number;
  viewBox?: string;
  preserveAspectRatio?: string;
  transform?: string;
  xlinkHref?: string;
  pathLength?: string | number;
  strokeDasharray?: string;
  strokeDashoffset?: string | number;
  "stroke-linecap"?: "butt" | "round" | "square";
  "stroke-linejoin"?: "miter" | "round" | "bevel";
  "stroke-miterlimit"?: string | number;
  "alignment-baseline"?:
    | "auto"
    | "baseline"
    | "before-edge"
    | "text-before-edge"
    | "middle"
    | "central"
    | "after-edge"
    | "text-after-edge"
    | "ideographic"
    | "alphabetic"
    | "hanging"
    | "mathematical";
  "clip-path"?: string;
  cursor?: string;
  display?: string;
  filter?: string;
  vectorEffect?: string;
  markerStart?: string;
  markerMid?: string;
  markerEnd?: string;
  tabIndex?: number;
  role?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-hidden"?: boolean;
  data?: Record<string, string>;
  onclick?: (event: MouseEvent) => void;
  onmouseover?: (event: MouseEvent) => void;
  onmouseout?: (event: MouseEvent) => void;
  onmouseenter?: (event: MouseEvent) => void;
  onmouseleave?: (event: MouseEvent) => void;
  onload?: (event: Event) => void;
  onerror?: (event: Event) => void;
}
