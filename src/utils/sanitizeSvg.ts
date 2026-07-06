/**
 * Strict SVG sanitizer (no external dependencies).
 *
 * SVG markup can carry active content (<script>, on*-handlers, <foreignObject>
 * with HTML, external/javascript: references). The rest of the editor blocks
 * SVG entirely for that reason. This module allows inline SVG back in, but only
 * after stripping everything that could execute code or leak requests:
 *   - only a fixed allowlist of shape/structure/gradient/text/filter tags
 *   - no event handler attributes (on*)
 *   - href/xlink:href limited to local fragments (#id)
 *   - no javascript:/vbscript:/data:text/html attribute values
 *   - no dangerous style() values (url(), expression(), @import, ...)
 */

/** SVG element tags that are safe to keep. Anything else is removed. */
const ALLOWED_SVG_TAGS = new Set([
    "svg",
    "g",
    "defs",
    "symbol",
    "use",
    "title",
    "desc",
    // shapes
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    // text
    "text",
    "tspan",
    "textpath",
    // gradients / paint servers
    "lineargradient",
    "radialgradient",
    "stop",
    "pattern",
    // clipping / masking
    "clippath",
    "mask",
    "marker",
    // filters (excluding feImage, which can reference external resources)
    "filter",
    "fegaussianblur",
    "feoffset",
    "feblend",
    "feflood",
    "fecomposite",
    "femerge",
    "femergenode",
    "fecolormatrix",
    "fedropshadow",
    "femorphology",
    "fedisplacementmap",
    "feturbulence",
    "fecomponenttransfer",
    "fefunca",
    "fefuncr",
    "fefuncg",
    "fefuncb",
    "fetile",
    "fespecularlighting",
    "fediffuselighting",
    "fedistantlight",
    "fepointlight",
    "fespotlight",
]);

/** True when a style value contains a known CSS injection vector. */
function hasDangerousStyle(value: string): boolean {
    return /expression\s*\(|url\s*\(|@import|javascript:|vbscript:|-moz-binding/i.test(
        value,
    );
}

/** Strip dangerous attributes from an SVG element in place. */
function cleanSvgAttributes(el: Element): void {
    // Collect first: removing while iterating el.attributes mutates the list.
    const toRemove: Attr[] = [];

    for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        const name = attr.name.toLowerCase();
        const value = attr.value;

        // Event handlers
        if (name.startsWith("on")) {
            toRemove.push(attr);
            continue;
        }

        // href / xlink:href: only allow local fragment references (#id).
        // External and javascript: targets are dropped.
        if (name === "href" || name.endsWith(":href")) {
            if (!value.trim().startsWith("#")) {
                toRemove.push(attr);
            }
            continue;
        }

        // Inline styles with injection vectors
        if (name === "style" && hasDangerousStyle(value)) {
            toRemove.push(attr);
            continue;
        }

        // Any attribute value carrying a dangerous scheme
        const normalized = value.toLowerCase().replace(/[\x00-\x1f\x7f\s]/g, "");
        if (
            normalized.includes("javascript:") ||
            normalized.includes("vbscript:") ||
            normalized.includes("data:text/html")
        ) {
            toRemove.push(attr);
        }
    }

    // removeAttributeNode is namespace-safe (handles xlink:href correctly).
    toRemove.forEach((attr) => el.removeAttributeNode(attr));
}

/** Recursively remove disallowed elements and clean attributes. */
function sanitizeSvgNode(el: Element): void {
    const toRemove: Element[] = [];

    Array.from(el.children).forEach((child) => {
        const tag = child.tagName.toLowerCase();
        if (!ALLOWED_SVG_TAGS.has(tag)) {
            toRemove.push(child);
            return;
        }
        sanitizeSvgNode(child);
    });

    toRemove.forEach((child) => child.remove());
    cleanSvgAttributes(el);
}

/**
 * Sanitize an SVG markup string.
 *
 * @param input - Raw SVG source (must contain a single root <svg>)
 * @returns Sanitized SVG markup, or "" when the input is not a valid SVG.
 */
export function sanitizeSvg(input: string): string {
    if (!input || typeof input !== "string") return "";
    if (typeof DOMParser === "undefined") return "";

    const doc = new DOMParser().parseFromString(input.trim(), "image/svg+xml");

    // A parse error yields a <parsererror> element instead of usable SVG.
    if (doc.getElementsByTagName("parsererror").length > 0) return "";

    const svg = doc.querySelector("svg");
    if (!svg) return "";

    sanitizeSvgNode(svg);

    // Guarantee the namespace so the result renders when embedded in HTML.
    if (!svg.getAttribute("xmlns")) {
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    return svg.outerHTML;
}

/**
 * Sanitize SVG markup and build a live <svg> element ready to embed in the
 * editor's HTML DOM. The element is marked non-editable and tagged with the
 * `rte-svg` class so it behaves as an atomic, clickable block.
 *
 * @returns The svg element, or null when the markup is invalid/unsafe.
 */
export function createSvgElementFromMarkup(
    markup: string,
): SVGSVGElement | null {
    const clean = sanitizeSvg(markup);
    if (!clean) return null;

    // Parse in HTML context so the element lands in the SVG namespace and can
    // be inserted directly into a contentEditable region.
    const tmp = document.createElement("div");
    tmp.innerHTML = clean;
    const svg = tmp.querySelector("svg");
    if (!svg) return null;

    svg.classList.add("rte-svg");
    svg.setAttribute("contenteditable", "false");
    return svg as SVGSVGElement;
}
