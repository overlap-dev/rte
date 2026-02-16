/**
 * Path-based selection serialization and restoration.
 *
 * DOM Range references become invalid after innerHTML replacement (undo/redo).
 * This module converts a live selection into a serializable path representation
 * (child indices from editor root to target node + character offset) and can
 * restore that path back to a live DOM selection after the DOM has been rebuilt
 * with identical structure.
 */

export interface SelectionPoint {
    path: number[];
    offset: number;
}

export interface SelectionState {
    anchor: SelectionPoint;
    focus: SelectionPoint;
}

/**
 * Build an index path from `editor` down to `node`.
 * Returns null if the node is not inside the editor.
 */
function buildPath(editor: HTMLElement, node: Node): number[] | null {
    const path: number[] = [];
    let current: Node | null = node;

    while (current && current !== editor) {
        const parent: Node | null = current.parentNode;
        if (!parent) return null;

        const children = parent.childNodes;
        let idx = -1;
        for (let i = 0; i < children.length; i++) {
            if (children[i] === current) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return null;

        path.unshift(idx);
        current = parent;
    }

    if (current !== editor) return null;
    return path;
}

/**
 * Walk a child-index path starting from `editor` and return the target node.
 * Returns null if the path is invalid for the current DOM.
 */
function walkPath(editor: HTMLElement, path: number[]): Node | null {
    let current: Node = editor;
    for (const idx of path) {
        if (!current.childNodes || idx >= current.childNodes.length) return null;
        current = current.childNodes[idx];
    }
    return current;
}

/**
 * Serialize the current window selection relative to `editor`.
 * Returns null if there is no selection or it is outside the editor.
 */
export function serializeSelection(
    editor: HTMLElement,
): SelectionState | null {
    if (typeof window === "undefined") return null;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    if (!sel.anchorNode || !sel.focusNode) return null;

    if (
        !editor.contains(sel.anchorNode) ||
        !editor.contains(sel.focusNode)
    ) {
        return null;
    }

    const anchorPath = buildPath(editor, sel.anchorNode);
    const focusPath = buildPath(editor, sel.focusNode);
    if (!anchorPath || !focusPath) return null;

    return {
        anchor: { path: anchorPath, offset: sel.anchorOffset },
        focus: { path: focusPath, offset: sel.focusOffset },
    };
}

/**
 * Restore a previously serialized selection on `editor`.
 * Silently does nothing if the paths no longer match the DOM.
 */
export function restoreSerializedSelection(
    editor: HTMLElement,
    state: SelectionState | null,
): void {
    if (!state) return;
    if (typeof window === "undefined") return;

    const anchorNode = walkPath(editor, state.anchor.path);
    const focusNode = walkPath(editor, state.focus.path);
    if (!anchorNode || !focusNode) return;

    try {
        const sel = window.getSelection();
        if (!sel) return;

        // Clamp offsets to valid range
        const anchorMax =
            anchorNode.nodeType === Node.TEXT_NODE
                ? (anchorNode.textContent?.length ?? 0)
                : anchorNode.childNodes.length;
        const focusMax =
            focusNode.nodeType === Node.TEXT_NODE
                ? (focusNode.textContent?.length ?? 0)
                : focusNode.childNodes.length;

        const anchorOffset = Math.min(state.anchor.offset, anchorMax);
        const focusOffset = Math.min(state.focus.offset, focusMax);

        sel.removeAllRanges();
        const range = document.createRange();
        range.setStart(anchorNode, anchorOffset);
        range.setEnd(focusNode, focusOffset);
        sel.addRange(range);
    } catch {
        // Silently fail -- cursor positioning is best-effort
    }
}
