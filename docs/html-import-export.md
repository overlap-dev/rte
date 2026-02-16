# HTML Import / Export

The editor works with a JSON data model (`EditorContent`) internally, and provides utilities to convert between HTML and JSON.

## Data Model

```typescript
interface EditorContent {
    blocks: EditorNode[];
}

interface EditorNode {
    type: string;
    children?: EditorNode[];
    text?: string;
    attributes?: Record<string, string>;
}
```

### Example JSON

```json
{
    "blocks": [
        {
            "type": "h1",
            "children": [{ "type": "text", "text": "Hello World" }]
        },
        {
            "type": "p",
            "children": [
                { "type": "text", "text": "This is " },
                { "type": "bold", "children": [{ "type": "text", "text": "bold" }] },
                { "type": "text", "text": " text." }
            ]
        }
    ]
}
```

## Utilities

### `htmlToContent(html: string): EditorContent`

Parse an HTML string into the JSON data model.

```tsx
import { htmlToContent } from "@overlap/rte";

const content = htmlToContent("<p>Hello <strong>world</strong></p>");
// { blocks: [{ type: "p", children: [...] }] }
```

### `contentToHTML(content: EditorContent): string`

Convert JSON data model to an HTML string.

```tsx
import { contentToHTML } from "@overlap/rte";

const html = contentToHTML(content);
// "<p>Hello <strong>world</strong></p>"
```

### `createEmptyContent(): EditorContent`

Create an empty content object with a single empty paragraph.

```tsx
import { createEmptyContent } from "@overlap/rte";

const empty = createEmptyContent();
// { blocks: [{ type: "p", children: [{ type: "text", text: "" }] }] }
```

## EditorAPI Methods

```tsx
// Import HTML into a running editor
api.importHtml("<p>Hello</p>");

// Export HTML from a running editor
const html = api.exportHtml();
```

## HTML Sanitization

When HTML is pasted or imported, it is automatically sanitized:

- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>` tags are removed
- Event handler attributes (`onclick`, `onload`, etc.) are stripped
- `javascript:` URLs are removed from `href` and `src` attributes
- Only `https:`, `http:`, `mailto:`, `tel:`, and relative URLs are allowed

You can also use the sanitizer directly:

```tsx
import { sanitizeHtml } from "@overlap/rte";

const safe = sanitizeHtml(untrustedHtml);
```

## Lexical Compatibility

The parser handles Lexical-specific HTML patterns:

- `<span style="white-space: pre-wrap">` wrappers are unwrapped
- `__lexicallisttype="check"` attribute is recognized as checkbox list
- Lexical theme classes (`PlaygroundEditorTheme__*`) are stripped
- `role="checkbox"` and `aria-checked` attributes are preserved

```tsx
// Import Lexical HTML
const lexicalHtml = `<p class="PlaygroundEditorTheme__paragraph">
    <b><strong style="white-space: pre-wrap;">Bold text</strong></b>
</p>`;

api.importHtml(lexicalHtml);
// Works correctly, preserving bold formatting
```
