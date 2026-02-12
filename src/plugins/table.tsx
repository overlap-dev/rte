import React, { useCallback, useEffect, useRef, useState } from "react";
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
}

const InsertTableDialog: React.FC<InsertDialogProps> = ({
    onInsert,
    onClose,
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

    return (
        <div className="rte-table-insert-dialog" ref={dialogRef}>
            <div className="rte-table-insert-title">Tabelle einfügen</div>
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
                    />
                </label>
            </div>
            <button
                type="button"
                className="rte-table-insert-btn"
                onClick={() => onInsert(rows, cols)}
            >
                Einfügen
            </button>
        </div>
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
                Zeile oben einfügen
            </button>
            <button
                type="button"
                onClick={() => action(() => insertRow("below"))}
            >
                Zeile unten einfügen
            </button>
            <div className="rte-table-context-divider" />
            <button
                type="button"
                onClick={() => action(() => insertColumn("left"))}
            >
                Spalte links einfügen
            </button>
            <button
                type="button"
                onClick={() => action(() => insertColumn("right"))}
            >
                Spalte rechts einfügen
            </button>
            <div className="rte-table-context-divider" />
            <button
                type="button"
                className="rte-table-context-danger"
                onClick={() => action(deleteRow)}
            >
                Zeile löschen
            </button>
            <button
                type="button"
                className="rte-table-context-danger"
                onClick={() => action(deleteColumn)}
            >
                Spalte löschen
            </button>
            <button
                type="button"
                className="rte-table-context-danger"
                onClick={() => action(deleteTable)}
            >
                Tabelle löschen
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

    const handleInsert = useCallback(
        (rows: number, cols: number) => {
            setShowDialog(false);
            if (!props.editorAPI) return;

            const sel = document.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);

            // Find the editor's contentEditable root
            const container = range.commonAncestorContainer;
            const editorEl =
                container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : (container as HTMLElement);
            const editorRoot = editorEl?.closest("[contenteditable]");
            if (!editorRoot) return;

            const table = createTable(rows, cols);

            // Insert after the current block element
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

            // Add a paragraph after the table so the user can continue typing
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            table.parentNode?.insertBefore(p, table.nextSibling);

            // Focus the first cell
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
        <div style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setShowDialog(!showDialog)}
                disabled={props.disabled}
                className={`rte-toolbar-button ${
                    props.isActive ? "rte-toolbar-button-active" : ""
                }`}
                title="Tabelle"
                aria-label="Tabelle"
            >
                <IconWrapper icon="mdi:table" width={18} height={18} />
            </button>
            {showDialog && (
                <InsertTableDialog
                    onInsert={handleInsert}
                    onClose={() => setShowDialog(false)}
                />
            )}
        </div>
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
