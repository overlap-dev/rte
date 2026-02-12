import { Dropdown } from "../components/Dropdown";
import { EditorAPI, Plugin } from "../types";

const alignmentLabels: Record<string, string> = {
    left: "Left",
    center: "Center",
    right: "Right",
    justify: "Justify",
};

const alignmentIcons: Record<string, string> = {
    left: "mdi:format-align-left",
    center: "mdi:format-align-center",
    right: "mdi:format-align-right",
    justify: "mdi:format-align-justify",
};

const alignmentCommands: Record<string, string> = {
    left: "justifyLeft",
    center: "justifyCenter",
    right: "justifyRight",
    justify: "justifyFull",
};

/**
 * Detects current text alignment at cursor position.
 */
function detectCurrentAlignment(): string | undefined {
    if (typeof document === "undefined") return undefined;
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return undefined;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element =
        container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as HTMLElement);

    if (!element) return undefined;

    // Walk up to find the block-level element
    let block: HTMLElement | null = element;
    const blockTags = new Set([
        "P",
        "DIV",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "LI",
        "BLOCKQUOTE",
        "TD",
        "TH",
    ]);
    while (block && !blockTags.has(block.tagName)) {
        block = block.parentElement;
    }

    if (!block) return undefined;

    const align = block.style.textAlign || window.getComputedStyle(block).textAlign;
    if (align === "center") return "center";
    if (align === "right") return "right";
    if (align === "justify") return "justify";
    return "left";
}

/**
 * Creates an alignment plugin with a dropdown.
 * @param alignments - Which alignments to offer, defaults to all four.
 */
export function createAlignmentPlugin(
    alignments: string[] = ["left", "center", "right", "justify"]
): Plugin {
    const options = alignments.map((a) => ({
        value: a,
        label: alignmentLabels[a] || a,
        icon: alignmentIcons[a],
    }));

    return {
        name: "alignment",
        type: "block",
        renderButton: (props) => {
            const onSelect = props.onSelect as
                | ((value: string) => void)
                | undefined;
            const currentValue =
                (props.currentValue as string | undefined) ||
                detectCurrentAlignment() ||
                "left";

            return (
                <Dropdown
                    icon={alignmentIcons[currentValue] || "mdi:format-align-left"}
                    label="Alignment"
                    options={options}
                    onSelect={(value) => {
                        if (onSelect) onSelect(value);
                    }}
                    currentValue={currentValue}
                    disabled={props.disabled}
                />
            );
        },
        getCurrentValue: () => detectCurrentAlignment(),
        execute: (_editor: EditorAPI, value?: string) => {
            if (!value) return;
            const command = alignmentCommands[value];
            if (command) {
                document.execCommand(command, false);
            }
        },
        isActive: () => {
            const align = detectCurrentAlignment();
            return align !== undefined && align !== "left";
        },
        canExecute: () => true,
    };
}

/** Pre-built alignment plugin with all four options */
export const alignmentPlugin: Plugin = createAlignmentPlugin();
