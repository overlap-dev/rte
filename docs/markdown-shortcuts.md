# Markdown Shortcuts

Type markdown-style triggers at the start of a line and they auto-convert to the corresponding format.

## Space-Triggered Shortcuts

Type the pattern and then press **Space**:

| You type | Result |
|---|---|
| `#` | Heading 1 |
| `##` | Heading 2 |
| `###` | Heading 3 |
| `####` | Heading 4 |
| `#####` | Heading 5 |
| `######` | Heading 6 |
| `-` or `*` | Bullet list |
| `1.` | Numbered list |
| `>` | Blockquote |
| `[]` | Checkbox list |

## Enter-Triggered Shortcuts

Type the pattern and then press **Enter**:

| You type | Result |
|---|---|
| ` ``` ` | Code block (`<pre>`) |
| `---` | Horizontal rule (`<hr>`) |

## How It Works

1. The editor watches for Space and Enter key presses
2. When pressed, it checks the text at the start of the current block
3. If a pattern matches, the trigger characters are removed and the block format is applied
4. The conversion happens instantly with no visible flicker

## Examples

### Creating a heading

```
Type: # My Title[Space]
Result: <h1>My Title</h1>
```

### Creating a bullet list

```
Type: - First item[Space]
Result: <ul><li>First item</li></ul>
```

### Creating a checkbox list

```
Type: [] Buy groceries[Space]
Result: <ul class="rte-checkbox-list"><li role="checkbox">Buy groceries</li></ul>
```

### Inserting a horizontal rule

```
Type: ---[Enter]
Result: <hr> followed by an empty paragraph
```

## Notes

- Markdown shortcuts only trigger at the **start** of a block element
- They work together with the standard keyboard shortcuts
- The auto-conversion pushes a change notification so `onChange` is called
- All markdown shortcuts can be undone with `Cmd+Z`
