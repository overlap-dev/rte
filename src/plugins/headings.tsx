import { Dropdown } from "../components/Dropdown";
import { ButtonProps, EditorAPI, Plugin } from "../types";
import { getCurrentHeading } from "../utils/stateReflection";

const defaultHeadings = ["h1", "h2", "h3"];

const headingLabels: Record<string, string> = {
    h1: "Heading 1",
    h2: "Heading 2",
    h3: "Heading 3",
    h4: "Heading 4",
    h5: "Heading 5",
    h6: "Heading 6",
};

export function createHeadingsPlugin(
    headings: string[] = defaultHeadings
): Plugin {
    const options = [
        { value: "p", label: "Normal", headingPreview: "p" },
        ...headings.map((h) => ({
            value: h,
            label: headingLabels[h] || h.toUpperCase(),
            headingPreview: h,
        })),
    ];

    return {
        name: "headings",
        type: "block",
        renderButton: (
            props: ButtonProps & {
                onSelect?: (value: string) => void;
                editorAPI?: EditorAPI;
                currentValue?: string;
            }
        ) => {
            // Aktuelles Heading aus State Reflection
            const currentValue =
                props.currentValue ||
                (props.editorAPI
                    ? getCurrentHeading(props.editorAPI, headings)
                    : undefined);

            return (
                <Dropdown
                    icon="mdi:format-header-1"
                    label="Heading"
                    options={options}
                    onSelect={(value) => {
                        if (props.onSelect) {
                            props.onSelect(value);
                        } else {
                            props.onClick();
                        }
                    }}
                    currentValue={currentValue}
                    disabled={props.disabled}
                />
            );
        },
        getCurrentValue: (editor: EditorAPI) => {
            return getCurrentHeading(editor, headings);
        },
        execute: (editor: EditorAPI, value?: string) => {
            const tag = value || "p";
            editor.executeCommand("formatBlock", `<${tag}>`);
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
            return headings.includes(tagName);
        },
        canExecute: () => true,
    };
}
