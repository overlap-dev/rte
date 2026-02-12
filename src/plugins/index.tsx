import { IconWrapper } from "../components/IconWrapper";
import { ButtonProps, EditorAPI, Plugin } from "../types";
import { createCommandPlugin, createInlinePlugin } from "./base";
import { createBlockFormatPlugin } from "./blockFormat";
import { clearFormattingPlugin } from "./clearFormatting";

const defaultHeadings = ["h1", "h2", "h3", "h4", "h5", "h6"];

/**
 * Standard Plugins
 */
export const boldPlugin: Plugin = createInlinePlugin(
    "bold",
    "bold",
    "mdi:format-bold",
    "Bold"
);

export const italicPlugin: Plugin = createInlinePlugin(
    "italic",
    "italic",
    "mdi:format-italic",
    "Italic"
);

export const underlinePlugin: Plugin = createInlinePlugin(
    "underline",
    "underline",
    "mdi:format-underline",
    "Underline"
);

export const strikethroughPlugin: Plugin = createInlinePlugin(
    "strikethrough",
    "strikeThrough",
    "mdi:format-strikethrough",
    "Strikethrough"
);

export const subscriptPlugin: Plugin = createInlinePlugin(
    "subscript",
    "subscript",
    "mdi:format-subscript",
    "Subscript"
);

export const superscriptPlugin: Plugin = createInlinePlugin(
    "superscript",
    "superscript",
    "mdi:format-superscript",
    "Superscript"
);

export const codeInlinePlugin: Plugin = {
    name: "codeInline",
    type: "inline",
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            className={`rte-toolbar-button ${
                props.isActive ? "rte-toolbar-button-active" : ""
            }`}
            title="Code"
            aria-label="Code"
        >
            <IconWrapper icon="mdi:code-tags" width={18} height={18} />
        </button>
    ),
    execute: (editor: EditorAPI) => {
        const selection = editor.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element =
            container.nodeType === Node.TEXT_NODE
                ? container.parentElement
                : (container as HTMLElement);
        const existingCode = element?.closest("code");
        if (existingCode) {
            // Unwrap code
            const parent = existingCode.parentNode;
            if (parent) {
                while (existingCode.firstChild) {
                    parent.insertBefore(existingCode.firstChild, existingCode);
                }
                parent.removeChild(existingCode);
            }
        } else if (!range.collapsed) {
            // Wrap in code
            const code = document.createElement("code");
            try {
                range.surroundContents(code);
            } catch {
                // If surroundContents fails (partial selection), use extractContents
                const fragment = range.extractContents();
                code.appendChild(fragment);
                range.insertNode(code);
            }
        }
    },
    isActive: () => {
        if (typeof document === "undefined") return false;
        const selection = document.getSelection();
        if (!selection || selection.rangeCount === 0) return false;
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element =
            container.nodeType === Node.TEXT_NODE
                ? container.parentElement
                : (container as HTMLElement);
        return element?.closest("code") !== null;
    },
    canExecute: () => true,
};

export const undoPlugin: Plugin = createCommandPlugin(
    "undo",
    "undo",
    "mdi:undo",
    "Undo"
);

export const redoPlugin: Plugin = createCommandPlugin(
    "redo",
    "redo",
    "mdi:redo",
    "Redo"
);

/**
 * Indent List Item Plugin
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
            title="Indent"
            aria-label="Indent"
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
 * Outdent List Item Plugin
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
            title="Outdent"
            aria-label="Outdent"
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

        // Check if in nested list
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
 * Standard Plugin List
 * Plugins are referenced here directly to ensure they are included in defaultPlugins
 */
const _indentPlugin = indentListItemPlugin;
const _outdentPlugin = outdentListItemPlugin;

/**
 * Standard Block Format Plugin (headings, lists, quote in a dropdown)
 * Uses h1, h2, h3 by default, but can be customized via Editor props
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
