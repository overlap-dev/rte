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
    const showCodeBlock = blockOptions.codeBlock ?? false;
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

        const tagName = element.tagName.toLowerCase();

        if (headings.includes(tagName)) return tagName;
        if (element.closest("blockquote")) return "blockquote";
        if (findClosestCheckboxList(element)) return "checkbox-list";
        if (element.closest("ul")) return "ul";
        if (element.closest("ol")) return "ol";
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

            if (value === "checkbox-list") {
                const selection = editor.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    const element =
                        container.nodeType === Node.TEXT_NODE
                            ? container.parentElement
                            : (container as HTMLElement);

                    if (!element) return;

                    const checkboxList = findClosestCheckboxList(element);
                    if (checkboxList) {
                        // Remove checkbox list: convert to normal list
                        checkboxList.classList.remove("rte-checkbox-list");
                        checkboxList
                            .querySelectorAll("li[role='checkbox']")
                            .forEach((li) => {
                                li.removeAttribute("role");
                                li.removeAttribute("tabIndex");
                                li.removeAttribute("aria-checked");
                            });
                    } else {
                        editor.executeCommand("insertCheckboxList");
                    }
                }
            } else if (value === "ul") {
                editor.executeCommand("insertUnorderedList");
            } else if (value === "ol") {
                editor.executeCommand("insertOrderedList");
            } else if (value === "blockquote") {
                const selection = editor.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    const element =
                        container.nodeType === Node.TEXT_NODE
                            ? container.parentElement
                            : (container as HTMLElement);

                    if (element?.closest("blockquote")) {
                        editor.executeCommand("formatBlock", "<p>");
                    } else {
                        editor.executeCommand("formatBlock", "<blockquote>");
                    }
                }
            } else {
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

            const tagName = element.tagName.toLowerCase();
            return (
                headings.includes(tagName) ||
                element.closest("blockquote") !== null ||
                findClosestCheckboxList(element) !== null ||
                element.closest("ul") !== null ||
                element.closest("ol") !== null
            );
        },
        canExecute: () => true,
    };
}
