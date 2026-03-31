import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconWrapper } from "../components/IconWrapper";
import { ButtonProps, EditorAPI, Plugin } from "../types";
import {
    createTable,
    deleteColumn,
    deleteRow,
    deleteTable,
    getActiveCell,
    getActiveTable,
    insertColumn,
    insertRow,
} from "../utils/table";

/* ══════════════════════════════════════════════════════════════════════════
   Insert Table Dialog — rendered inside the toolbar button
   ══════════════════════════════════════════════════════════════════════ */

interface InsertDialogProps {
    onInsert: (rows: number, cols: number) => void;
    onClose: () => void;
    anchorRect: DOMRect | null;
}

const InsertTableDialog: React.FC<InsertDialogProps> = ({
    onInsert,
    onClose,
    anchorRect,
}) => {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dialogRef.current &&
                !dialogRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const style: React.CSSProperties = { position: "fixed" };
    if (anchorRect) {
        const pad = 8;
        let top = anchorRect.bottom + 4;
        let left = anchorRect.left;
        if (left + 220 > window.innerWidth - pad) {
            left = window.innerWidth - 220 - pad;
        }
        if (left < pad) left = pad;
        if (top + 200 > window.innerHeight - pad) {
            top = anchorRect.top - 200 - 4;
        }
        if (top < pad) top = pad;
        style.top = top;
        style.left = left;
    }

    return createPortal(
        <div
            className="rte-table-insert-dialog"
            ref={dialogRef}
            style={style}
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className="rte-table-insert-title">Insert Table</div>
            <div className="rte-table-insert-fields">
                <label className="rte-table-insert-label">
                    <span>Zeilen</span>
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={rows}
                        onChange={(e) =>
                            setRows(
                                Math.max(
                                    1,
                                    Math.min(20, parseInt(e.target.value) || 1)
                                )
                            )
                        }
                        className="rte-table-insert-input"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </label>
                <label className="rte-table-insert-label">
                    <span>Spalten</span>
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={cols}
                        onChange={(e) =>
                            setCols(
                                Math.max(
                                    1,
                                    Math.min(10, parseInt(e.target.value) || 1)
                                )
                            )
                        }
                        className="rte-table-insert-input"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </label>
            </div>
            <button
                type="button"
                className="rte-table-insert-btn"
                onClick={() => onInsert(rows, cols)}
            >
                Insert
            </button>
        </div>,
        document.body
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   Table Context Menu — rendered as a portal when right-clicking in a cell
   ══════════════════════════════════════════════════════════════════════ */

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
}

const TableContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    onClose,
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const action = (fn: () => void) => {
        fn();
        onClose();
    };

    return (
        <div
            ref={ref}
            className="rte-table-context-menu"
            style={{ position: "fixed", left: x, top: y }}
        >
            <button
                type="button"
                onClick={() => action(() => insertRow("above"))}
            >
                Insert row above
            </button>
            <button
                type="button"
                onClick={() => action(() => insertRow("below"))}
            >
                Insert row below
            </button>
            <div className="rte-table-context-divider" />
            <button
                type="button"
                onClick={() => action(() => insertColumn("left"))}
            >
                Insert column left
            </button>
            <button
                type="button"
                onClick={() => action(() => insertColumn("right"))}
            >
                Insert column right
            </button>
            <div className="rte-table-context-divider" />
            <button
                type="button"
                className="rte-table-context-danger"
                onClick={() => action(deleteRow)}
            >
                Delete row
            </button>
            <button
                type="button"
                className="rte-table-context-danger"
                onClick={() => action(deleteColumn)}
            >
                Delete column
            </button>
            <button
                type="button"
                className="rte-table-context-danger"
                onClick={() => action(deleteTable)}
            >
                Delete table
            </button>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   Table Toolbar Button (stateful — opens insert dialog)
   ══════════════════════════════════════════════════════════════════════ */

interface TableButtonProps extends ButtonProps {
    editorAPI?: EditorAPI;
}

const TableToolbarButton: React.FC<TableButtonProps> = (props) => {
    const [showDialog, setShowDialog] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    const handleToggle = useCallback(() => {
        if (!showDialog && btnRef.current) {
            setAnchorRect(btnRef.current.getBoundingClientRect());
        }
        setShowDialog((v) => !v);
    }, [showDialog]);

    const handleInsert = useCallback(
        (rows: number, cols: number) => {
            setShowDialog(false);
            if (!props.editorAPI) return;

            const sel = document.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);

            const container = range.commonAncestorContainer;
            const editorEl =
                container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : (container as HTMLElement);
            const editorRoot = editorEl?.closest("[contenteditable]");
            if (!editorRoot) return;

            const table = createTable(rows, cols);

            let block: HTMLElement | null = editorEl;
            while (
                block &&
                block !== editorRoot &&
                block.parentElement !== editorRoot
            ) {
                block = block.parentElement;
            }

            if (block && block !== editorRoot) {
                block.parentNode?.insertBefore(table, block.nextSibling);
            } else {
                editorRoot.appendChild(table);
            }

            const p = document.createElement("p");
            p.innerHTML = "<br>";
            table.parentNode?.insertBefore(p, table.nextSibling);

            const firstCell = table.querySelector("td, th") as HTMLTableCellElement | null;
            if (firstCell) {
                const newRange = document.createRange();
                newRange.setStart(firstCell, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
        },
        [props.editorAPI]
    );

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={handleToggle}
                disabled={props.disabled}
                className={`rte-toolbar-button ${
                    props.isActive ? "rte-toolbar-button-active" : ""
                }`}
                title="Table"
                aria-label="Table"
            >
                <IconWrapper icon="mdi:table" width={18} height={18} />
            </button>
            {showDialog && (
                <InsertTableDialog
                    onInsert={handleInsert}
                    onClose={() => setShowDialog(false)}
                    anchorRect={anchorRect}
                />
            )}
        </>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   Table Plugin export
   ══════════════════════════════════════════════════════════════════════ */

export const tablePlugin: Plugin = {
    name: "table",
    type: "command",
    renderButton: (props: ButtonProps & { [key: string]: unknown }) => (
        <TableToolbarButton
            {...props}
            editorAPI={props.editorAPI as EditorAPI | undefined}
        />
    ),
    execute: () => {
        // Insertion is handled by the dialog component
    },
    isActive: () => getActiveTable() !== null,
    canExecute: () => true,
};

/* ══════════════════════════════════════════════════════════════════════════
   TableContextMenuProvider — wrap the editor to enable right-click menu
   ══════════════════════════════════════════════════════════════════════ */

export const TableContextMenuProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const cell = target.closest("td, th");
            const editorRoot = target.closest("[contenteditable]");
            if (cell && editorRoot) {
                e.preventDefault();
                setMenu({ x: e.clientX, y: e.clientY });
            }
        };
        document.addEventListener("contextmenu", handler);
        return () => document.removeEventListener("contextmenu", handler);
    }, []);

    return (
        <>
            {children}
            {menu && (
                <TableContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={() => setMenu(null)}
                />
            )}
        </>
    );
};
