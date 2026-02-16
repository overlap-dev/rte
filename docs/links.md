# Links

## Basic Link Plugin

The simplest link option:

```tsx
import { linkPlugin } from "@overlap/rte";

<Editor plugins={[...otherPlugins, linkPlugin]} />
```

This provides a basic link button that prompts for a URL.

## Advanced Link Plugin

For a richer experience with a floating dialog:

```tsx
import { createAdvancedLinkPlugin } from "@overlap/rte";

const link = createAdvancedLinkPlugin({
    enableTarget: true,
    customFields: [...],
});

<Editor plugins={[...otherPlugins, link]} />
```

### Options

| Option | Type | Description |
|---|---|---|
| `enableTarget` | `boolean` | Show "Open in new tab" checkbox |
| `customFields` | `LinkCustomField[]` | Extra input fields in the dialog |

### Custom Fields

```tsx
interface LinkCustomField {
    key: string;           // Unique identifier
    label: string;         // Input label
    placeholder?: string;  // Input placeholder
    dataAttribute: string; // HTML attribute on the <a> tag
    appendToHref?: boolean;// Append value to the href
    disablesUrl?: boolean; // Hide URL field when this has a value
}
```

#### Example: Anchor Parameters

```tsx
const link = createAdvancedLinkPlugin({
    enableTarget: true,
    customFields: [
        {
            key: "urlExtra",
            label: "Anchor / Params",
            placeholder: "?param=value or #section",
            dataAttribute: "data-url-extra",
            appendToHref: true,
        },
    ],
});
```

## Auto-Linking

URLs typed in the editor are automatically converted to links when followed by a Space or Enter.

Supported patterns:
- `https://example.com`
- `http://example.com`
- `www.example.com` (auto-prefixed with `https://`)

Auto-created links have:
- `target="_blank"`
- `rel="noopener noreferrer"`

## Link Hover Tooltip

When hovering over a link in the editor, a tooltip appears showing:
- The full URL (truncated if too long)
- **Open** button -- opens the link in a new tab
- **Copy** button -- copies the URL to clipboard

The tooltip stays visible while the mouse is over the link or the tooltip itself.

## Keyboard Shortcut

- **Cmd/Ctrl + K** -- Opens the link dialog (clicks the link toolbar button)

## Editing Existing Links

Click on an existing link to open the link dialog pre-filled with the current values. You can edit the URL, toggle "open in new tab", or remove the link.

## Styling

```css
/* Link in editor content */
.rte-editor a {
    color: var(--rte-primary-color);
    text-decoration: underline;
    text-underline-offset: 2px;
}

/* Link hover tooltip */
.rte-link-tooltip {
    /* positioned via inline styles */
    background: var(--rte-content-bg);
    border: 1px solid var(--rte-border-color);
    border-radius: 6px;
    box-shadow: var(--rte-shadow-md);
}
```
