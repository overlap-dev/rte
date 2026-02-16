/**
 * Markdown-style input shortcuts.
 *
 * Detects markdown patterns at the start of a block element
 * (after a Space key press) and auto-converts them:
 *   # through ###### → H1–H6
 *   - or *           → Bullet list
 *   1.               → Numbered list
 *   >                → Blockquote
 *   []               → Checkbox list
 *   ```              → Code block (<pre>)
 *   ---              → Horizontal rule (<hr>)
 */

export function handleMarkdownShortcut(
    editor: HTMLElement,
    e: KeyboardEvent,
): boolean {
    if (e.key !== " " && e.key !== "Enter") return false;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return false;

    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;

    const textNode = node as Text;
    const text = textNode.textContent || "";
    const offset = range.startOffset;

    // We only care about text typed at the very start of a block
    const textBeforeCursor = text.substring(0, offset);

    // Find the parent block element
    const blockEl =
        textNode.parentElement?.closest("p, div, h1, h2, h3, h4, h5, h6") ||
        textNode.parentElement;
    if (!blockEl || !editor.contains(blockEl)) return false;

    // Only trigger when the block starts with just the trigger text
    const blockText = blockEl.textContent || "";
    const blockTextBeforeCursor = blockText.substring(
        0,
        blockText.indexOf(textBeforeCursor) + textBeforeCursor.length,
    );

    // Patterns that trigger on Space
    if (e.key === " ") {
        // Heading shortcuts: # through ######
        const headingMatch = textBeforeCursor.match(/^(#{1,6})$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            e.preventDefault();
            clearBlockText(textNode, offset);
            document.execCommand("formatBlock", false, `h${level}`);
            return true;
        }

        // Bullet list: - or *
        if (textBeforeCursor === "-" || textBeforeCursor === "*") {
            e.preventDefault();
            clearBlockText(textNode, offset);
            document.execCommand("insertUnorderedList");
            return true;
        }

        // Numbered list: 1.
        if (textBeforeCursor === "1.") {
            e.preventDefault();
            clearBlockText(textNode, offset);
            document.execCommand("insertOrderedList");
            return true;
        }

        // Blockquote: >
        if (textBeforeCursor === ">") {
            e.preventDefault();
            clearBlockText(textNode, offset);
            document.execCommand("formatBlock", false, "blockquote");
            return true;
        }

        // Checkbox list: []
        if (textBeforeCursor === "[]") {
            e.preventDefault();
            clearBlockText(textNode, offset);
            // Insert a checkbox list using the same approach as blockFormat
            document.execCommand("insertUnorderedList");
            // Find the newly created UL and convert to checkbox
            setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;
                const r = sel.getRangeAt(0);
                const container = r.startContainer;
                const el =
                    container.nodeType === Node.TEXT_NODE
                        ? container.parentElement
                        : (container as HTMLElement);
                const li = el?.closest("li");
                const ul = li?.parentElement;
                if (ul && ul.tagName === "UL") {
                    ul.classList.add("rte-checkbox-list");
                    const items = ul.querySelectorAll("li");
                    items.forEach((item) => {
                        item.setAttribute("role", "checkbox");
                        item.setAttribute("aria-checked", "false");
                        item.setAttribute("tabindex", "-1");
                    });
                }
            }, 0);
            return true;
        }
    }

    // Patterns that trigger on Enter (backticks, hr)
    if (e.key === "Enter") {
        // Code block: ```
        if (blockTextBeforeCursor === "```" || textBeforeCursor === "```") {
            e.preventDefault();
            clearBlockText(textNode, textBeforeCursor.length);
            document.execCommand("formatBlock", false, "pre");
            return true;
        }

        // Horizontal rule: ---
        if (blockTextBeforeCursor === "---" || textBeforeCursor === "---") {
            e.preventDefault();
            clearBlockText(textNode, textBeforeCursor.length);
            // Remove the block contents and insert an HR
            if (blockEl.parentNode) {
                const hr = document.createElement("hr");
                const p = document.createElement("p");
                p.appendChild(document.createElement("br"));
                blockEl.parentNode.insertBefore(hr, blockEl);
                blockEl.parentNode.insertBefore(p, blockEl.nextSibling);
                blockEl.parentNode.removeChild(blockEl);
                // Place cursor in the new paragraph
                const newRange = document.createRange();
                newRange.setStart(p, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
            return true;
        }
    }

    return false;
}

/** Remove the trigger characters from the text node before applying formatting. */
function clearBlockText(textNode: Text, charCount: number): void {
    const text = textNode.textContent || "";
    textNode.textContent = text.substring(charCount);
    // Reset cursor to start
    const selection = window.getSelection();
    if (selection) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
