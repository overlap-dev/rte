import { Dropdown } from "../components/Dropdown";
import { ButtonProps, EditorAPI, Plugin } from "../types";
import {
    getCurrentFontSize,
    getSelectedTextNodes,
} from "../utils/stateReflection";

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
            if (!value) return;

            const selection = editor.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const fontSize = `${value}px`;

            // Collapsed caret: nothing to wrap, keep previous no-op behavior.
            if (range.collapsed) return;

            // Process each genuinely-selected text node individually so the
            // change works even when the selection spans block boundaries
            // (the triple-click case that breaks range.surroundContents).
            const textNodes = getSelectedTextNodes(range);
            if (textNodes.length === 0) return;

            const referenceEl = textNodes[0].parentElement;
            const wrappedSpans: HTMLElement[] = [];

            for (const textNode of textNodes) {
                const parent = textNode.parentElement;
                if (!parent) continue;

                // If the text node fully fills its own <span>, mutate that span
                // directly. This avoids nested spans and stays idempotent on
                // repeated application.
                if (
                    parent.tagName === "SPAN" &&
                    parent.childNodes.length === 1 &&
                    parent.firstChild === textNode
                ) {
                    parent.style.fontSize = fontSize;
                    wrappedSpans.push(parent);
                    continue;
                }

                const span = document.createElement("span");
                span.style.fontSize = fontSize;
                parent.replaceChild(span, textNode);
                span.appendChild(textNode);
                wrappedSpans.push(span);
            }

            if (wrappedSpans.length > 0) {
                const newRange = document.createRange();
                newRange.setStartBefore(wrappedSpans[0]);
                newRange.setEndAfter(wrappedSpans[wrappedSpans.length - 1]);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }

            // Manual DOM mutation does not fire an `input` event;
            // dispatch one so onChange/exportHtml see the change.
            const editorEl = referenceEl?.closest(
                '[contenteditable="true"]',
            ) as HTMLElement | null;
            editorEl?.dispatchEvent(new Event("input", { bubbles: true }));
        },
        canExecute: () => true,
    };
}
