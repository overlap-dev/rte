/**
 * Selection-scoped formatting removers.
 *
 * All functions follow the same two-phase shape:
 *   1. Walk the DOM and *collect* the elements that need to change into arrays.
 *   2. Iterate the collected arrays (in reverse where structural mutations
 *      could invalidate later refs) and apply changes.
 *
 * This avoids the classic "TreeWalker advanced past a node that just got
 * replaced" bug where the walker silently skips siblings or terminates early.
 */

const INLINE_TAGS = new Set([
    "strong",
    "b",
    "em",
    "i",
    "u",
    "span",
    "a",
    "font",
]);
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/** Collect every element under `root` whose subtree intersects `range`. */
function collectIntersecting(root: Node, range: Range): HTMLElement[] {
    const out: HTMLElement[] = [];
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        null,
    );
    let node: Node | null = walker.currentNode;
    while (node) {
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            range.intersectsNode(node as HTMLElement)
        ) {
            out.push(node as HTMLElement);
        }
        node = walker.nextNode();
    }
    return out;
}

/**
 * Removes all formatting (inline tags, inline styles, headings) from the
 * current selection.
 */
export function clearFormatting(selection: Selection): void {
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    try {
        // Let the browser do the bulk of the work first
        document.execCommand("removeFormat", false);
        document.execCommand("unlink", false);

        // Phase 1: collect (no mutation)
        const candidates = collectIntersecting(
            range.commonAncestorContainer,
            range,
        );

        const inlineUnwrap: HTMLElement[] = [];
        const stripStyle: HTMLElement[] = [];
        const headingsToReplace: HTMLElement[] = [];

        for (const el of candidates) {
            const tag = el.tagName.toLowerCase();
            if (INLINE_TAGS.has(tag)) inlineUnwrap.push(el);
            if (el.style.length > 0) stripStyle.push(el);
            if (HEADING_TAGS.has(tag)) headingsToReplace.push(el);
        }

        // Phase 2: mutate.
        // Strip styles first (cheap, doesn't change tree structure).
        for (const el of stripStyle) {
            el.removeAttribute("style");
        }
        // Replace inline tags with their text in reverse so earlier refs in
        // the array remain valid even when their parents get rewritten.
        for (let i = inlineUnwrap.length - 1; i >= 0; i--) {
            const el = inlineUnwrap[i];
            if (!el.parentNode) continue;
            el.parentNode.replaceChild(
                document.createTextNode(el.textContent ?? ""),
                el,
            );
        }
        // Convert headings to paragraphs in reverse for the same reason.
        for (let i = headingsToReplace.length - 1; i >= 0; i--) {
            const el = headingsToReplace[i];
            if (!el.parentNode) continue;
            const p = document.createElement("p");
            while (el.firstChild) p.appendChild(el.firstChild);
            el.parentNode.replaceChild(p, el);
        }

        // Final pass: remove any inline tags that are now empty
        const cleanup = collectIntersecting(
            range.commonAncestorContainer,
            range,
        );
        for (const el of cleanup) {
            const tag = el.tagName.toLowerCase();
            if (
                ["strong", "b", "em", "i", "u", "span"].includes(tag) &&
                !el.textContent?.trim()
            ) {
                el.parentNode?.removeChild(el);
            }
        }
    } catch (error) {
        console.error("Error clearing formatting:", error);
        document.execCommand("removeFormat", false);
        document.execCommand("unlink", false);
    }
}

/**
 * Drop the inline `color` style on every element in the selection that has it.
 */
export function clearTextColor(selection: Selection): void {
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const targets = collectIntersecting(
        range.commonAncestorContainer,
        range,
    ).filter((el) => !!el.style.color);

    for (const el of targets) {
        el.style.color = "";
        if (!el.style.length) el.removeAttribute("style");
    }
}

/**
 * Drop the inline `background-color` style on every element in the selection
 * that has it.
 */
export function clearBackgroundColor(selection: Selection): void {
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const targets = collectIntersecting(
        range.commonAncestorContainer,
        range,
    ).filter((el) => !!el.style.backgroundColor);

    for (const el of targets) {
        el.style.backgroundColor = "";
        if (!el.style.length) el.removeAttribute("style");
    }
}

/**
 * Drop the inline `font-size` style on every element in the selection that
 * has it.
 */
export function clearFontSize(selection: Selection): void {
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const targets = collectIntersecting(
        range.commonAncestorContainer,
        range,
    ).filter((el) => !!el.style.fontSize);

    for (const el of targets) {
        el.style.fontSize = "";
        if (!el.style.length) el.removeAttribute("style");
    }
}

/**
 * Unwrap every <a> in the selection while preserving its text content.
 */
export function clearLinks(selection: Selection): void {
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    const links = collectIntersecting(
        range.commonAncestorContainer,
        range,
    ).filter((el): el is HTMLAnchorElement => el.tagName.toLowerCase() === "a");

    // Reverse to keep parent references valid through unwrap chain
    for (let i = links.length - 1; i >= 0; i--) {
        const link = links[i];
        const parent = link.parentNode;
        if (!parent) continue;
        while (link.firstChild) {
            parent.insertBefore(link.firstChild, link);
        }
        parent.removeChild(link);
    }
}
