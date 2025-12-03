import { IconWrapper } from "../components/IconWrapper";
import { ButtonProps, EditorAPI, Plugin } from "../types";

/**
 * Indent List Item Plugin (Tab für Unterliste)
 */
export const indentListItemPlugin: Plugin = {
    name: "indentListItem",
    type: "command",
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            className="rte-toolbar-button"
            title="Einrücken (Unterliste)"
            aria-label="Einrücken (Unterliste)"
        >
            <IconWrapper
                icon="mdi:format-indent-increase"
                width={18}
                height={18}
            />
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.indentListItem();
    },
    canExecute: (editor: EditorAPI) => {
        const selection = editor.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const listItem =
            container.nodeType === Node.TEXT_NODE
                ? container.parentElement?.closest("li")
                : (container as HTMLElement).closest("li");

        return listItem !== null;
    },
};

/**
 * Outdent List Item Plugin (Shift+Tab)
 */
export const outdentListItemPlugin: Plugin = {
    name: "outdentListItem",
    type: "command",
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            className="rte-toolbar-button"
            title="Ausrücken"
            aria-label="Ausrücken"
        >
            <IconWrapper
                icon="mdi:format-indent-decrease"
                width={18}
                height={18}
            />
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.outdentListItem();
    },
    canExecute: (editor: EditorAPI) => {
        const selection = editor.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const listItem =
            container.nodeType === Node.TEXT_NODE
                ? container.parentElement?.closest("li")
                : (container as HTMLElement).closest("li");

        if (!listItem) return false;

        // Prüfe ob in verschachtelter Liste
        const list = listItem.parentElement;
        if (!list || (list.tagName !== "UL" && list.tagName !== "OL"))
            return false;

        const parentListItem = list.parentElement;
        return parentListItem !== null && parentListItem.tagName === "LI";
    },
};
