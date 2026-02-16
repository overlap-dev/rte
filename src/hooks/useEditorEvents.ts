import { useEffect } from "react";
import { HISTORY_DEBOUNCE_MS } from "../constants";
import { EditorContent } from "../types";
import { ensureAllCheckboxes } from "../utils/checkbox";
import { domToContent } from "../utils/content";
import { HistoryManager } from "../utils/history";
import { handleAutoLink } from "../utils/autoLink";
import { indentListItem, outdentListItem } from "../utils/listIndent";
import { handleMarkdownShortcut } from "../utils/markdownShortcuts";
import { serializeSelection } from "../utils/selection";
import { getActiveCell, navigateTableCell } from "../utils/table";

interface UseEditorEventsOptions {
    editorRef: React.RefObject<HTMLDivElement | null>;
    historyRef: { current: HistoryManager };
    isUpdatingRef: { current: boolean };
    mountedRef: { current: boolean };
    notifyChange: (content: EditorContent) => void;
    handleCheckboxKeyDown: (e: KeyboardEvent) => boolean;
    handleCheckboxEnter: (e: KeyboardEvent) => boolean;
    undo: () => void;
    redo: () => void;
}

/**
 * Hook that sets up input and keydown event listeners on the editor.
 */
export function useEditorEvents({
    editorRef,
    historyRef,
    isUpdatingRef,
    mountedRef,
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
                if (!mountedRef.current) return;
                const content = domToContent(editor);
                notifyChange(content);

                if (inputTimeout) clearTimeout(inputTimeout);
                inputTimeout = setTimeout(() => {
                    if (!mountedRef.current) return;
                    const sel = serializeSelection(editor);
                    historyRef.current.push(content, sel);
                    inputTimeout = null;
                }, HISTORY_DEBOUNCE_MS);
            }, 0);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const isModifierPressed = e.metaKey || e.ctrlKey;

            // Markdown-style shortcuts (e.g., # + space → heading)
            if (!isModifierPressed && handleMarkdownShortcut(editor, e)) {
                setTimeout(() => {
                    if (!mountedRef.current) return;
                    const content = domToContent(editor);
                    notifyChange(content);
                }, 0);
                return;
            }

            // Auto-link: convert URLs to <a> tags on space/enter
            if (!isModifierPressed && (e.key === " " || e.key === "Enter")) {
                handleAutoLink(editor, e);
            }

            // Checkbox Enter: create new checkbox item
            if (handleCheckboxEnter(e)) return;

            // Checkbox keyboard navigation
            if (handleCheckboxKeyDown(e)) return;

            // Tab: navigate table cells OR indent/outdent in lists
            if (e.key === "Tab" && !isModifierPressed && !e.altKey) {
                // Table tab navigation takes priority
                if (getActiveCell()) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    navigateTableCell(e.shiftKey ? "prev" : "next");
                    setTimeout(() => {
                        if (!mountedRef.current) return;
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                    return;
                }

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
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    const currentContent = domToContent(editor);
                    const sel = serializeSelection(editor);
                    historyRef.current.push(currentContent, sel);

                    if (e.shiftKey) {
                        outdentListItem(selection);
                    } else {
                        indentListItem(selection);
                    }

                    setTimeout(() => {
                        if (!mountedRef.current) return;
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                    return;
                }
                // Not in a list -- let Tab move focus out of the editor
            }

            // Cmd/Ctrl+K: trigger link button click (if present in toolbar)
            if (isModifierPressed && e.key === "k") {
                e.preventDefault();
                e.stopPropagation();
                // Find and click the link button in the toolbar
                const editorContainer = editor.closest(".rte-container");
                if (editorContainer) {
                    const linkBtn =
                        editorContainer.querySelector(
                            'button[aria-label="Link"], button[aria-label="Insert Link"]'
                        ) as HTMLButtonElement | null;
                    if (linkBtn) linkBtn.click();
                }
                return;
            }

            // Undo/Redo shortcuts
            if (isModifierPressed && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                undo();
                return;
            } else if (
                isModifierPressed &&
                (e.key === "y" || (e.key === "z" && e.shiftKey))
            ) {
                e.preventDefault();
                e.stopPropagation();
                redo();
                return;
            }

            // Formatting shortcuts (Cmd/Ctrl + key)
            // We intercept these to ensure proper history snapshots
            if (isModifierPressed) {
                let command: string | null = null;

                if (!e.shiftKey) {
                    switch (e.key.toLowerCase()) {
                        case "b": command = "bold"; break;
                        case "i": command = "italic"; break;
                        case "u": command = "underline"; break;
                        case "e": command = "code"; break;
                    }
                } else {
                    switch (e.key.toLowerCase()) {
                        case "x": command = "strikeThrough"; break;
                        case "7": command = "insertOrderedList"; break;
                        case "8": command = "insertUnorderedList"; break;
                    }
                }

                if (command) {
                    e.preventDefault();
                    e.stopPropagation();

                    const currentContent = domToContent(editor);
                    const sel = serializeSelection(editor);
                    historyRef.current.push(currentContent, sel);

                    if (command === "code") {
                        // Inline code toggle via surroundContents
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const container = range.commonAncestorContainer;
                            const element =
                                container.nodeType === Node.TEXT_NODE
                                    ? container.parentElement
                                    : (container as HTMLElement);
                            const existingCode = element?.closest("code");
                            if (existingCode) {
                                const parent = existingCode.parentNode;
                                if (parent) {
                                    while (existingCode.firstChild) {
                                        parent.insertBefore(existingCode.firstChild, existingCode);
                                    }
                                    parent.removeChild(existingCode);
                                }
                            } else if (!range.collapsed) {
                                const code = document.createElement("code");
                                try {
                                    range.surroundContents(code);
                                } catch {
                                    const fragment = range.extractContents();
                                    code.appendChild(fragment);
                                    range.insertNode(code);
                                }
                            }
                        }
                    } else {
                        document.execCommand(command, false);
                    }

                    setTimeout(() => {
                        if (!mountedRef.current) return;
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                    return;
                }
            }
        };

        editor.addEventListener("input", handleInput);
        editor.addEventListener("keydown", handleKeyDown, true);

        return () => {
            editor.removeEventListener("input", handleInput);
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
