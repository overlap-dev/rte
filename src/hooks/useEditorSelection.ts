import { useCallback } from "react";
import {
    SelectionState,
    restoreSerializedSelection,
} from "../utils/selection";

/**
 * Hook for editor selection management.
 * Wraps restoreSerializedSelection in a stable callback.
 */
export function useEditorSelection() {
    const restoreSelection = useCallback(
        (editor: HTMLElement, state?: SelectionState | null) => {
            if (state) {
                restoreSerializedSelection(editor, state);
                return;
            }
            // Fallback: place cursor at start of the editor
            if (
                typeof window === "undefined" ||
                typeof document === "undefined"
            )
                return;
            const range = document.createRange();
            const selection = window.getSelection();
            if (editor.firstChild) {
                range.setStart(editor.firstChild, 0);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        },
        [],
    );

    return { restoreSelection };
}
