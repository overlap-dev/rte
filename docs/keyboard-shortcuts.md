# Keyboard Shortcuts

All keyboard shortcuts are built-in and work out of the box. They are integrated with the undo/redo history system.

## Formatting Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + U` | Underline |
| `Cmd/Ctrl + Shift + X` | Strikethrough |
| `Cmd/Ctrl + E` | Inline Code |
| `Cmd/Ctrl + Shift + 7` | Numbered List |
| `Cmd/Ctrl + Shift + 8` | Bullet List |

## Editing Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + Y` | Redo (alternative) |
| `Cmd/Ctrl + K` | Insert/Edit Link |
| `Cmd/Ctrl + Shift + V` | Paste as Plain Text |

## Navigation Shortcuts

| Shortcut | Context | Action |
|---|---|---|
| `Tab` | In a list item | Indent the list item |
| `Shift + Tab` | In a list item | Outdent the list item |
| `Tab` | In a table cell | Move to next cell |
| `Shift + Tab` | In a table cell | Move to previous cell |
| `Tab` | Normal text | Move focus out of the editor |
| `Enter` | Empty list item | Exit the list, create a paragraph |

## Toolbar Navigation

The toolbar follows the ARIA toolbar pattern:

| Shortcut | Action |
|---|---|
| `Arrow Right` | Focus next toolbar button |
| `Arrow Left` | Focus previous toolbar button |
| `Home` | Focus first toolbar button |
| `End` | Focus last toolbar button |

## Notes

- All shortcuts use `Cmd` on macOS and `Ctrl` on Windows/Linux
- Formatting shortcuts push a history snapshot before applying, so they are always undoable
- `Tab` only indents when inside a list item or table cell; in normal text it moves focus away from the editor for accessibility
