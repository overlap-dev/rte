import { useCallback, useEffect } from "react";
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
} from "../utils/dom";

interface UseCheckboxOptions {
    editorRef: React.RefObject<HTMLDivElement | null>;
    isUpdatingRef: { current: boolean };
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
                    ? clientX >= rect.right
                    : clientX <= rect.left;

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
                    ? clientX >= rect.right
                    : clientX <= rect.left;

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

            const editor = editorRef.current;

            // If the current item is empty, break out of the list
            const itemText = (listItem.textContent || "").trim();
            if (itemText === "" || itemText === "\u200B") {
                // Remove the empty list item
                checkboxList.removeChild(listItem);

                // If the list is now empty, remove it entirely
                if (checkboxList.children.length === 0) {
                    const p = document.createElement("p");
                    const br = document.createElement("br");
                    p.appendChild(br);
                    checkboxList.parentNode?.replaceChild(p, checkboxList);

                    const newRange = document.createRange();
                    newRange.setStart(p, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } else {
                    // Insert a <p> after the list and place cursor there
                    const p = document.createElement("p");
                    const br = document.createElement("br");
                    p.appendChild(br);
                    checkboxList.parentNode?.insertBefore(
                        p,
                        checkboxList.nextSibling,
                    );

                    const newRange = document.createRange();
                    newRange.setStart(p, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }

                if (editor) {
                    const content = getDomContent();
                    pushToHistory(content);
                    notifyChange(content);
                }
                return true;
            }

            // Normal case: split content at cursor and create a new checkbox item
            const afterRange = document.createRange();
            afterRange.setStart(range.startContainer, range.startOffset);
            if (listItem.lastChild) {
                afterRange.setEndAfter(listItem.lastChild);
            } else {
                afterRange.setEnd(listItem, listItem.childNodes.length);
            }
            const afterFragment = afterRange.extractContents();

            const newLi = document.createElement("li");
            updateListItemChecked(newLi, false);

            const hasContent = afterFragment.textContent?.trim();
            if (hasContent) {
                newLi.appendChild(afterFragment);
            } else {
                newLi.appendChild(document.createTextNode(" "));
            }

            if (listItem.nextSibling) {
                checkboxList.insertBefore(newLi, listItem.nextSibling);
            } else {
                checkboxList.appendChild(newLi);
            }

            if (!listItem.firstChild) {
                listItem.appendChild(document.createTextNode(" "));
            }

            if (editor) ensureAllCheckboxes(editor);

            const cursorNode = newLi.firstChild || newLi;
            const newRange = document.createRange();
            newRange.setStart(cursorNode, 0);
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
        [editorRef, getDomContent, pushToHistory, notifyChange],
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

            // Resolve the element at the start of the selection as well,
            // because when selecting across multiple list items the
            // commonAncestorContainer is the editor root (above the list).
            const startNode = range.startContainer;
            const startElement =
                startNode.nodeType === Node.TEXT_NODE
                    ? startNode.parentElement
                    : (startNode as HTMLElement);

            // Already in a checkbox list? Remove it (convert back to bullet list).
            const existingList =
                findClosestCheckboxList(element) ||
                (startElement ? findClosestCheckboxList(startElement) : null);
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

            // Already in a <ul> (bullet list)? Convert in-place to checkbox.
            const existingUl =
                (element.closest("ul") as HTMLElement | null) ||
                (startElement?.closest("ul") as HTMLElement | null);
            if (existingUl && editor.contains(existingUl)) {
                existingUl.classList.add("rte-checkbox-list");
                existingUl.querySelectorAll(":scope > li").forEach((li) => {
                    updateListItemChecked(li as HTMLLIElement, false);
                });
                ensureAllCheckboxes(editor);
                isUpdatingRef.current = false;
                const content = getDomContent();
                pushToHistory(content);
                notifyChange(content);
                return true;
            }

            // Already in an <ol> (numbered list)? Convert to <ul> first,
            // then make it a checkbox list.
            const existingOl =
                (element.closest("ol") as HTMLElement | null) ||
                (startElement?.closest("ol") as HTMLElement | null);
            if (existingOl && editor.contains(existingOl)) {
                const ul = document.createElement("ul");
                ul.classList.add("rte-checkbox-list");
                while (existingOl.firstChild) {
                    ul.appendChild(existingOl.firstChild);
                }
                existingOl.parentNode?.replaceChild(ul, existingOl);
                ul.querySelectorAll(":scope > li").forEach((li) => {
                    updateListItemChecked(li as HTMLLIElement, false);
                });
                ensureAllCheckboxes(editor);
                isUpdatingRef.current = false;
                const content = getDomContent();
                pushToHistory(content);
                notifyChange(content);
                return true;
            }

            // Not in any list: use the browser's insertUnorderedList command
            // to properly handle single paragraphs and multi-paragraph selections,
            // then convert the resulting <ul> to a checkbox list.
            if (document.activeElement !== editor) {
                editor.focus();
            }
            document.execCommand("insertUnorderedList", false);

            // Find the <ul> the cursor is now inside
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const r = sel.getRangeAt(0);
                const node =
                    r.commonAncestorContainer.nodeType === Node.TEXT_NODE
                        ? r.commonAncestorContainer.parentElement
                        : (r.commonAncestorContainer as HTMLElement);
                const newUl = node?.closest("ul");
                if (newUl && editor.contains(newUl)) {
                    newUl.classList.add("rte-checkbox-list");
                    newUl.querySelectorAll(":scope > li").forEach((li) => {
                        updateListItemChecked(li as HTMLLIElement, false);
                    });
                }
            }

            // Finalize: ensure attributes and save to history
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
