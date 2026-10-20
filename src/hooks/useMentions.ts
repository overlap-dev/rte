import React, { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, MentionItem, MentionOptions } from "../types";
import { HistoryManager } from "../utils/history";
import { serializeSelection } from "../utils/selection";
import {
    DEFAULT_MENTION_TRIGGER,
    getAdjacentMention,
    getMentionQuery,
    insertMention,
    MentionQueryMatch,
} from "../utils/mentions";

export interface MentionPopupState {
    open: boolean;
    items: MentionItem[];
    activeIndex: number;
    top: number;
    left: number;
}

const CLOSED: MentionPopupState = {
    open: false,
    items: [],
    activeIndex: 0,
    top: 0,
    left: 0,
};

interface UseMentionsOptions {
    editorRef: React.RefObject<HTMLDivElement | null>;
    historyRef: { current: HistoryManager };
    options?: MentionOptions;
    enabled: boolean;
    getDomContent: () => EditorContent;
}

/** Viewport position just below the caret (or above when near the bottom). */
function caretPosition(match: MentionQueryMatch): { top: number; left: number } {
    const range = document.createRange();
    range.setStart(match.textNode, match.end);
    range.collapse(true);
    let rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
        const parent = match.textNode.parentElement;
        if (parent) rect = parent.getBoundingClientRect();
    }
    const pad = 4;
    const estimatedHeight = 240;
    let top = rect.bottom + pad;
    if (top + estimatedHeight > window.innerHeight - pad) {
        top = Math.max(pad, rect.top - estimatedHeight - pad);
    }
    const left = Math.max(pad, Math.min(rect.left, window.innerWidth - 260));
    return { top, left };
}

/**
 * Hook that drives the @mention suggestion popup: detects the trigger at the
 * caret, fetches suggestions, handles keyboard navigation and inserts the
 * chosen mention as an atomic <span>.
 */
