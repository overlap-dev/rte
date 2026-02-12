/**
 * Pure checkbox utility functions for checkbox lists.
 * Supports detection of own format, Lexical format, and GitHub format.
 * No React dependencies.
 */

import { isCheckboxList, isNestedListItem } from "./dom";

/**
 * Updates a list item's checkbox attributes (role, aria-checked, tabindex).
 */
export function updateListItemChecked(
    li: HTMLLIElement,
    checked: boolean
): void {
    const parent = li.parentElement;
    if (
        !parent ||
        parent.tagName !== "UL" ||
        !isCheckboxList(parent) ||
        isNestedListItem(li)
    ) {
        li.removeAttribute("role");
        li.removeAttribute("tabIndex");
        li.removeAttribute("aria-checked");
        return;
    }
    li.setAttribute("role", "checkbox");
    li.setAttribute("tabIndex", "-1");
    li.setAttribute("aria-checked", checked ? "true" : "false");
}

/**
 * Toggles the checked state of a checkbox list item.
 */
export function toggleListItemChecked(li: HTMLLIElement): void {
    const currentChecked = li.getAttribute("aria-checked") === "true";
    li.setAttribute("aria-checked", currentChecked ? "false" : "true");
    if (li.getAttribute("role") !== "checkbox") {
        li.setAttribute("role", "checkbox");
        li.setAttribute("tabIndex", "-1");
    }
}

/**
 * Ensures all checkbox list items in the editor have correct attributes.
 * Normalizes foreign formats (Lexical, GitHub) to internal format.
 */
export function ensureAllCheckboxes(editor: HTMLElement): void {
    const allULs = editor.querySelectorAll("ul");
    allULs.forEach((ul) => {
        if (!isCheckboxList(ul)) return;

        // Normalize: ensure our class is always present
        if (!ul.classList.contains("rte-checkbox-list")) {
            ul.classList.add("rte-checkbox-list");
        }

        // Handle GitHub format: convert <input type="checkbox"> to aria-checked
        ul.querySelectorAll(":scope > li").forEach((li) => {
            const input = li.querySelector(
                'input[type="checkbox"]'
            ) as HTMLInputElement | null;
            if (input) {
                const checked =
                    input.checked || input.hasAttribute("checked");
                if (li.getAttribute("aria-checked") === null) {
                    (li as HTMLLIElement).setAttribute(
                        "aria-checked",
                        checked ? "true" : "false"
                    );
                }
                input.remove();
            }
        });

        const listItems = ul.querySelectorAll(":scope > li");
        listItems.forEach((li) => {
            const htmlLi = li as HTMLLIElement;
            if (!isNestedListItem(htmlLi)) {
                const ariaChecked = htmlLi.getAttribute("aria-checked");
                const checked = ariaChecked === "true";
                updateListItemChecked(htmlLi, checked);
            } else {
                htmlLi.removeAttribute("role");
                htmlLi.removeAttribute("tabIndex");
                htmlLi.removeAttribute("aria-checked");
            }
        });
    });
}

/**
 * Returns the currently focused checkbox list item, or null.
 */
export function getActiveCheckListItem(): HTMLElement | null {
    const activeElement = document.activeElement;
    if (
        activeElement &&
        activeElement.tagName === "LI" &&
        activeElement.parentElement &&
        isCheckboxList(activeElement.parentElement)
    ) {
        return activeElement as HTMLElement;
    }
    return null;
}

/**
 * Finds the next or previous checkbox list item sibling.
 */
export function findCheckListItemSibling(
    li: HTMLLIElement,
    backward: boolean
): HTMLLIElement | null {
    let sibling = backward
        ? (li.previousElementSibling as HTMLLIElement)
        : (li.nextElementSibling as HTMLLIElement);
    let parent: HTMLLIElement | null = li;

    // Walk up the tree to find a non-null sibling
    while (sibling == null && parent) {
        const parentList = parent.parentElement;
        if (parentList && parentList.tagName === "UL") {
            const grandParent = parentList.parentElement;
            if (grandParent && grandParent.tagName === "LI") {
                parent = grandParent as HTMLLIElement;
                sibling = backward
                    ? (parent.previousElementSibling as HTMLLIElement)
                    : (parent.nextElementSibling as HTMLLIElement);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    // Walk down the tree to find the first non-nested list item
    while (sibling && sibling.tagName === "LI") {
        const child = backward
            ? sibling.lastElementChild
            : sibling.firstElementChild;
        if (
            child &&
            (child.tagName === "UL" || child.tagName === "OL")
        ) {
            sibling = backward
                ? (child.lastElementChild as HTMLLIElement)
                : (child.firstElementChild as HTMLLIElement);
        } else {
            return sibling;
        }
    }

    return null;
}
