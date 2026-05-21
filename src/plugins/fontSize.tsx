import { Dropdown } from "../components/Dropdown";
import { ButtonProps, EditorAPI, Plugin } from "../types";
import { getCurrentFontSize } from "../utils/stateReflection";

export function createFontSizePlugin(
    fontSizes: number[] = [12, 14, 16, 18, 20, 24],
): Plugin {
    return {
        name: "fontSize",
        type: "inline",
        renderButton: (
            props: ButtonProps & {
                fontSizes?: number[];
                onSelect?: (value: string) => void;
                editorAPI?: EditorAPI;
                currentValue?: string;
            },
        ) => {
            const sizes = props.fontSizes || fontSizes;
            const options = sizes.map((size) => ({
                value: size.toString(),
                label: `${size}px`,
                preview: size.toString(),
            }));

            // Aktuelle Font-Size aus State Reflection
            const currentValue =
                props.currentValue ||
                (props.editorAPI
                    ? getCurrentFontSize(props.editorAPI)
                    : undefined);

            return (
                <Dropdown
                    icon="mdi:format-size"
                    label="Font Size"
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
            return getCurrentFontSize(editor);
        },
        execute: (editor: EditorAPI, value?: string) => {
            if (value) {
                // Set inline style for precise size
                const selection = editor.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    let element: HTMLElement | null = null;

                    if (
                        range.commonAncestorContainer.nodeType ===
                        Node.TEXT_NODE
                    ) {
                        element = range.commonAncestorContainer.parentElement;
                    } else {
                        element = range.commonAncestorContainer as HTMLElement;
                    }

                    if (element) {
                        const span = document.createElement("span");
                        span.style.fontSize = `${value}px`;

                        try {
                            range.surroundContents(span);
                        } catch (e) {
                            const contents = range.extractContents();
                            span.appendChild(contents);
                            range.insertNode(span);
                        }

                        range.setStartAfter(span);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);

                        // surroundContents() does not fire an `input` event;
                        // dispatch one so onChange/exportHtml see the change.
                        const editorEl = element.closest(
                            '[contenteditable="true"]',
                        ) as HTMLElement | null;
                        editorEl?.dispatchEvent(
                            new Event("input", { bubbles: true }),
                        );
                    }
                }
            }
        },
        canExecute: () => true,
    };
}
