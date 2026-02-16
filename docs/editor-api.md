# Editor API

The `EditorAPI` object is available via the `onEditorAPIReady` callback. It provides programmatic control over the editor.

## Accessing the API

```tsx
import { Editor, EditorAPI } from "@overlap/rte";
import { useRef } from "react";

function MyEditor() {
    const apiRef = useRef<EditorAPI | null>(null);

    const handleSave = () => {
        const html = apiRef.current?.exportHtml();
        console.log(html);
    };

    return (
        <>
            <Editor onEditorAPIReady={(api) => { apiRef.current = api; }} />
            <button onClick={handleSave}>Save</button>
        </>
    );
}
```

## Methods

### Content

| Method | Returns | Description |
|---|---|---|
| `getContent()` | `EditorContent` | Get current content as JSON |
| `setContent(content)` | `void` | Replace editor content from JSON |
| `exportHtml()` | `string` | Export current content as HTML string |
| `importHtml(html)` | `EditorContent` | Import HTML string into the editor and return parsed content |

### Commands

| Method | Returns | Description |
|---|---|---|
| `executeCommand(command, value?)` | `boolean` | Execute a formatting command (wraps `document.execCommand`) |

Common commands:
- `"bold"`, `"italic"`, `"underline"`, `"strikeThrough"`
- `"formatBlock"` with value `"<h1>"`, `"<h2>"`, `"<p>"`, `"<pre>"`, `"<blockquote>"`
- `"insertOrderedList"`, `"insertUnorderedList"`
- `"foreColor"`, `"backColor"` with a hex color value
- `"fontSize"` with a size value
- `"insertHorizontalRule"`
- `"insertImage"` with a URL value
- `"insertCheckboxList"`

### Selection

| Method | Returns | Description |
|---|---|---|
| `getSelection()` | `Selection \| null` | Get the current browser Selection object |

### DOM Insertion

| Method | Returns | Description |
|---|---|---|
| `insertBlock(type, attrs?)` | `void` | Insert a block-level element at the cursor |
| `insertInline(type, attrs?)` | `void` | Insert/wrap an inline element around the selection |

### History

| Method | Returns | Description |
|---|---|---|
| `undo()` | `void` | Undo the last change |
| `redo()` | `void` | Redo the last undone change |
| `canUndo()` | `boolean` | Whether there is an undo entry |
| `canRedo()` | `boolean` | Whether there is a redo entry |

### Clear Formatting

| Method | Returns | Description |
|---|---|---|
| `clearFormatting()` | `void` | Remove all inline formatting from selection |
| `clearTextColor()` | `void` | Remove text color from selection |
| `clearBackgroundColor()` | `void` | Remove background color from selection |
| `clearFontSize()` | `void` | Remove font size from selection |
| `clearLinks()` | `void` | Remove links from selection (keep text) |

### List Operations

| Method | Returns | Description |
|---|---|---|
| `indentListItem()` | `void` | Indent the current list item |
| `outdentListItem()` | `void` | Outdent the current list item |

### Statistics

| Method | Returns | Description |
|---|---|---|
| `getTextStats()` | `{ characters: number; words: number }` | Get current character and word count |

```tsx
const stats = api.getTextStats();
console.log(`${stats.words} words, ${stats.characters} characters`);
```
