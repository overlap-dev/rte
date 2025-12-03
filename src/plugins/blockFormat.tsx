import { Dropdown } from "../components/Dropdown";
import { ButtonProps, EditorAPI, Plugin } from "../types";

const defaultHeadings = ["h1", "h2", "h3"];

const headingLabels: Record<string, string> = {
    h1: "Überschrift 1",
    h2: "Überschrift 2",
    h3: "Überschrift 3",
    h4: "Überschrift 4",
    h5: "Überschrift 5",
    h6: "Überschrift 6",
};

/**
 * Erstellt ein Block-Format-Plugin, das Headlines, Listen und Quote in einem Dropdown kombiniert
 * @param headings - Array von Heading-Levels (z.B. ["h1", "h2", "h3"])
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
        { value: "blockquote", label: "Zitat", icon: "mdi:format-quote-close" },
    ];

    return {
        name: "blockFormat",
        type: "block",
        renderButton: (
            props: ButtonProps & {
                onSelect?: (value: string) => void;
                editorAPI?: EditorAPI;
                currentValue?: string;
            }
        ) => {
            // Aktuelles Format bestimmen
            const editor = props.editorAPI;
            let currentValue = props.currentValue;

            if (!currentValue && editor) {
                const selection = editor.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    const element =
                        container.nodeType === Node.TEXT_NODE
                            ? container.parentElement
                            : (container as HTMLElement);

                    if (element) {
                        const tagName = element.tagName.toLowerCase();

                        // Prüfe auf Heading
                        if (headings.includes(tagName)) {
                            currentValue = tagName;
                        }
                        // Prüfe auf Blockquote
                        else if (element.closest("blockquote")) {
                            currentValue = "blockquote";
                        }
                        // Prüfe auf Liste
                        else if (element.closest("ul")) {
                            currentValue = "ul";
                        } else if (element.closest("ol")) {
                            currentValue = "ol";
                        }
                        // Prüfe auf Paragraph
                        else if (tagName === "p") {
                            currentValue = "p";
                        }
                    }
                }
            }

            return (
                <Dropdown
                    icon="mdi:format-header-1"
                    label="Format"
                    options={options}
                    onSelect={(value) => {
                        // onSelect wird von der Toolbar übergeben und ruft handlePluginClick auf
                        if (props.onSelect) {
                            props.onSelect(value);
                        }
                    }}
                    currentValue={currentValue}
                    disabled={props.disabled}
                />
            );
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

            const tagName = element.tagName.toLowerCase();

            // Prüfe auf Heading
            if (headings.includes(tagName)) {
                return tagName;
            }
            // Prüfe auf Blockquote
            if (element.closest("blockquote")) {
                return "blockquote";
            }
            // Prüfe auf Liste
            if (element.closest("ul")) {
                return "ul";
            }
            if (element.closest("ol")) {
                return "ol";
            }
            // Prüfe auf Paragraph
            if (tagName === "p") {
                return "p";
            }

            return undefined;
        },
        execute: (editor: EditorAPI, value?: string) => {
            if (!value) return;

            if (value === "ul") {
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
                element.closest("ul") !== null ||
                element.closest("ol") !== null
            );
        },
        canExecute: () => true,
    };
}
