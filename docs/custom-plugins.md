# Creating Custom Plugins

Every toolbar feature in the editor is a plugin. Creating your own is straightforward -- it's just a TypeScript object.

## Plugin Interface

```typescript
interface Plugin {
    name: string;
    type: "inline" | "block" | "command";
    command?: string;
    renderButton?: (props: ButtonProps & Record<string, unknown>) => React.ReactNode;
    execute?: (editor: EditorAPI, value?: string) => void;
    isActive?: (editor: EditorAPI) => boolean;
    canExecute?: (editor: EditorAPI) => boolean;
    getCurrentValue?: (editor: EditorAPI) => string | undefined;
}
```

## Simple Example: Highlight Plugin

```tsx
import { Plugin, EditorAPI, ButtonProps } from "@overlap/rte";

const highlightPlugin: Plugin = {
    name: "highlight",
    type: "inline",

    renderButton: (props: ButtonProps) => (
        <button
            onClick={props.onClick}
            className={`rte-toolbar-button ${
                props.isActive ? "rte-toolbar-button-active" : ""
            }`}
            title="Highlight"
            aria-label="Highlight"
        >
            H
        </button>
    ),

    execute: (editor: EditorAPI) => {
        editor.executeCommand("backColor", "#ffff00");
    },

    isActive: () => {
        const sel = document.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        const el = sel.getRangeAt(0).commonAncestorContainer;
        const parent = el.nodeType === Node.TEXT_NODE
            ? el.parentElement
            : (el as HTMLElement);
        return parent?.closest('[style*="background-color: rgb(255, 255, 0)"]') !== null;
    },

    canExecute: () => true,
};
```

## Using Your Plugin

```tsx
import { Editor, defaultPlugins } from "@overlap/rte";

<Editor plugins={[...defaultPlugins, highlightPlugin]} />
```

## Plugin Fields Explained

### `name` (required)

Unique identifier string. Used as the React key in the toolbar.

### `type` (required)

- `"inline"` -- inline formatting (bold, italic, etc.)
- `"block"` -- block-level formatting (headings, lists, etc.)
- `"command"` -- actions (undo, redo, clear formatting, etc.)

### `renderButton`

Returns the React element for the toolbar button. Receives `ButtonProps`:

```typescript
interface ButtonProps {
    isActive: boolean;   // true if the format is currently applied
    onClick: () => void; // triggers execute()
    disabled?: boolean;  // true if canExecute() returns false
    icon?: string;
    label?: string;
}
```

Additional props passed by the toolbar:
- `onSelect: (value: string) => void` -- for dropdowns
- `editorAPI: EditorAPI` -- the editor API
- `currentValue: string | undefined` -- from getCurrentValue()

### `execute`

Called when the button is clicked. The `editor` parameter is the `EditorAPI`. The optional `value` parameter is used for dropdowns (e.g. color picker).

### `isActive`

Return `true` when the current selection has this format applied. This controls the active/highlight state of the toolbar button.

### `canExecute`

Return `false` to disable the button. For example, the indent plugin disables when the cursor is not in a list item.

### `getCurrentValue`

For dropdowns (font size, color), return the current value so the dropdown can show the active selection.

## Advanced Example: Emoji Picker Plugin

```tsx
const emojiPlugin: Plugin = {
    name: "emoji",
    type: "command",

    renderButton: (props: ButtonProps & { onSelect?: (v: string) => void }) => {
        const [open, setOpen] = useState(false);
        const emojis = ["😀", "😂", "❤️", "👍", "🎉", "🔥", "✨", "💡"];

        return (
            <div style={{ position: "relative", display: "inline-block" }}>
                <button
                    onClick={() => setOpen(!open)}
                    className="rte-toolbar-button"
                    title="Insert Emoji"
                >
                    😀
                </button>
                {open && (
                    <div style={{
                        position: "absolute",
                        top: "100%",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 4,
                        padding: 8,
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                        zIndex: 1000,
                    }}>
                        {emojis.map((e) => (
                            <button
                                key={e}
                                onClick={() => {
                                    document.execCommand("insertText", false, e);
                                    setOpen(false);
                                }}
                                style={{
                                    border: "none",
                                    background: "none",
                                    fontSize: 20,
                                    cursor: "pointer",
                                    padding: 4,
                                    borderRadius: 4,
                                }}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    },

    canExecute: () => true,
};
```

## Tips

- Use `editor.executeCommand()` for standard `document.execCommand` operations
- Use `editor.getSelection()` to read the current selection for custom DOM manipulation
- Use `editor.insertBlock()` or `editor.insertInline()` for element insertion
- Add `onMouseDown={(e) => e.preventDefault()}` to your button containers to prevent selection loss
- Use `aria-label` on buttons for accessibility
- Use the `rte-toolbar-button` and `rte-toolbar-button-active` CSS classes for consistent styling