export function useMentions({
    editorRef,
    historyRef,
    options,
    enabled,
    getDomContent,
}: UseMentionsOptions) {
    const [state, setState] = useState<MentionPopupState>(CLOSED);
    const stateRef = useRef(state);
    stateRef.current = state;

    const matchRef = useRef<MentionQueryMatch | null>(null);
    const requestIdRef = useRef(0);
    const optionsRef = useRef(options);
    optionsRef.current = options;
    // Callbacks are read through refs so unstable parent callbacks do not
    // re-register the listeners (and close the popup) on every render.
    const callbacksRef = useRef({ getDomContent });
    callbacksRef.current = { getDomContent };

    const trigger = options?.trigger || DEFAULT_MENTION_TRIGGER;

    const close = useCallback(() => {
        requestIdRef.current++;
        matchRef.current = null;
        setState((prev) => (prev.open ? CLOSED : prev));
    }, []);

    /**
     * Run a DOM mutation as one undoable step: snapshot the current state
     * (unless the debounced input handler already recorded it) and then
     * dispatch an `input` event so the editor's regular change pipeline
     * notifies onChange and records the new state (replacing any pending
     * debounced snapshot of the pre-mutation text).
     */
    const mutateWithHistory = useCallback(
        (mutate: () => void) => {
            const editor = editorRef.current;
            if (!editor) return;
            const history = historyRef.current;

            const before = callbacksRef.current.getDomContent();
            const current = history.getCurrent();
            if (
                !current ||
                JSON.stringify(current.content) !== JSON.stringify(before)
            ) {
                history.push(before, serializeSelection(editor));
            }

            mutate();

            editor.dispatchEvent(new Event("input", { bubbles: true }));
        },
        [editorRef, historyRef],
    );

    const select = useCallback(
        (item: MentionItem) => {
            const match = matchRef.current;
            if (!match) return;
            mutateWithHistory(() => {
                insertMention(match, item, optionsRef.current?.trigger);
            });
            close();
        },
        [mutateWithHistory, close],
    );

    /** Re-run trigger detection at the caret and update the popup. */
    const update = useCallback(
        (openIfMissing: boolean) => {
            const editor = editorRef.current;
            const opts = optionsRef.current;
            if (!editor || !opts) return;

            const match = getMentionQuery(editor, opts.trigger);
            if (!match) {
                if (stateRef.current.open || matchRef.current) close();
                return;
            }

            // selectionchange only refreshes an already open popup; it must
            // not pop up just because the caret landed on existing text.
            if (!openIfMissing && !stateRef.current.open) return;

            const sameQuery =
                matchRef.current?.query === match.query &&
                matchRef.current?.textNode === match.textNode;
            matchRef.current = match;
            if (sameQuery && stateRef.current.open) return;

            const requestId = ++requestIdRef.current;
            Promise.resolve(opts.fetchItems(match.query))
                .then((items) => {
                    if (requestId !== requestIdRef.current) return;
                    if (!items || items.length === 0) {
                        setState((prev) => (prev.open ? CLOSED : prev));
                        return;
                    }
                    const pos = caretPosition(match);
                    setState({
                        open: true,
                        items,
                        activeIndex: 0,
                        top: pos.top,
                        left: pos.left,
                    });
                })
                .catch(() => {
                    if (requestId === requestIdRef.current) close();
                });
        },
        [editorRef, close],
    );

    // Options are read through a ref so an inline `mentions={{ … }}` object
    // does not tear down the listeners (and close the popup) on every render.
    const hasOptions = !!options;

    useEffect(() => {
        const editor = editorRef.current;
        if (!enabled || !editor || !hasOptions) return;

        const handleInput = () => update(true);
        const handleSelectionChange = () => {
            if (stateRef.current.open || matchRef.current) update(false);
        };

        // Capture phase on document so this runs before the editor's own
        // keydown handling (Enter in lists/checkboxes, Tab indent, …).
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!editor.contains(e.target as Node)) return;

            // Atomic delete: remove the whole mention when Backspace/Delete
            // is pressed right next to it.
            if (
                (e.key === "Backspace" || e.key === "Delete") &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.altKey
            ) {
                const mention = getAdjacentMention(
                    editor,
                    e.key === "Backspace" ? "backward" : "forward",
                );
                if (mention) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    mutateWithHistory(() => {
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.setStartBefore(mention);
                        range.collapse(true);
                        mention.remove();
                        if (selection) {
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    });
                    close();
                    return;
                }
            }

            const current = stateRef.current;
            if (!current.open) return;

            switch (e.key) {
                case "ArrowDown":
                case "ArrowUp": {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const dir = e.key === "ArrowDown" ? 1 : -1;
                    const count = current.items.length;
                    setState((prev) => ({
                        ...prev,
                        activeIndex: (prev.activeIndex + dir + count) % count,
                    }));
                    return;
                }
                case "Enter":
                case "Tab": {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const item = current.items[current.activeIndex];
                    if (item) select(item);
                    return;
                }
                case "Escape": {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    close();
                    return;
                }
                default:
                    return;
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (!stateRef.current.open) return;
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (editor.contains(target)) return;
            if (target.closest(".rte-mention-popup")) return;
            close();
        };

        const handleBlur = () => {
            // Let a click on a popup item (which prevents default) finish
            // before deciding to close.
            setTimeout(() => {
                if (document.activeElement !== editor) close();
            }, 0);
        };

        editor.addEventListener("input", handleInput);
        editor.addEventListener("blur", handleBlur);
        document.addEventListener("selectionchange", handleSelectionChange);
        document.addEventListener("keydown", handleKeyDown, true);
        document.addEventListener("mousedown", handleMouseDown, true);

        return () => {
            editor.removeEventListener("input", handleInput);
            editor.removeEventListener("blur", handleBlur);
            document.removeEventListener(
                "selectionchange",
                handleSelectionChange,
            );
            document.removeEventListener("keydown", handleKeyDown, true);
            document.removeEventListener("mousedown", handleMouseDown, true);
            close();
        };
    }, [editorRef, enabled, hasOptions, update, select, close, mutateWithHistory]);

    return {
        state,
        trigger,
        select,
        close,
        setActiveIndex: (index: number) =>
            setState((prev) => ({ ...prev, activeIndex: index })),
    };
}
