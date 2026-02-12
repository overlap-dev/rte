import { useCallback } from "react";

/**
 * Hook for editor selection management.
 */
export function useEditorSelection() {
    const restoreSelection = useCallback((editor: HTMLElement) => {
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
    }, []);

    return { restoreSelection };
}
