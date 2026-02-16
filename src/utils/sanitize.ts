/**
 * Lightweight HTML sanitizer (no external dependencies).
 *
 * Uses an allowlist approach to strip dangerous elements and attributes
 * from pasted/imported HTML before it enters the editor.
 */

/** Tags that are always removed (including their content). */
const REMOVE_TAGS = new Set([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "applet",
    "form",
    "input",
    "textarea",
    "select",
    "button",
    "noscript",
    "meta",
    "link",
    "base",
    "svg",
    "math",
    "template",
    "details",
    "video",
    "audio",
    "marquee",
]);

/** Attributes that are always removed (event handlers, dangerous data-* attrs). */
const REMOVE_ATTRS_PATTERN = /^on|^data-(?!(attachment-id|placeholder)$)/i;

/** Specific dangerous attribute names. */
const REMOVE_ATTRS = new Set([
    "srcdoc",
    "formaction",
    "xlink:href",
    "ping",
]);

/** Allowed URL schemes for href/src attributes. */
const ALLOWED_SCHEMES = /^(https?:|mailto:|tel:|#|\/(?!\/))/i;

/**
 * Check if a URL is safe to set as href/src.
 * Blocks javascript:, data:, vbscript:, and unknown schemes.
 * Strips control characters before checking.
 */
export function isUrlSafe(url: string): boolean {
    if (!url) return false;
    // Strip control characters and whitespace that could obfuscate schemes
    const cleaned = url.trim().replace(/[\x00-\x1f\x7f]/g, "");
    if (!cleaned) return false;
    // Block protocol-relative URLs (//evil.com)
    if (cleaned.startsWith("//")) return false;
    // Must match an allowed scheme or be a relative path
    return ALLOWED_SCHEMES.test(cleaned);
}

/**
 * Sanitize an HTML string by stripping dangerous tags and attributes.
 *
 * @param html - Raw HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
    // Use the browser's DOMParser to parse the HTML safely
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    sanitizeNode(doc.body);

    return doc.body.innerHTML;
}

/** Recursively sanitize a DOM node. */
function sanitizeNode(node: Node): void {
    const childrenToRemove: Node[] = [];

    node.childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as Element;
            const tag = el.tagName.toLowerCase();

            // Remove dangerous tags entirely
            if (REMOVE_TAGS.has(tag)) {
                childrenToRemove.push(child);
                return;
            }

            // Remove dangerous attributes
            const attrsToRemove: string[] = [];
            for (let i = 0; i < el.attributes.length; i++) {
                const attr = el.attributes[i];
                const name = attr.name.toLowerCase();

                if (REMOVE_ATTRS.has(name) || REMOVE_ATTRS_PATTERN.test(name)) {
                    attrsToRemove.push(attr.name);
                    continue;
                }

                // Validate URL attributes
                if (name === "href" || name === "src" || name === "action" || name === "cite" || name === "poster") {
                    const value = attr.value.trim();
                    if (value) {
                        // Allow data:image/* for img src (matches contentToDOM behavior)
                        const isDataImage = name === "src" && el.tagName === "IMG" && value.startsWith("data:image/");
                        if (!isDataImage && !ALLOWED_SCHEMES.test(value)) {
                            attrsToRemove.push(attr.name);
                        }
                    }
                }

                // Remove dangerous URI schemes in any attribute value
                const lowerValue = attr.value.toLowerCase().replace(/[\x00-\x1f\x7f\s]/g, "");
                if (
                    lowerValue.includes("javascript:") ||
                    lowerValue.includes("vbscript:") ||
                    lowerValue.includes("data:text/html")
                ) {
                    attrsToRemove.push(attr.name);
                }
            }

            attrsToRemove.forEach((attrName) => el.removeAttribute(attrName));

            // Recurse into children
            sanitizeNode(child);
        }
    });

    // Remove marked children
    childrenToRemove.forEach((child) => {
        node.removeChild(child);
    });
}
