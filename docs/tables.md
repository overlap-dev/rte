# Tables

## Setup

### Via Settings

```tsx
<Editor settings={{ table: { enabled: true } }} />
```

### Via Plugin

```tsx
import { tablePlugin } from "@overlap/rte";

<Editor plugins={[...otherPlugins, tablePlugin]} />
```

## Inserting a Table

Click the table button in the toolbar to open a dialog where you specify the number of rows and columns. Click "Insert" to create the table.

## Navigation

- **Tab** -- Move to the next cell
- **Shift + Tab** -- Move to the previous cell

## Context Menu

Right-click any table cell to open the context menu:

| Action | Description |
|---|---|
| Insert Row Above | Add a new row above the current row |
| Insert Row Below | Add a new row below the current row |
| Insert Column Left | Add a new column to the left |
| Insert Column Right | Add a new column to the right |
| Delete Row | Remove the current row |
| Delete Column | Remove the current column |
| Delete Table | Remove the entire table |

## Styling

Tables use the `.rte-table` class:

```css
.rte-table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
}

.rte-table td,
.rte-table th {
    border: 1px solid var(--rte-border-color);
    padding: 8px 12px;
    min-width: 40px;
    vertical-align: top;
}

.rte-table th {
    background: var(--rte-button-hover-bg);
    font-weight: 600;
}
```

## Notes

- Table cells are contenteditable and support all inline formatting
- Focused cells get an outline highlight
- The context menu appears as a floating panel with styled buttons
