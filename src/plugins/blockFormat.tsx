import { Dropdown } from "../components/Dropdown";
import { EditorAPI, Plugin } from "../types";
import { findClosestCheckboxList } from "../utils/dom";

const defaultHeadings = ["h1", "h2", "h3", "h4", "h5", "h6"];

const headingLabels: Record<string, string> = {
    h1: "Heading 1",
    h2: "Heading 2",
    h3: "Heading 3",
    h4: "Heading 4",
    h5: "Heading 5",
    h6: "Heading 6",
};

export interface BlockFormatOptions {
    bulletList?: boolean;
    numberedList?: boolean;
    quote?: boolean;
    codeBlock?: boolean;
    check?: boolean;
}

/**
 * Creates a Block Format plugin that combines headings, lists, and quote in a dropdown.
 * @param headings - Array of heading levels (e.g. ["h1", "h2", "h3"])
 * @param blockOptions - Toggle individual block types (bulletList, numberedList, quote, check, codeBlock)
 */
export function createBlockFormatPlugin(
    headings: string[] = defaultHeadings,
    blockOptions: BlockFormatOptions = {}
): Plugin {
    // Default all block types to true if not specified
    const showBulletList = blockOptions.bulletList ?? true;
    const showNumberedList = blockOptions.numberedList ?? true;
    const showQuote = blockOptions.quote ?? true;
    const showCodeBlock = blockOptions.codeBlock ?? true;
    const showCheck = blockOptions.check ?? true;

    const options: { value: string; label: string; headingPreview?: string; icon?: string }[] = [
        { value: "p", label: "Normal", headingPreview: "p" },
        ...headings.map((h) => ({
            value: h,
            label: headingLabels[h] || h.toUpperCase(),
            headingPreview: h,
        })),
    ];

    if (showBulletList) {
        options.push({
            value: "ul",
            label: "Bullet List",
            icon: "mdi:format-list-bulleted",
        });
    }
    if (showNumberedList) {
        options.push({
            value: "ol",
            label: "Numbered List",
            icon: "mdi:format-list-numbered",
        });
    }
    if (showCheck) {
        options.push({
            value: "checkbox-list",
            label: "Checkbox List",
            icon: "mdi:checkbox-marked-outline",
        });
    }
    if (showQuote) {
        options.push({
            value: "blockquote",
            label: "Quote",
            icon: "mdi:format-quote-close",
        });
    }
    if (showCodeBlock) {
        options.push({
            value: "code",
            label: "Code Block",
            icon: "mdi:code-tags",
        });
    }

    /** Detects the current block format at the cursor position. */
    function detectCurrentFormat(editor: EditorAPI): string | undefined {
        const selection = editor.getSelection();
        if (!selection || selection.rangeCount === 0) return undefined;

        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element =
            container.nodeType === Node.TEXT_NODE
                ? container.parentElement
                : (container as HTMLElement);

        if (!element) return undefined;

        // When the selection spans multiple blocks, commonAncestorContainer
        // may be the editor root. Fall back to startContainer to detect
        // formats from an element that is actually inside the content.
        const startNode = range.startContainer;
        const startEl =
            startNode.nodeType === Node.TEXT_NODE
                ? startNode.parentElement
                : (startNode as HTMLElement);

        const tagName = element.tagName.toLowerCase();

        if (headings.includes(tagName)) return tagName;
        if (element.closest("pre") || startEl?.closest("pre")) return "code";
        if (element.closest("blockquote") || startEl?.closest("blockquote")) return "blockquote";
        if (findClosestCheckboxList(element) || (startEl && findClosestCheckboxList(startEl))) return "checkbox-list";
        if (element.closest("ul") || startEl?.closest("ul")) return "ul";
        if (element.closest("ol") || startEl?.closest("ol")) return "ol";
        if (tagName === "p") return "p";

        return undefined;
    }

    return {
        name: "blockFormat",
        type: "block",
        renderButton: (props) => {
            const editor = props.editorAPI as EditorAPI | undefined;
            const onSelect = props.onSelect as
                | ((value: string) => void)
                | undefined;
            let currentValue = props.currentValue as string | undefined;

            if (!currentValue && editor) {
                currentValue = detectCurrentFormat(editor);
            }

            return (
                <Dropdown
                    icon="mdi:format-paragraph"
                    label="Format"
                    options={options}
                    onSelect={(value) => {
                        if (onSelect) onSelect(value);
                    }}
                    currentValue={currentValue}
                    disabled={props.disabled}
                />
            );
        },
        getCurrentValue: (editor: EditorAPI) => detectCurrentFormat(editor),
        execute: (editor: EditorAPI, value?: string) => {
            if (!value) return;

            // Helper: get the element at the cursor
            const getCursorElement = (): HTMLElement | null => {
                const sel = editor.getSelection();
                if (!sel || sel.rangeCount === 0) return null;
                const range = sel.getRangeAt(0);
                const container = range.commonAncestorContainer;
                return container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : (container as HTMLElement);
            };

            // When the selection spans multiple blocks, commonAncestorContainer
            // is the editor root. Use startContainer to reach elements inside
            // the actual selected content.
            const getStartElement = (): HTMLElement | null => {
                const sel = editor.getSelection();
                if (!sel || sel.rangeCount === 0) return null;
                const start = sel.getRangeAt(0).startContainer;
                return start.nodeType === Node.TEXT_NODE
                    ? start.parentElement
                    : (start as HTMLElement);
            };

            const stripCheckboxAttributes = (list: HTMLElement) => {
                list.classList.remove("rte-checkbox-list");
                list.querySelectorAll("li[role='checkbox']").forEach((li) => {
                    li.removeAttribute("role");
                    li.removeAttribute("tabIndex");
                    li.removeAttribute("aria-checked");
                });
            };

            const findCheckboxInSelection = (): HTMLElement | null => {
                const el = getCursorElement();
                const startEl = getStartElement();
                return (
                    (el ? findClosestCheckboxList(el) : null) ||
                    (startEl ? findClosestCheckboxList(startEl) : null)
                );
            };

            // Helper: merge all adjacent <pre> elements in the editor into one
            const mergeAdjacentPre = () => {
                const refEl = getCursorElement() || getStartElement();
                const root = refEl?.closest('[contenteditable="true"]');
                if (!root) return;
                const children = Array.from(root.children);
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (child.tagName !== "PRE" || !child.parentElement)
                        continue;
                    while (child.nextElementSibling?.tagName === "PRE") {
                        const next = child.nextElementSibling;
                        child.appendChild(document.createTextNode("\n"));
                        while (next.firstChild) {
                            child.appendChild(next.firstChild);
                        }
                        next.remove();
                    }
                }
            };

            // Helper: if cursor is inside a list, remove the list first
            const escapeListIfNeeded = () => {
                const el = getCursorElement();
                const startEl = getStartElement();
                const inCheckbox = findCheckboxInSelection();
                const inUl = el?.closest("ul") || startEl?.closest("ul");
                const inOl = el?.closest("ol") || startEl?.closest("ol");
                if (inCheckbox) {
                    stripCheckboxAttributes(inCheckbox);
                    editor.executeCommand("insertUnorderedList");
                } else if (inUl) {
                    editor.executeCommand("insertUnorderedList");
                } else if (inOl) {
                    editor.executeCommand("insertOrderedList");
                }
            };

            if (value === "checkbox-list") {
                const checkboxList = findCheckboxInSelection();
                if (checkboxList) {
                    stripCheckboxAttributes(checkboxList);
                } else {
                    editor.executeCommand("insertCheckboxList");
                }
            } else if (value === "ul") {
                const checkboxList = findCheckboxInSelection();
                if (checkboxList) {
                    stripCheckboxAttributes(checkboxList);
                } else {
                    editor.executeCommand("insertUnorderedList");
                }
            } else if (value === "ol") {
                const checkboxList = findCheckboxInSelection();
                if (checkboxList) {
                    stripCheckboxAttributes(checkboxList);
                    const ol = document.createElement("ol");
                    while (checkboxList.firstChild) {
                        ol.appendChild(checkboxList.firstChild);
                    }
                    checkboxList.parentNode?.replaceChild(ol, checkboxList);
                } else {
                    editor.executeCommand("insertOrderedList");
                }
            } else if (value === "blockquote") {
                const el = getCursorElement();
                const startEl = getStartElement();
                const inBlockquote =
                    el?.closest("blockquote") || startEl?.closest("blockquote");
                if (inBlockquote) {
                    editor.executeCommand("formatBlock", "<p>");
                } else {
                    escapeListIfNeeded();
                    editor.executeCommand("formatBlock", "<blockquote>");
                }
            } else if (value === "code") {
                const el = getCursorElement();
                const startEl = getStartElement();
                const inPre = el?.closest("pre") || startEl?.closest("pre");
                if (inPre) {
                    editor.executeCommand("formatBlock", "<p>");
                } else {
                    escapeListIfNeeded();
                    editor.executeCommand("formatBlock", "<pre>");
                    mergeAdjacentPre();
                }
            } else {
                // Headings and "Normal" (p)
                escapeListIfNeeded();
                editor.executeCommand("formatBlock", `<${value}>`);
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

            const startNode = range.startContainer;
            const startEl =
                startNode.nodeType === Node.TEXT_NODE
                    ? startNode.parentElement
                    : (startNode as HTMLElement);

            const tagName = element.tagName.toLowerCase();
            return (
                headings.includes(tagName) ||
                element.closest("pre") !== null || startEl?.closest("pre") !== null ||
                element.closest("blockquote") !== null || startEl?.closest("blockquote") !== null ||
                findClosestCheckboxList(element) !== null || (startEl != null && findClosestCheckboxList(startEl) !== null) ||
                element.closest("ul") !== null || startEl?.closest("ul") !== null ||
                element.closest("ol") !== null || startEl?.closest("ol") !== null
            );
        },
        canExecute: () => true,
    };
}
