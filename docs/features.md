# Complete Feature Reference

## Inline Formatting

| Feature | Plugin | Shortcut | HTML Tag |
|---|---|---|---|
| Bold | `boldPlugin` | `Cmd+B` | `<b>` / `<strong>` |
| Italic | `italicPlugin` | `Cmd+I` | `<i>` / `<em>` |
| Underline | `underlinePlugin` | `Cmd+U` | `<u>` |
| Strikethrough | `strikethroughPlugin` | `Cmd+Shift+X` | `<s>` / `<strike>` |
| Inline Code | `codeInlinePlugin` | `Cmd+E` | `<code>` |
| Subscript | `subscriptPlugin` | — | `<sub>` |
| Superscript | `superscriptPlugin` | — | `<sup>` |

## Block Formatting

| Feature | Via | Markdown | HTML Tag |
|---|---|---|---|
| Heading 1-6 | Block format dropdown | `#` through `######` + Space | `<h1>` - `<h6>` |
| Paragraph | Block format dropdown | — | `<p>` |
| Bullet List | Block format dropdown | `-` or `*` + Space | `<ul>` |
| Numbered List | Block format dropdown | `1.` + Space | `<ol>` |
| Checkbox List | Block format dropdown | `[]` + Space | `<ul class="rte-checkbox-list">` |
| Blockquote | Block format dropdown | `>` + Space | `<blockquote>` |
| Code Block | Block format dropdown | ` ``` ` + Enter | `<pre>` |
| Horizontal Rule | Toolbar button / `---` + Enter | `---` + Enter | `<hr>` |

## Text Styling

| Feature | Plugin Factory | Description |
|---|---|---|
| Font Size | `createFontSizePlugin(sizes)` | Dropdown with configurable size presets |
| Text Color | `createTextColorPlugin(colors)` | Color picker with presets + custom hex input |
| Background Color | `createBackgroundColorPlugin(colors)` | Background picker with presets + custom hex input |
| Text Alignment | `createAlignmentPlugin(aligns)` | Left, center, right, justify |

## Links

| Feature | Description |
|---|---|
| Insert Link | Floating dialog with URL input |
| Edit Link | Click existing link to reopen dialog |
| Link Hover Tooltip | Shows URL + Open/Copy buttons on hover |
| Auto-Linking | URLs typed and followed by Space become links |
| Custom Fields | Extend the link dialog with extra fields |
| Open in New Tab | Optional checkbox in link dialog |

## Images

| Feature | Description |
|---|---|
| URL Insert | Enter an image URL in the modal |
| File Upload | Upload via file picker (requires `onImageUpload` callback) |
| Clipboard Paste | Paste an image from clipboard |
| Drag & Drop | Drop an image file onto the editor |
| Alt Text | Set alt text in the image modal |

## Tables

| Feature | Description |
|---|---|
| Insert Table | Specify rows and columns in a dialog |
| Tab Navigation | Tab/Shift+Tab to move between cells |
| Context Menu | Right-click for row/column operations |
| Add/Remove Rows | Insert above, insert below, delete row |
| Add/Remove Columns | Insert left, insert right, delete column |
| Delete Table | Remove the entire table |

## History

| Feature | Description |
|---|---|
| Undo | `Cmd+Z` or toolbar button |
| Redo | `Cmd+Shift+Z` / `Cmd+Y` or toolbar button |
| Cursor Restore | Undo/redo restores the exact cursor position |
| Debounced Snapshots | History snapshots are debounced during typing |

## UX Features

| Feature | Prop/Setting | Description |
|---|---|---|
| Read-Only Mode | `readOnly` | Display content without editing |
| Word Count | `showWordCount` | Show word/character count below editor |
| Max Length | `maxLength` | Prevent input beyond character limit |
| Focus/Blur Callbacks | `onFocus` / `onBlur` | React to editor focus state changes |
| Placeholder | `placeholder` | Text shown when editor is empty |
| Keyboard Shortcuts | Built-in | 14+ shortcuts for formatting and editing |
| Markdown Shortcuts | Built-in | 9 auto-format patterns |
| Toolbar Keyboard Nav | Built-in | Arrow keys to navigate toolbar buttons |
| Selection Preservation | Built-in | Clicking toolbar buttons doesn't lose selection |
| Floating Toolbar | Built-in | Appears on text selection with all formatting options |

## Security

| Feature | Description |
|---|---|
| HTML Sanitization | Pasted HTML is sanitized: `<script>`, `<iframe>`, event handlers, `javascript:` URLs are stripped |
| Allowlist-Based | Uses a tag/attribute allowlist approach |
| No Dependencies | Built-in sanitizer, no external library needed |

## Compatibility

| Feature | Description |
|---|---|
| Lexical HTML | Correctly parses and renders HTML from Lexical editors |
| GitHub HTML | Supports GitHub-flavored task lists and formatting |
| React 18+ | Compatible with React 18 and future React 19 |
| TypeScript | Fully typed with shipped `.d.ts` declarations |

## Indent / Outdent

| Feature | Trigger | Description |
|---|---|---|
| Indent | `Tab` in a list item | Nests the item one level deeper |
| Outdent | `Shift+Tab` in a list item | Moves the item one level up |
| List Escape | `Enter` on empty list item | Exits the list, creates a paragraph |
