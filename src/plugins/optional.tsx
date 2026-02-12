import { IconWrapper } from "../components/IconWrapper";
import { ButtonProps, EditorAPI, Plugin } from "../types";

/**
 * Link plugin with improved functionality
 */
export function createLinkPlugin(): Plugin {
    return {
        name: "link",
        type: "inline",
        command: "createLink",
        renderButton: (props: ButtonProps) => (
            <button
                type="button"
                onClick={props.onClick}
                disabled={props.disabled}
                className={`rte-toolbar-button ${
                    props.isActive ? "rte-toolbar-button-active" : ""
                }`}
                title="Insert Link"
                aria-label="Insert Link"
            >
                <IconWrapper icon="mdi:link" width={18} height={18} />
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

            // Check if a link already exists
            const existingLink = element?.closest("a") as HTMLAnchorElement;

            if (existingLink) {
                // Link entfernen
                const parent = existingLink.parentNode;
                if (parent) {
                    while (existingLink.firstChild) {
                        parent.insertBefore(
                            existingLink.firstChild,
                            existingLink
                        );
                    }
                    parent.removeChild(existingLink);
                    // Content aktualisieren
                    const editorEl = editor.getSelection()?.anchorNode;
                    if (editorEl) {
                        const content = editor.getContent();
                        editor.setContent(content);
                    }
                }
            } else {
                // Insert new link
                const url = prompt("Enter URL:");
                if (url) {
                    editor.executeCommand("createLink", url);
                }
            }
        },
        isActive: (editor: EditorAPI) => {
            const selection = editor.getSelection();
            if (!selection || selection.rangeCount === 0) return false;

            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element =
                container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : (container as HTMLElement);

            if (!element) return false;

            return element.closest("a") !== null;
        },
        getCurrentValue: (editor: EditorAPI) => {
            const selection = editor.getSelection();
            if (!selection || selection.rangeCount === 0) return undefined;

            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element =
                container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : (container as HTMLElement);

            if (!element) return undefined;

            const link = element.closest("a") as HTMLAnchorElement;
            return link ? link.href : undefined;
        },
        canExecute: (editor: EditorAPI) => {
            const selection = editor.getSelection();
            return selection !== null && selection.rangeCount > 0;
        },
    };
}

export const linkPlugin = createLinkPlugin();

/**
 * Blockquote-Plugin
 */
export const blockquotePlugin: Plugin = {
    name: "blockquote",
    type: "block",
    command: "formatBlock",
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            className={`rte-toolbar-button ${
                props.isActive ? "rte-toolbar-button-active" : ""
            }`}
            title="Quote"
            aria-label="Quote"
        >
            <IconWrapper icon="mdi:format-quote-close" width={18} height={18} />
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

        if (!element) return;

        const isBlockquote = element.closest("blockquote") !== null;

        if (isBlockquote) {
            editor.executeCommand("formatBlock", "<p>");
        } else {
            editor.executeCommand("formatBlock", "<blockquote>");
        }
    },
    isActive: (editor: EditorAPI) => {
        const selection = editor.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element =
            container.nodeType === Node.TEXT_NODE
                ? container.parentElement
                : (container as HTMLElement);

        if (!element) return false;

        return element.closest("blockquote") !== null;
    },
    canExecute: (editor: EditorAPI) => {
        const selection = editor.getSelection();
        return selection !== null && selection.rangeCount > 0;
    },
};

/**
 * Unordered List Plugin
 */
export const unorderedListPlugin: Plugin = {
    name: "unorderedList",
    type: "block",
    command: "insertUnorderedList",
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            className={`rte-toolbar-button ${
                props.isActive ? "rte-toolbar-button-active" : ""
            }`}
            title="Bullet List"
            aria-label="Bullet List"
        >
            <IconWrapper
                icon="mdi:format-list-bulleted"
                width={18}
                height={18}
            />
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.executeCommand("insertUnorderedList");
    },
    isActive: (editor: EditorAPI) => {
        if (typeof document === "undefined") return false;
        return document.queryCommandState("insertUnorderedList");
    },
    canExecute: (editor: EditorAPI) => {
        const selection = editor.getSelection();
        return selection !== null && selection.rangeCount > 0;
    },
};

/**
 * Ordered List Plugin
 */
export const orderedListPlugin: Plugin = {
    name: "orderedList",
    type: "block",
    command: "insertOrderedList",
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            className={`rte-toolbar-button ${
                props.isActive ? "rte-toolbar-button-active" : ""
            }`}
            title="Numbered List"
            aria-label="Numbered List"
        >
            <IconWrapper
                icon="mdi:format-list-numbered"
                width={18}
                height={18}
            />
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.executeCommand("insertOrderedList");
    },
    isActive: (editor: EditorAPI) => {
        if (typeof document === "undefined") return false;
        return document.queryCommandState("insertOrderedList");
    },
    canExecute: (editor: EditorAPI) => {
        const selection = editor.getSelection();
        return selection !== null && selection.rangeCount > 0;
    },
};
