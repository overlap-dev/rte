/**
 * Table DOM manipulation utilities for contentEditable.
 * Pure DOM functions — no React dependency.
 */

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Get the <td>/<th> cell that contains the current selection. */
export function getActiveCell(): HTMLTableCellElement | null {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const el =
        container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as HTMLElement);
    return el?.closest("td, th") as HTMLTableCellElement | null;
}

/** Get the <table> that contains the current selection. */
export function getActiveTable(): HTMLTableElement | null {
    const cell = getActiveCell();
    return cell?.closest("table") ?? null;
}

/** Get the <tr> that contains the current selection. */
export function getActiveRow(): HTMLTableRowElement | null {
    const cell = getActiveCell();
    return cell?.closest("tr") ?? null;
}

/** Place the cursor inside a cell (at the start). */
export function focusCell(cell: HTMLTableCellElement): void {
    const range = document.createRange();
    const sel = document.getSelection();
    if (!sel) return;

    if (cell.firstChild) {
        range.setStart(cell.firstChild, 0);
    } else {
        // Empty cell — add a <br> so the cursor has something to land on
        const br = document.createElement("br");
        cell.appendChild(br);
        range.setStart(cell, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

/** Count the number of columns in a table (from the first row). */
function getColumnCount(table: HTMLTableElement): number {
    const firstRow = table.querySelector("tr");
    return firstRow ? firstRow.cells.length : 0;
}

/* ── Create ───────────────────────────────────────────────────────────── */

/** Create a new table element with the given dimensions. */
export function createTable(
    rows: number,
    cols: number,
    withHeader: boolean = false
): HTMLTableElement {
    const table = document.createElement("table");
    table.classList.add("rte-table");

    const startRow = withHeader ? 0 : 1;

    if (withHeader) {
        const thead = document.createElement("thead");
        const tr = document.createElement("tr");
        for (let c = 0; c < cols; c++) {
            const th = document.createElement("th");
            th.innerHTML = "<br>";
            tr.appendChild(th);
        }
        thead.appendChild(tr);
        table.appendChild(thead);
    }

    const tbody = document.createElement("tbody");
    const dataRows = withHeader ? rows - 1 : rows;
    for (let r = 0; r < dataRows; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < cols; c++) {
            const td = document.createElement("td");
            td.innerHTML = "<br>";
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
}

/* ── Row operations ───────────────────────────────────────────────────── */

/** Insert a row above or below the currently selected row. */
export function insertRow(position: "above" | "below"): void {
    const row = getActiveRow();
    const table = getActiveTable();
    if (!row || !table) return;

    const cols = row.cells.length;
    const newRow = document.createElement("tr");
    for (let c = 0; c < cols; c++) {
        const td = document.createElement("td");
        td.innerHTML = "<br>";
        newRow.appendChild(td);
    }

    if (position === "above") {
        row.parentNode?.insertBefore(newRow, row);
    } else {
        row.parentNode?.insertBefore(newRow, row.nextSibling);
    }

    focusCell(newRow.cells[0]);
}

/** Delete the row that contains the current selection. */
export function deleteRow(): void {
    const row = getActiveRow();
    const table = getActiveTable();
    if (!row || !table) return;

    const allRows = table.querySelectorAll("tr");
    if (allRows.length <= 1) {
        // Last row — remove the whole table
        deleteTable();
        return;
    }

    // Focus adjacent row before deleting
    const nextRow = (row.nextElementSibling ||
        row.previousElementSibling) as HTMLTableRowElement | null;
    row.remove();
    if (nextRow?.cells[0]) {
        focusCell(nextRow.cells[0]);
    }
}

/* ── Column operations ────────────────────────────────────────────────── */

/** Insert a column to the left or right of the currently selected cell. */
export function insertColumn(position: "left" | "right"): void {
    const cell = getActiveCell();
    const table = getActiveTable();
    if (!cell || !table) return;

    const cellIndex = cell.cellIndex;
    const rows = table.querySelectorAll("tr");

    rows.forEach((row) => {
        const tag = row.parentElement?.tagName === "THEAD" ? "th" : "td";
        const newCell = document.createElement(tag);
        newCell.innerHTML = "<br>";

        const refCell = row.cells[cellIndex];
        if (!refCell) {
            row.appendChild(newCell);
        } else if (position === "left") {
            row.insertBefore(newCell, refCell);
        } else {
            row.insertBefore(newCell, refCell.nextSibling);
        }
    });
}

/** Delete the column that contains the currently selected cell. */
export function deleteColumn(): void {
    const cell = getActiveCell();
    const table = getActiveTable();
    if (!cell || !table) return;

    const cellIndex = cell.cellIndex;
    const colCount = getColumnCount(table);

    if (colCount <= 1) {
        // Last column — remove the whole table
        deleteTable();
        return;
    }

    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
        if (row.cells[cellIndex]) {
            row.cells[cellIndex].remove();
        }
    });

    // Focus an adjacent cell
    const activeRow = getActiveRow();
    if (activeRow) {
        const idx = Math.min(cellIndex, activeRow.cells.length - 1);
        if (activeRow.cells[idx]) focusCell(activeRow.cells[idx]);
    }
}

/* ── Table delete ─────────────────────────────────────────────────────── */

/** Remove the entire table and place cursor after it. */
export function deleteTable(): void {
    const table = getActiveTable();
    if (!table) return;

    const parent = table.parentNode;
    const nextSibling = table.nextSibling;

    // Create a paragraph to place the cursor
    const p = document.createElement("p");
    p.innerHTML = "<br>";

    if (nextSibling) {
        parent?.insertBefore(p, nextSibling);
    } else {
        parent?.appendChild(p);
    }

    table.remove();

    // Focus the new paragraph
    const range = document.createRange();
    const sel = document.getSelection();
    if (sel && p.firstChild) {
        range.setStart(p, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

/* ── Tab navigation ───────────────────────────────────────────────────── */

/**
 * Move focus to the next or previous table cell.
 * Returns true if navigation happened (caller should preventDefault).
 */
export function navigateTableCell(direction: "next" | "prev"): boolean {
    const cell = getActiveCell();
    if (!cell) return false;

    const row = cell.closest("tr");
    const table = cell.closest("table");
    if (!row || !table) return false;

    const cellIndex = cell.cellIndex;
    const allRows = Array.from(table.querySelectorAll("tr"));
    const rowIndex = allRows.indexOf(row);

    let targetCell: HTMLTableCellElement | null = null;

    if (direction === "next") {
        if (cellIndex < row.cells.length - 1) {
            targetCell = row.cells[cellIndex + 1];
        } else if (rowIndex < allRows.length - 1) {
            targetCell = allRows[rowIndex + 1].cells[0];
        } else {
            // Last cell of last row — add a new row
            insertRow("below");
            return true;
        }
    } else {
        if (cellIndex > 0) {
            targetCell = row.cells[cellIndex - 1];
        } else if (rowIndex > 0) {
            const prevRow = allRows[rowIndex - 1];
            targetCell = prevRow.cells[prevRow.cells.length - 1];
        }
    }

    if (targetCell) {
        focusCell(targetCell);
        return true;
    }

    return false;
}
