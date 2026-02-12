/**
 * Pure DOM utility functions.
 * No React dependencies - only native browser APIs.
 */

/**
 * Checks if a UL element is a checkbox list.
 * Detects: own format, Lexical format, and GitHub format.
 */
export function isCheckboxList(element: HTMLElement): boolean {
    if (element.tagName !== "UL") return false;
    // Own format
    if (element.classList.contains("rte-checkbox-list")) return true;
    // Lexical format (attribute)
    if (element.getAttribute("__lexicallisttype") === "check") return true;
    // Lexical theme class (any class containing "checklist")
    const hasChecklistClass = Array.from(element.classList).some((cls) =>
        cls.toLowerCase().includes("checklist")
    );
    if (hasChecklistClass) return true;
    // GitHub format
    if (element.classList.contains("contains-task-list")) return true;
    return false;
}

/**
 * Finds the closest checkbox list ancestor from an element.
 * Works with all supported formats (own, Lexical, GitHub).
 */
export function findClosestCheckboxList(
    element: HTMLElement
): HTMLElement | null {
    let current: HTMLElement | null = element;
    while (current) {
        if (current.tagName === "UL" && isCheckboxList(current)) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}

/**
 * Checks if a list item has a nested list as its first child (not a leaf item).
 */
export function isNestedListItem(li: HTMLElement): boolean {
    const firstChild = li.firstChild;
    return (
        firstChild instanceof HTMLElement &&
        (firstChild.tagName === "UL" || firstChild.tagName === "OL")
    );
}

/**
 * Finds the closest list item from a node.
 */
export function findClosestListItem(node: Node): HTMLLIElement | null {
    const element =
        node.nodeType === Node.TEXT_NODE
            ? node.parentElement
            : (node as HTMLElement);
    return (element?.closest("li") as HTMLLIElement) || null;
}

/**
 * Gets the HTMLElement from a selection range container.
 */
export function getElementFromContainer(
    container: Node
): HTMLElement | null {
    return container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : (container as HTMLElement);
}

/**
 * Sets cursor position in a text node after an async DOM update.
 */
export function setCursorInTextNode(
    textNode: Text,
    position: number,
    editor?: HTMLElement
): void {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            try {
                const range = document.createRange();
                const maxPos = textNode.textContent?.length || 0;
                const safePos = Math.min(Math.max(0, position), maxPos);
                range.setStart(textNode, safePos);
                range.collapse(true);

                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);
                    if (editor) editor.focus();
                }
            } catch (_) {
                // Silently fail - cursor positioning is best-effort
            }
        });
    });
}
