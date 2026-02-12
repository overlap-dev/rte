import { Dropdown } from "../components/Dropdown";
import { EditorAPI, Plugin } from "../types";
import { findClosestCheckboxList } from "../utils/dom";

const defaultHeadings = ["h1", "h2", "h3", "h4", "h5", "h6"];

const headingLabels: Record<string, string> = {
    h1: "Überschrift 1",
    h2: "Überschrift 2",
    h3: "Überschrift 3",
    h4: "Überschrift 4",
    h5: "Überschrift 5",
    h6: "Überschrift 6",
};

/**
 * Creates a Block Format plugin that combines headings, lists, and quote in a dropdown.
 * @param headings - Array of heading levels (e.g. ["h1", "h2", "h3"])
 */
export function createBlockFormatPlugin(
    headings: string[] = defaultHeadings
): Plugin {
    const options = [
        { value: "p", label: "Normal", headingPreview: "p" },
        ...headings.map((h) => ({
            value: h,
            label: headingLabels[h] || h.toUpperCase(),
            headingPreview: h,
        })),
        {
            value: "ul",
            label: "Aufzählungsliste",
            icon: "mdi:format-list-bulleted",
        },
        {
            value: "ol",
            label: "Nummerierte Liste",
            icon: "mdi:format-list-numbered",
        },
        {
            value: "checkbox-list",
            label: "Checkbox-Liste",
            icon: "mdi:checkbox-marked-outline",
        },
        {
            value: "blockquote",
            label: "Zitat",
            icon: "mdi:format-quote-close",
        },
    ];

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
