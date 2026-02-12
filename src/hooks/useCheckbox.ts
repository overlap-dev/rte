import { useCallback, useEffect } from "react";
import { CHECKBOX_CLICK_ZONE_PX } from "../constants";
import { EditorContent } from "../types";
import {
    ensureAllCheckboxes,
    findCheckListItemSibling,
    getActiveCheckListItem,
    toggleListItemChecked,
    updateListItemChecked,
} from "../utils/checkbox";
import {
    findClosestCheckboxList,
    findClosestListItem,
    isCheckboxList,
    isNestedListItem,
    setCursorInTextNode,
} from "../utils/dom";

interface UseCheckboxOptions {
    editorRef: React.RefObject<HTMLDivElement | null>;
    isUpdatingRef: React.MutableRefObject<boolean>;
    pushToHistory: (content: EditorContent) => void;
    notifyChange: (content: EditorContent) => void;
    getDomContent: () => EditorContent;
}

/**
 * Hook that manages all checkbox list interactions.
 * Consolidates click handling, keyboard navigation, and checkbox insertion.
 * Uses event delegation (single listener on editor root) for all checkbox events.
 */
export function useCheckbox({
    editorRef,
    isUpdatingRef,
    pushToHistory,
    notifyChange,
    getDomContent,
}: UseCheckboxOptions) {
    // --- Event Listeners (click + pointerdown) ---
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handleClick = (event: Event): void => {
            const clickTarget = event.target;
            if (!(clickTarget instanceof HTMLElement)) return;

            const listItem =
                clickTarget.tagName === "LI"
                    ? (clickTarget as HTMLLIElement)
                    : (clickTarget.closest("li") as HTMLLIElement);
            if (!listItem) return;

            const parentNode = listItem.parentElement;
            if (!parentNode || !isCheckboxList(parentNode)) return;
            if (listItem.getAttribute("role") !== "checkbox") return;
            if (isNestedListItem(listItem)) return;

            const rect = listItem.getBoundingClientRect();
            const clientX = (event as MouseEvent).clientX;
            const isInCheckboxArea =
                listItem.dir === "rtl"
                    ? clientX >= rect.right - CHECKBOX_CLICK_ZONE_PX
                    : clientX <= rect.left + CHECKBOX_CLICK_ZONE_PX;

            if (isInCheckboxArea) {
                event.preventDefault();
                event.stopPropagation();
                toggleListItemChecked(listItem);
                // Trigger change event
                const changeEvent = new Event("input", { bubbles: true });
                editor.dispatchEvent(changeEvent);
            }
        };

        const handlePointerDown = (event: PointerEvent): void => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            const listItem =
                target.tagName === "LI"
                    ? target
                    : target.closest("li");
            if (!listItem) return;
            if (isNestedListItem(listItem)) return;

            const parentNode = listItem.parentElement;
            if (!parentNode || !isCheckboxList(parentNode)) return;

            const rect = listItem.getBoundingClientRect();
            const clientX = event.clientX;
            const isInCheckboxArea =
                listItem.dir === "rtl"
                    ? clientX >= rect.right - CHECKBOX_CLICK_ZONE_PX
                    : clientX <= rect.left + CHECKBOX_CLICK_ZONE_PX;

            if (isInCheckboxArea) {
                event.preventDefault();
            }
        };

        editor.addEventListener("click", handleClick, true);
        editor.addEventListener(
            "pointerdown",
            handlePointerDown as EventListener,
            true
        );

        return () => {
            editor.removeEventListener("click", handleClick, true);
            editor.removeEventListener(
                "pointerdown",
                handlePointerDown as EventListener,
                true
            );
        };
    }, [editorRef]);

    // --- Keyboard handlers (called from useEditorEvents) ---

    /**
     * Handles checkbox-specific keyboard events.
     * Returns true if the event was handled and should not propagate.
     */
    const handleCheckboxKeyDown = useCallback(
        (e: KeyboardEvent): boolean => {
            // Arrow up/down: navigate between checkbox items
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                const activeItem = getActiveCheckListItem();
                if (activeItem) {
                    const backward = e.key === "ArrowUp";
                    const nextItem = findCheckListItemSibling(
                        activeItem as HTMLLIElement,
                        backward
                    );
                    if (nextItem) {
                        e.preventDefault();
                        nextItem.focus();
                        return true;
                    }
                }
            }

            // Space: toggle checkbox
            if (e.key === " ") {
                const activeItem = getActiveCheckListItem();
                if (activeItem) {
                    e.preventDefault();
                    toggleListItemChecked(activeItem as HTMLLIElement);
                    const editorEl = activeItem.closest(".rte-editor");
                    if (editorEl) {
                        editorEl.dispatchEvent(
                            new Event("input", { bubbles: true })
                        );
                    }
                    return true;
                }
            }

            // Escape: blur from checkbox item
            if (e.key === "Escape") {
                const activeItem = getActiveCheckListItem();
                if (activeItem) {
                    const editorEl = activeItem.closest(".rte-editor");
                    if (editorEl instanceof HTMLElement) {
                        editorEl.focus();
                    }
                    return true;
                }
            }

            // Arrow left: focus list item when cursor is at the start
            if (e.key === "ArrowLeft") {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return false;

                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                const listItem = findClosestListItem(container);
                if (!listItem) return false;

                const parent = listItem.parentElement;
                if (
                    parent &&
                    isCheckboxList(parent) &&
                    range.collapsed &&
                    range.startOffset === 0
                ) {
                    if (document.activeElement !== listItem) {
                        listItem.focus();
                        e.preventDefault();
                        return true;
                    }
                }
            }

            return false;
        },
        []
    );

    /**
     * Handles Enter key in checkbox lists.
     * Creates a new unchecked item after the current one.
     * Returns true if the event was handled.
     */
    const handleCheckboxEnter = useCallback(
        (e: KeyboardEvent): boolean => {
            if (e.key !== "Enter") return false;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return false;

            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const listItem = findClosestListItem(container);
            if (!listItem) return false;

            const checkboxList = findClosestCheckboxList(listItem);
            if (!checkboxList) return false;

            e.preventDefault();

            const newLi = document.createElement("li");
            updateListItemChecked(newLi, false);
            const textNode = document.createTextNode(" ");
            newLi.appendChild(textNode);

            if (listItem.nextSibling) {
                checkboxList.insertBefore(newLi, listItem.nextSibling);
            } else {
                checkboxList.appendChild(newLi);
            }

            const editor = editorRef.current;
            if (editor) ensureAllCheckboxes(editor);

            const newRange = document.createRange();
            newRange.setStart(textNode, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            if (editor) {
                const content = getDomContent();
                pushToHistory(content);
                notifyChange(content);
            }

            return true;
        },
        [editorRef, getDomContent, pushToHistory, notifyChange]
    );

    /**
     * Inserts a new checkbox list at the current cursor position,
     * or removes it if already inside one.
     * Returns true on success.
     */
    const insertCheckboxList = useCallback(
        (editor: HTMLElement): boolean => {
            isUpdatingRef.current = true;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                isUpdatingRef.current = false;
                return false;
            }

            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element =
                container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : (container as HTMLElement);

            if (!element) {
                isUpdatingRef.current = false;
                return false;
            }

            // Already in a checkbox list? Remove it.
            const existingList = findClosestCheckboxList(element);
            if (existingList) {
                existingList.classList.remove("rte-checkbox-list");
                existingList
                    .querySelectorAll("li[role='checkbox']")
                    .forEach((li) => {
                        li.removeAttribute("role");
                        li.removeAttribute("tabIndex");
                        li.removeAttribute("aria-checked");
                    });
                isUpdatingRef.current = false;
                return true;
            }

            // Create new checkbox list
            const ul = document.createElement("ul");
            ul.classList.add("rte-checkbox-list");

            const li = document.createElement("li");
            updateListItemChecked(li, false);
            const textNode = document.createTextNode(" ");
            li.appendChild(textNode);
            ul.appendChild(li);

            // Find block element to replace
            const blockElement = element.closest(
                "p, div, h1, h2, h3, h4, h5, h6, blockquote"
            );
            const isValidBlockElement =
                blockElement &&
                blockElement !== editor &&
                editor.contains(blockElement) &&
                blockElement.parentElement;

            if (isValidBlockElement) {
                const textContent = blockElement.textContent || "";
                blockElement.parentElement!.replaceChild(ul, blockElement);
                const finalTextNode = li.firstChild as Text;
                if (finalTextNode) {
                    finalTextNode.textContent = textContent || " ";
                    const cursorPos = textContent ? textContent.length : 0;
                    setCursorInTextNode(finalTextNode, cursorPos, editor);
                }
            } else {
                try {
                    range.deleteContents();
                    range.insertNode(ul);
                    const finalTextNode = li.firstChild as Text;
                    if (finalTextNode) {
                        setCursorInTextNode(finalTextNode, 0, editor);
                    }
                } catch (_) {
                    editor.appendChild(ul);
                    const finalTextNode = li.firstChild as Text;
                    if (finalTextNode) {
                        setCursorInTextNode(finalTextNode, 0, editor);
                    }
                }
            }

            // After insertion: ensure attributes and save to history
            setTimeout(() => {
                if (!editor) return;
                ensureAllCheckboxes(editor);
                const content = getDomContent();
                pushToHistory(content);
                isUpdatingRef.current = false;
                notifyChange(content);
            }, 100);

            return true;
        },
        [isUpdatingRef, getDomContent, pushToHistory, notifyChange]
    );

    return {
        ensureAllCheckboxes,
        insertCheckboxList,
        handleCheckboxKeyDown,
        handleCheckboxEnter,
        updateListItemChecked,
    };
}
