/**
 * Auto-link utility.
 *
 * Detects URLs in text nodes and wraps them in <a> tags.
 * Triggered after space/enter when the preceding word looks like a URL.
 */

import { isUrlSafe } from "./sanitize";

const URL_REGEX =
    /^(?:https?:\/\/|www\.)[^\s<>'"]+\.[a-z]{2,}[^\s<>'"]*$/i;

/**
 * Check if the word before the cursor is a URL and wrap it in an <a> tag.
 * Called on space/enter keypress in the editor.
 */
export function handleAutoLink(editor: HTMLElement, e: KeyboardEvent): boolean {
    if (e.key !== " " && e.key !== "Enter") return false;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return false;

    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;

    // Don't auto-link if already inside an anchor
    const parentEl =
        node.parentElement;
    if (parentEl?.closest("a")) return false;

    const textNode = node as Text;
    const text = textNode.textContent || "";
    const offset = range.startOffset;

    // Get the text before the cursor
    const textBeforeCursor = text.substring(0, offset);

    // Find the last word (separated by whitespace)
    const lastSpaceIdx = textBeforeCursor.lastIndexOf(" ");
    const lastNewlineIdx = textBeforeCursor.lastIndexOf("\n");
    const wordStart = Math.max(lastSpaceIdx, lastNewlineIdx) + 1;
    const word = textBeforeCursor.substring(wordStart);

    if (!word || !URL_REGEX.test(word)) return false;

    // Ensure it has a valid protocol or starts with www.
    let href = word;
    if (href.startsWith("www.")) {
        href = "https://" + href;
    }

    // Validate the URL is safe before creating a link
    if (!isUrlSafe(href)) return false;

    // Create the link element
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.textContent = word;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    // Split the text node and insert the link
    const beforeText = text.substring(0, wordStart);
    const afterText = text.substring(offset);

    const parentNode = textNode.parentNode;
    if (!parentNode) return false;

    // Build replacement: [beforeText][<a>word</a>][afterText]
    const frag = document.createDocumentFragment();

    if (beforeText) {
        frag.appendChild(document.createTextNode(beforeText));
    }
    frag.appendChild(anchor);

    // The space/enter that triggered this will be part of afterText or inserted by the browser
    const afterNode = document.createTextNode(afterText);
    frag.appendChild(afterNode);

    parentNode.replaceChild(frag, textNode);

    // Place cursor after the link (in the afterText node)
    const newRange = document.createRange();
    newRange.setStart(afterNode, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Don't prevent default -- let the space/enter be typed normally after the link
    return false;
}
