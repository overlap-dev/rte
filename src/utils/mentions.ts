import { EditorContent, EditorNode, MentionItem } from "../types";

export const DEFAULT_MENTION_TRIGGER = "@";

/** Result of looking for an open mention query at the caret. */
export interface MentionQueryMatch {
    /** Text typed after the trigger (may be empty). */
    query: string;
    /** Text node that contains the trigger + query. */
    textNode: Text;
    /** Offset of the trigger character inside `textNode`. */
    start: number;
    /** Caret offset inside `textNode` (end of the query). */
    end: number;
}

/**
 * Collect every mention node in the content tree (document order).
 */
export function extractMentions(content: EditorContent): MentionItem[] {
    const out: MentionItem[] = [];
    const walk = (nodes: EditorNode[] | undefined) => {
        nodes?.forEach((node) => {
            if (node.type === "mention") {
                out.push({
                    id: node.attributes?.id ?? "",
                    label: node.attributes?.label ?? "",
                });
            }
            walk(node.children);
        });
    };
    walk(content.blocks);
    return out;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve the caret to a text node + offset. When the caret sits in an
 * element (e.g. right after an inline element), fall back to the end of the
 * preceding text node.
 */
function caretTextPosition(range: Range): { node: Text; offset: number } | null {
    const container = range.startContainer;
    if (container.nodeType === Node.TEXT_NODE) {
        return { node: container as Text, offset: range.startOffset };
    }
    if (container.nodeType === Node.ELEMENT_NODE && range.startOffset > 0) {
        const prev = container.childNodes[range.startOffset - 1];
        if (prev && prev.nodeType === Node.TEXT_NODE) {
            return {
                node: prev as Text,
                offset: (prev.textContent || "").length,
            };
        }
    }
    return null;
}

/**
 * Detect whether the caret currently sits at the end of a mention query,
 * i.e. `trigger` preceded by start-of-text or whitespace, followed by at
 * most two words (so "@Jane Doe" still matches but a stray "@" far back in
 * the paragraph does not keep the popup open forever).
 */
export function getMentionQuery(
    editor: HTMLElement,
    trigger: string = DEFAULT_MENTION_TRIGGER,
): MentionQueryMatch | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
        return null;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.startContainer)) return null;

    const pos = caretTextPosition(range);
    if (!pos) return null;

    const parentEl = pos.node.parentElement;
    if (
        !parentEl ||
        parentEl.closest("pre, code, a, [data-mention-id]") !== null
    ) {
        return null;
    }

    const textBefore = (pos.node.textContent || "").substring(0, pos.offset);
    const pattern = new RegExp(
        `(?:^|\\s)${escapeRegExp(trigger)}([^\\s${escapeRegExp(trigger)}]*(?:\\s[^\\s${escapeRegExp(trigger)}]*)?)$`,
    );
    const match = pattern.exec(textBefore);
    if (!match) return null;

    const query = match[1];
    const start = pos.offset - query.length - trigger.length;

    return { query, textNode: pos.node, start, end: pos.offset };
}

/**
 * Return the mention element directly before ("backward") or after
 * ("forward") a collapsed selection, or null. Used to delete a mention
 * atomically on Backspace/Delete, which browsers do not do consistently for
 * inline contenteditable="false" elements.
 */
export function getAdjacentMention(
    editor: HTMLElement,
    direction: "backward" | "forward",
): HTMLElement | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
        return null;
    }
    const range = selection.getRangeAt(0);
    const { startContainer: container, startOffset: offset } = range;
    if (!editor.contains(container)) return null;

    let candidate: Node | null = null;
    if (container.nodeType === Node.TEXT_NODE) {
        const len = (container.textContent || "").length;
        if (direction === "backward" && offset === 0) {
            candidate = container.previousSibling;
        } else if (direction === "forward" && offset === len) {
            candidate = container.nextSibling;
        }
    } else {
        candidate =
            direction === "backward"
                ? container.childNodes[offset - 1] || null
                : container.childNodes[offset] || null;
    }

    if (
        candidate &&
        candidate.nodeType === Node.ELEMENT_NODE &&
        (candidate as HTMLElement).hasAttribute("data-mention-id")
    ) {
        return candidate as HTMLElement;
    }
    return null;
}

/**
 * Create the DOM element used for a mention inside the editor.
 */
export function createMentionElement(
    item: MentionItem,
    trigger: string = DEFAULT_MENTION_TRIGGER,
): HTMLSpanElement {
    const span = document.createElement("span");
    span.className = "rte-mention";
    span.setAttribute("data-mention-id", item.id);
    span.setAttribute("contenteditable", "false");
    span.textContent = `${trigger}${item.label}`;
    return span;
}

/**
 * Replace the trigger + query text described by `match` with a mention
 * element followed by a non-breaking space, and place the caret after it.
 */
export function insertMention(
    match: MentionQueryMatch,
    item: MentionItem,
    trigger: string = DEFAULT_MENTION_TRIGGER,
): HTMLSpanElement | null {
    const { textNode, start, end } = match;
    const parent = textNode.parentNode;
    if (!parent) return null;

    const text = textNode.textContent || "";
    const before = text.substring(0, start);
    const after = text.substring(end);

    const mention = createMentionElement(item, trigger);
    // Non-breaking space: a regular trailing space would collapse visually
    // at the end of a text node in contenteditable.
    const spacer = document.createTextNode("\u00A0" + after);

    const frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(mention);
    frag.appendChild(spacer);
    parent.replaceChild(frag, textNode);

    const range = document.createRange();
    range.setStart(spacer, 1);
    range.collapse(true);
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }

    return mention;
}
