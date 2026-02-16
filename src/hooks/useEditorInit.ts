import { useEffect, useRef } from "react";
import React from "react";
import { EditorContent } from "../types";
import { ensureAllCheckboxes } from "../utils/checkbox";
import { contentToDOM, createEmptyContent } from "../utils/content";
import { HistoryManager } from "../utils/history";

interface UseEditorInitOptions {
    editorRef: React.RefObject<HTMLDivElement | null>;
    historyRef: { current: HistoryManager };
    isUpdatingRef: { current: boolean };
    initialContent?: EditorContent;
    notifyChange: (content: EditorContent) => void;
    customLinkComponent?: React.ComponentType<{
        href: string;
        children: React.ReactNode;
        [key: string]: unknown;
    }>;
    customHeadingRenderer?: (
        level: string,
        children: React.ReactNode
    ) => React.ReactNode;
}

/**
 * Hook that initializes the editor with initial content and sets up the MutationObserver.
 * Runs once on mount.
 */
export function useEditorInit({
    editorRef,
    historyRef,
    isUpdatingRef,
    initialContent,
    customLinkComponent,
    customHeadingRenderer,
}: UseEditorInitOptions) {
    const isInitializedRef = useRef(false);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || isInitializedRef.current) return;

        // Load initial content
        const content = initialContent || createEmptyContent();
        isUpdatingRef.current = true;
        contentToDOM(
            content,
            editor,
            customLinkComponent,
            customHeadingRenderer
        );
        historyRef.current.push(content);
        isUpdatingRef.current = false;
        isInitializedRef.current = true;

        // Normalize all checkbox lists (own + Lexical + GitHub formats)
        ensureAllCheckboxes(editor);

        // MutationObserver: ensure new checkbox list items get correct attributes
        let checkboxTimeout: ReturnType<typeof setTimeout> | null = null;

        const observer = new MutationObserver((mutations) => {
            if (isUpdatingRef.current) return;

            let needsUpdate = false;
            for (const mutation of mutations) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    const el = node as HTMLElement;
                    if (
                        el.tagName === "LI" &&
                        el.closest("ul.rte-checkbox-list")
                    ) {
                        needsUpdate = true;
                        break;
                    }
                    if (
                        el.tagName === "UL" &&
                        el.classList.contains("rte-checkbox-list")
                    ) {
                        needsUpdate = true;
                        break;
                    }
                    if (el.querySelector("ul.rte-checkbox-list li")) {
                        needsUpdate = true;
                        break;
                    }
                }
                if (needsUpdate) break;
            }

            if (needsUpdate) {
                if (checkboxTimeout) clearTimeout(checkboxTimeout);
                checkboxTimeout = setTimeout(() => ensureAllCheckboxes(editor), 0);
            }
        });

        observer.observe(editor, { childList: true, subtree: true });

        return () => {
            if (checkboxTimeout) clearTimeout(checkboxTimeout);
            observer.disconnect();
        };
        // Only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
