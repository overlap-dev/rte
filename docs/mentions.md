# Mentions

Pass a `mentions` option to the `<Editor>` to get an `@` suggestion popup. Mentions are inserted as atomic inline elements and survive HTML export/import, copy & paste, undo/redo and clear formatting.

## Quick Start

```tsx
import { Editor, extractMentions, MentionItem } from "@overlap/rte";

const users: MentionItem[] = [
    { id: "jane@example.com", label: "Jane Doe" },
    { id: "john@example.com", label: "John Smith" },
];

<Editor
    mentions={{
        fetchItems: (query) =>
            users.filter((u) =>
                u.label.toLowerCase().includes(query.toLowerCase()),
            ),
    }}
    onChange={(content) => {
        const mentionedIds = extractMentions(content).map((m) => m.id);
    }}
/>;
```

## `MentionOptions`

```typescript
interface MentionItem {
    id: string;    // stored in data-mention-id (user id, email, …)
    label: string; // displayed text; the trigger is prepended automatically
    [key: string]: unknown; // anything else you need in renderItem
}

interface MentionOptions {
    trigger?: string; // default "@"
    fetchItems: (query: string) => MentionItem[] | Promise<MentionItem[]>;
    renderItem?: (item: MentionItem, isActive: boolean) => React.ReactNode;
}
```

- `fetchItems` is called with the text typed after the trigger (empty string right after `@`). It may be async; stale responses are discarded. Returning an empty array closes the popup.
- `renderItem` lets you render avatars, e-mails etc. The row container (`.rte-mention-item`) and its active state are handled by the editor.

## Behavior

| Action | Result |
|---|---|
| Type `@` (at start of text or after whitespace) | Popup opens with suggestions |
| Keep typing | Query updates; up to two words (`@Jane Doe`) are matched |
| `ArrowUp` / `ArrowDown` | Move the active row |
| `Enter` / `Tab` | Insert the active suggestion |
| `Escape`, click outside, caret leaves the query | Close the popup |
| `Backspace` on a mention | Removes the whole mention (it is `contenteditable="false"`) |

The popup is not shown inside code blocks, inline code, links or existing mentions. It is rendered into `document.body` with `position: fixed`, so it is never clipped by scroll containers.

## Data Model

JSON:

```json
{ "type": "mention", "attributes": { "id": "jane@example.com", "label": "@Jane Doe" } }
```

HTML (`exportHtml()` / `contentToHTML()`):

```html
<span class="rte-mention" data-mention-id="jane@example.com">@Jane Doe</span>
```

Inside the editor the span additionally carries `contenteditable="false"` so it behaves as one atomic unit; that attribute is stripped from exported HTML and re-applied on import. `htmlToContent()` and paste recognise `data-mention-id` and restore the mention node. Markdown export (`contentToMarkdown`) emits the plain label.

## Styling

```css
.rte-mention              /* the inline pill inside the editor */
.rte-mention-popup        /* suggestion list */
.rte-mention-item         /* one row */
.rte-mention-item-active  /* keyboard / hover highlighted row */
```

The pill uses `--rte-primary-color` and `--rte-primary-light`, so it follows the editor theme. When you render exported HTML outside the editor, style `.rte-mention` yourself.
