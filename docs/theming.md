# Theming

The editor can be themed via CSS variables, the `theme` prop, or class overrides.

## Theme Prop

The quickest way to customize colors:

```tsx
<Editor
    theme={{
        primaryColor: "#339192",
        borderColor: "#e0e0e0",
        borderRadius: 8,
        toolbarBg: "#fafafa",
        contentBg: "#ffffff",
        buttonHoverBg: "rgba(51, 145, 146, 0.08)",
    }}
/>
```

### Theme Properties

| Property | Type | Description |
|---|---|---|
| `primaryColor` | `string` | Accent color for active states, links, checkboxes |
| `borderColor` | `string` | Border color for container, toolbar, dropdowns |
| `borderRadius` | `number` | Border radius in pixels |
| `toolbarBg` | `string` | Toolbar background color |
| `contentBg` | `string` | Editor content area background |
| `buttonHoverBg` | `string` | Button hover background |

## CSS Variables

Override these on `.rte-container` or any parent element:

```css
:root {
    --rte-primary-color: #339192;
    --rte-primary-hover: #2a7a7b;
    --rte-primary-light: rgba(51, 145, 146, 0.15);
    --rte-border-color: #e5e7eb;
    --rte-border-radius: 8px;
    --rte-toolbar-bg: #f9fafb;
    --rte-button-hover-bg: #f3f4f6;
    --rte-button-active-bg: #e5e7eb;
    --rte-content-bg: #ffffff;
    --rte-text-color: #111827;
    --rte-text-secondary: #6b7280;
    --rte-danger-color: #dc2626;
    --rte-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --rte-line-height: 1.6;
    --rte-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --rte-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --rte-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --rte-shadow-popover: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --rte-padding-xs: 4px;
    --rte-padding-sm: 6px;
    --rte-padding-md: 8px;
    --rte-padding-lg: 12px;
    --rte-padding-xl: 16px;
    --rte-padding-2xl: 20px;
}
```

## CSS Class Overrides

Key classes available for styling:

### Container & Layout

| Class | Element |
|---|---|
| `.rte-container` | Outer wrapper |
| `.rte-container-readonly` | Added when `readOnly` is `true` |
| `.rte-toolbar` | Toolbar row |
| `.rte-toolbar-sticky` | Sticky toolbar variant |
| `.rte-toolbar-left` | Left section of toolbar |
| `.rte-toolbar-right` | Right section (clear formatting) |
| `.rte-toolbar-divider` | Vertical divider between toolbar sections |
| `.rte-editor` | Contenteditable area |
| `.rte-editor-readonly` | Added when `readOnly` is `true` |
| `.rte-floating-toolbar` | Floating toolbar on text selection |

### Buttons & Dropdowns

| Class | Element |
|---|---|
| `.rte-toolbar-button` | Toolbar button |
| `.rte-toolbar-button-active` | Active state (e.g. bold is on) |
| `.rte-dropdown` | Dropdown container |
| `.rte-dropdown-menu` | Dropdown popup |
| `.rte-dropdown-item` | Dropdown option |
| `.rte-dropdown-item-active` | Currently selected option |

### Content Elements

| Class | Element |
|---|---|
| `.rte-checkbox-list` | Checkbox list container |
| `.rte-image` | Image element |
| `.rte-table` | Table element |
| `.rte-word-count` | Word count bar |
| `.rte-link-tooltip` | Link hover tooltip |

## Example Themes

### Dark Mode

```tsx
<Editor
    theme={{
        borderColor: "#334155",
        toolbarBg: "#1e293b",
        contentBg: "#0f172a",
        primaryColor: "#60a5fa",
        buttonHoverBg: "#334155",
    }}
/>
```

### Brand Colors

```tsx
<Editor
    theme={{
        primaryColor: "#e11d48",
        borderColor: "#fecdd3",
        toolbarBg: "#fff1f2",
        buttonHoverBg: "#ffe4e6",
    }}
/>
```

### Minimal / Borderless

```css
.minimal-editor .rte-container {
    border: none;
    box-shadow: none;
}
.minimal-editor .rte-toolbar {
    background: transparent;
    border-bottom: 1px solid #f3f4f6;
}
```
