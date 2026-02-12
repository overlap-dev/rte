import { useEffect } from "react";
import { HISTORY_DEBOUNCE_MS } from "../constants";
import { EditorContent } from "../types";
import { ensureAllCheckboxes } from "../utils/checkbox";
import { domToContent } from "../utils/content";
import { HistoryManager } from "../utils/history";
import { indentListItem, outdentListItem } from "../utils/listIndent";

interface UseEditorEventsOptions {
    editorRef: React.RefObject<HTMLDivElement | null>;
    historyRef: React.MutableRefObject<HistoryManager>;
    isUpdatingRef: React.MutableRefObject<boolean>;
    notifyChange: (content: EditorContent) => void;
    handleCheckboxKeyDown: (e: KeyboardEvent) => boolean;
    handleCheckboxEnter: (e: KeyboardEvent) => boolean;
    undo: () => void;
    redo: () => void;
}

/**
 * Hook that sets up input, keyup, and keydown event listeners on the editor.
 */
export function useEditorEvents({
    editorRef,
    historyRef,
    isUpdatingRef,
    notifyChange,
    handleCheckboxKeyDown,
    handleCheckboxEnter,
    undo,
    redo,
}: UseEditorEventsOptions) {
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        let inputTimeout: ReturnType<typeof setTimeout> | null = null;

        const handleInput = () => {
            setTimeout(() => {
                const content = domToContent(editor);
                notifyChange(content);

                if (inputTimeout) clearTimeout(inputTimeout);
                inputTimeout = setTimeout(() => {
                    historyRef.current.push(content);
                    inputTimeout = null;
                }, HISTORY_DEBOUNCE_MS);
            }, 0);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const isModifierPressed = e.metaKey || e.ctrlKey;

            // Checkbox Enter: create new checkbox item
            if (handleCheckboxEnter(e)) return;

            // Checkbox keyboard navigation
            if (handleCheckboxKeyDown(e)) return;

            // Tab: indent/outdent in lists
            if (e.key === "Tab" && !isModifierPressed && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;

                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                if (!editor.contains(container)) return;

                const listItem =
                    container.nodeType === Node.TEXT_NODE
                        ? container.parentElement?.closest("li")
                        : (container as HTMLElement).closest("li");

                if (listItem && editor.contains(listItem)) {
                    const currentContent = domToContent(editor);
                    historyRef.current.push(currentContent);

                    if (e.shiftKey) {
                        outdentListItem(selection);
                    } else {
                        indentListItem(selection);
                    }

                    setTimeout(() => {
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                    return;
                }
            }

            // Undo/Redo shortcuts
            if (isModifierPressed && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                undo();
            } else if (
                isModifierPressed &&
                (e.key === "y" || (e.key === "z" && e.shiftKey))
            ) {
                e.preventDefault();
                e.stopPropagation();
                redo();
            }
        };

        editor.addEventListener("input", handleInput);
        editor.addEventListener("keyup", handleInput);
        editor.addEventListener("keydown", handleKeyDown, true);

        return () => {
            editor.removeEventListener("input", handleInput);
            editor.removeEventListener("keyup", handleInput);
            editor.removeEventListener("keydown", handleKeyDown, true);
            if (inputTimeout) clearTimeout(inputTimeout);
        };
    }, [
        editorRef,
        historyRef,
        isUpdatingRef,
        notifyChange,
        handleCheckboxKeyDown,
        handleCheckboxEnter,
        undo,
        redo,
    ]);
}
