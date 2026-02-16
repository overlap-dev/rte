# Plugins

The editor uses a plugin system to define toolbar buttons and their behavior. Every feature (bold, italic, lists, etc.) is a plugin.

## Default Plugins

When no `plugins` prop is provided, the editor uses `defaultPlugins`:

| Plugin | Name | Description |
|---|---|---|
| `undoPlugin` | `undo` | Undo button |
| `redoPlugin` | `redo` | Redo button |
| `defaultBlockFormatPlugin` | `blockFormat` | Dropdown for headings, lists, quote, code block, checkbox |
| `boldPlugin` | `bold` | Bold toggle |
| `italicPlugin` | `italic` | Italic toggle |
| `underlinePlugin` | `underline` | Underline toggle |
| `strikethroughPlugin` | `strikethrough` | Strikethrough toggle |
| `codeInlinePlugin` | `codeInline` | Inline code toggle |
| `subscriptPlugin` | `subscript` | Subscript toggle |
| `superscriptPlugin` | `superscript` | Superscript toggle |
| `horizontalRulePlugin` | `horizontalRule` | Insert horizontal rule |
| `clearFormattingPlugin` | `clearFormatting` | Remove all formatting |
| `indentListItemPlugin` | `indentListItem` | Indent list item |
| `outdentListItemPlugin` | `outdentListItem` | Outdent list item |

## Plugin Factories

These functions create configurable plugins:

### `createBlockFormatPlugin(headings?, options?)`

```tsx
import { createBlockFormatPlugin } from "@overlap/rte";

const blockFormat = createBlockFormatPlugin(
    ["h1", "h2", "h3"],  // heading levels
    {
        bulletList: true,
        numberedList: true,
        quote: true,
        codeBlock: true,
        check: true,      // checkbox lists
    }
);
```

### `createFontSizePlugin(sizes)`

```tsx
import { createFontSizePlugin } from "@overlap/rte";

const fontSize = createFontSizePlugin([12, 14, 16, 18, 20, 24, 28, 32]);
```

### `createTextColorPlugin(colors)`

```tsx
import { createTextColorPlugin } from "@overlap/rte";

const textColor = createTextColorPlugin([
    "#000000", "#ff0000", "#00aa00", "#0000ff"
]);
```

Includes a custom hex color input with native color picker at the bottom of the dropdown.

### `createBackgroundColorPlugin(colors)`

```tsx
import { createBackgroundColorPlugin } from "@overlap/rte";

const bgColor = createBackgroundColorPlugin([
    "#ffff00", "#00ff00", "#ff00ff"
]);
```

Also includes a custom hex color input.

### `createAlignmentPlugin(alignments)`

```tsx
import { createAlignmentPlugin } from "@overlap/rte";

const alignment = createAlignmentPlugin([
    "left", "center", "right", "justify"
]);
```

### `createAdvancedLinkPlugin(options?)`

```tsx
import { createAdvancedLinkPlugin } from "@overlap/rte";

const link = createAdvancedLinkPlugin({
    enableTarget: true,   // "Open in new tab" checkbox
    customFields: [       // extra fields in the link dialog
        {
            key: "urlExtra",
            label: "Anchor / Params",
            placeholder: "?param=value or #anchor",
            dataAttribute: "data-url-extra",
            appendToHref: true,
        },
    ],
});
```

### `createImagePlugin(onUpload?)`

```tsx
import { createImagePlugin } from "@overlap/rte";

const image = createImagePlugin(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const { url } = await res.json();
    return url;
});
```

## Standalone Plugins

These are ready-to-use without configuration:

| Import | Description |
|---|---|
| `linkPlugin` | Simple link plugin (from `plugins/optional`) |
| `blockquotePlugin` | Standalone blockquote toggle |
| `unorderedListPlugin` | Standalone bullet list toggle |
| `orderedListPlugin` | Standalone numbered list toggle |
| `tablePlugin` | Table insert + context menu |
| `advancedLinkPlugin` | Pre-configured advanced link plugin |

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

| Field | Description |
|---|---|
| `name` | Unique identifier |
| `type` | `"inline"` for formatting, `"block"` for block-level, `"command"` for actions |
| `command` | Optional command string for `executeCommand` |
| `renderButton` | Returns the toolbar button JSX |
| `execute` | Called when the button is clicked |
| `isActive` | Returns `true` if the format is currently active at the cursor |
| `canExecute` | Returns `false` to disable the button |
| `getCurrentValue` | Returns the current value (for dropdowns like font size, color) |

See [Custom Plugins](./custom-plugins.md) for a full guide on creating your own.
