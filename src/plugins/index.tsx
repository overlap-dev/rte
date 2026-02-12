import { IconWrapper } from "../components/IconWrapper";
import { ButtonProps, EditorAPI, Plugin } from "../types";
import { createCommandPlugin, createInlinePlugin } from "./base";
import { createBlockFormatPlugin } from "./blockFormat";
import { clearFormattingPlugin } from "./clearFormatting";

const defaultHeadings = ["h1", "h2", "h3", "h4", "h5", "h6"];

/**
 * Standard-Plugins
 */
export const boldPlugin: Plugin = createInlinePlugin(
    "bold",
    "bold",
    "mdi:format-bold",
    "Fett"
);

export const italicPlugin: Plugin = createInlinePlugin(
    "italic",
    "italic",
    "mdi:format-italic",
    "Kursiv"
);

export const underlinePlugin: Plugin = createInlinePlugin(
    "underline",
    "underline",
    "mdi:format-underline",
    "Unterstrichen"
);

export const undoPlugin: Plugin = createCommandPlugin(
    "undo",
    "undo",
    "mdi:undo",
    "Rückgängig"
);

export const redoPlugin: Plugin = createCommandPlugin(
    "redo",
    "redo",
    "mdi:redo",
    "Wiederholen"
);

/**
 * Indent List Item Plugin (Tab für Unterliste)
 */
const indentListItemPlugin: Plugin = {
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
const outdentListItemPlugin: Plugin = {
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

// Export plugins for direct use
export { indentListItemPlugin, outdentListItemPlugin };

/**
 * Standard-Plugin-Liste
 * Die Plugins werden hier direkt referenziert, um sicherzustellen, dass sie in defaultPlugins enthalten sind
 */
const _indentPlugin = indentListItemPlugin;
const _outdentPlugin = outdentListItemPlugin;

/**
 * Standard Block-Format Plugin (Headlines, Listen, Quote in einem Dropdown)
 * Verwendet standardmäßig h1, h2, h3, kann aber über Editor-Props angepasst werden
 */
const defaultBlockFormatPlugin = createBlockFormatPlugin(defaultHeadings);

export const defaultPlugins: Plugin[] = [
    undoPlugin,
    redoPlugin,
    defaultBlockFormatPlugin,
    boldPlugin,
    italicPlugin,
    underlinePlugin,
    clearFormattingPlugin,
    _indentPlugin,
    _outdentPlugin,
];
