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
]);

/** Attributes that are always removed (event handlers, dangerous attrs). */
const REMOVE_ATTRS_PATTERN = /^on|^data-(?!attachment-id$|placeholder$)/i;

/** Specific dangerous attribute names. */
const REMOVE_ATTRS = new Set([
    "srcdoc",
    "formaction",
    "xlink:href",
    "ping",
]);

/** Allowed URL schemes for href/src attributes. */
const ALLOWED_SCHEMES = /^(https?:|mailto:|tel:|#|\/)/i;

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
                if (name === "href" || name === "src" || name === "action") {
                    const value = attr.value.trim();
                    if (value && !ALLOWED_SCHEMES.test(value)) {
                        attrsToRemove.push(attr.name);
                    }
                }

                // Remove javascript: in any attribute value
                if (attr.value.toLowerCase().includes("javascript:")) {
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
