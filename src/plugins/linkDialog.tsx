import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconWrapper } from "../components/IconWrapper";
import { ButtonProps, EditorAPI, Plugin } from "../types";

/* ══════════════════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════════════ */

interface LinkData {
    url: string;
    target: string;
    /** Values for custom fields, keyed by field.key */
    custom: Record<string, string>;
}

/**
 * Describes an additional field injected into the link dialog.
 * This allows platform-specific extensions (e.g. page reference, URL extras)
 * without baking them into the core RTE.
 */
export interface LinkCustomField {
    /** Unique identifier (used as key in LinkData.custom) */
    key: string;
    /** Display label */
    label: string;
    /** Input placeholder */
    placeholder?: string;
    /** The HTML attribute to read/write on the <a> element (e.g. "data-page-ref") */
    dataAttribute: string;
    /** If true, this field's value is appended to the href when saving. */
    appendToHref?: boolean;
    /** If true, the URL input is disabled when this field has a value. */
    disablesUrl?: boolean;
}

export interface AdvancedLinkOptions {
    /** Show "Open in new tab" checkbox. Defaults to true. */
    enableTarget?: boolean;
    /** Additional custom fields rendered in the advanced section. */
    customFields?: LinkCustomField[];
}

function createEmptyLinkData(fields: LinkCustomField[]): LinkData {
    const custom: Record<string, string> = {};
    for (const f of fields) custom[f.key] = "";
    return { url: "https://", target: "_self", custom };
}

/* ══════════════════════════════════════════════════════════════════════════
   Position helper — prefers above the link, falls back to below
   ══════════════════════════════════════════════════════════════════════ */

const VERTICAL_GAP = 10;
const HORIZONTAL_OFFSET = 5;

function computePosition(anchorRect: DOMRect) {
    const dialogWidth = 380;
    const estimatedHeight = 260;

    const topAbove = anchorRect.top - VERTICAL_GAP - estimatedHeight;
    const topBelow = anchorRect.bottom + VERTICAL_GAP;

    const aboveOverflowsTop = topAbove < 8;
    const belowOverflowsBottom =
        topBelow + estimatedHeight > window.innerHeight - 8;

    let top: number;
    if (!aboveOverflowsTop) {
        top = topAbove;
    } else if (!belowOverflowsBottom) {
        top = topBelow;
    } else {
        top = Math.max(8, topAbove);
    }

    let left = anchorRect.left - HORIZONTAL_OFFSET;
    if (left + dialogWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - dialogWidth - 8);
    }

    return { top, left };
}

/* ══════════════════════════════════════════════════════════════════════════
   Floating Link Editor — rendered via portal on document.body
   ══════════════════════════════════════════════════════════════════════ */

interface FloatingLinkEditorProps {
    linkData: LinkData;
    options: Required<Pick<AdvancedLinkOptions, "enableTarget">> &
        Pick<AdvancedLinkOptions, "customFields">;
    anchorRect: DOMRect;
    isEditing: boolean;
    onSave: (data: LinkData) => void;
    onRemove: () => void;
    onClose: () => void;
}

const FloatingLinkEditor: React.FC<FloatingLinkEditorProps> = ({
    linkData: initialData,
    options,
    anchorRect,
    isEditing,
    onSave,
    onRemove,
    onClose,
}) => {
    const [data, setData] = useState<LinkData>(initialData);
    const customFields = options.customFields ?? [];

    const [showAdvanced, setShowAdvanced] = useState(() => {
        // Auto-expand if target is _blank or any custom field has a value
        if (initialData.target === "_blank") return true;
        for (const f of customFields) {
            if (initialData.custom[f.key]) return true;
        }
        return false;
    });

    const dialogRef = useRef<HTMLDivElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);

    // Focus URL input on open
    useEffect(() => {
        const timer = setTimeout(() => {
            const input = urlInputRef.current;
            if (input) {
                input.focus();
                input.select();
            }
        }, 30);
        return () => clearTimeout(timer);
    }, []);

    // Click-away
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dialogRef.current &&
                !dialogRef.current.contains(e.target as Node)
            ) {
                const target = e.target as HTMLElement;
                if (
                    target.closest?.("a") &&
                    target.closest?.("[contenteditable]")
                ) {
                    return;
                }
                onClose();
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handler);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handler);
        };
    }, [onClose]);

    // Escape to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSave(data);
        } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        }
    };

    const setField = (key: keyof Omit<LinkData, "custom">, value: string) =>
        setData((prev) => ({ ...prev, [key]: value }));

    const setCustom = (key: string, value: string) =>
        setData((prev) => ({
            ...prev,
            custom: { ...prev.custom, [key]: value },
        }));

    // Check if URL input should be disabled (a custom field with disablesUrl has a value)
    const urlDisabledByCustom = customFields.some(
        (f) => f.disablesUrl && !!data.custom[f.key]
    );

    const hasAdvancedSection =
        options.enableTarget || customFields.length > 0;

    const pos = computePosition(anchorRect);

    return createPortal(
        <div
            ref={dialogRef}
            className="rte-link-dialog rte-link-dialog-floating"
            style={{ top: pos.top, left: pos.left, position: "fixed" }}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Close button */}
            <button
                type="button"
                className="rte-link-dialog-close"
                onClick={onClose}
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Close"
            >
                <IconWrapper icon="mdi:close" width={16} height={16} />
            </button>

            <div className="rte-link-dialog-field">
                <label className="rte-link-dialog-label">URL</label>
                <input
                    ref={urlInputRef}
                    type="url"
                    className="rte-link-dialog-input"
                    value={data.url}
                    onChange={(e) => setField("url", e.target.value)}
                    placeholder="https://..."
                    disabled={urlDisabledByCustom}
                />
            </div>

            {hasAdvancedSection && (
                <div className="rte-link-dialog-advanced-section">
                    <button
                        type="button"
                        className="rte-link-dialog-toggle"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <span>
                            {showAdvanced ? "▾" : "▸"} Erweitert
                        </span>
                    </button>

                    {showAdvanced && (
                        <div className="rte-link-dialog-advanced">
                            {/* Custom fields */}
                            {customFields.map((field) => (
                                <div
                                    key={field.key}
                                    className="rte-link-dialog-field"
                                >
                                    <label className="rte-link-dialog-label">
                                        {field.label}
                                    </label>
                                    <input
                                        type="text"
                                        className="rte-link-dialog-input"
                                        value={data.custom[field.key] || ""}
                                        onChange={(e) =>
                                            setCustom(
                                                field.key,
                                                e.target.value
                                            )
                                        }
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}

                            {/* Target checkbox */}
                            {options.enableTarget && (
                                <label className="rte-link-dialog-checkbox-row">
                                    <input
                                        type="checkbox"
                                        checked={data.target === "_blank"}
                                        onChange={(e) =>
                                            setField(
                                                "target",
                                                e.target.checked
                                                    ? "_blank"
                                                    : "_self"
                                            )
                                        }
                                    />
                                    <span>Open in new tab</span>
                                </label>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="rte-link-dialog-actions">
                {isEditing && (
                    <button
                        type="button"
                        className="rte-link-dialog-btn rte-link-dialog-btn-danger"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={onRemove}
                    >
                        Entfernen
                    </button>
                )}
                <div style={{ flex: 1 }} />
                <button
                    type="button"
                    className="rte-link-dialog-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClose}
                >
                    Abbrechen
                </button>
                <button
                    type="button"
                    className="rte-link-dialog-btn rte-link-dialog-btn-primary"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSave(data)}
                    disabled={
                        !data.url.trim() || data.url.trim() === "https://"
                    }
                >
                    Speichern
                </button>
            </div>
        </div>,
        document.body
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════════════ */

/** Find the <a> element at the current selection. */
function getSelectedLink(): HTMLAnchorElement | null {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const el =
        container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as HTMLElement);
    return el?.closest("a") as HTMLAnchorElement | null;
}

/** Read link data from an <a> element. */
function readLinkData(
    link: HTMLAnchorElement,
    customFields: LinkCustomField[]
): LinkData {
    const href = link.getAttribute("href") || "https://";
    const custom: Record<string, string> = {};

    // Read custom field values from data-attributes
    for (const field of customFields) {
        custom[field.key] = link.getAttribute(field.dataAttribute) || "";
    }

    // If a field with appendToHref has a value, strip it from the URL
    let url = href;
    for (const field of customFields) {
        if (field.appendToHref && custom[field.key] && href.endsWith(custom[field.key])) {
            url = href.slice(0, href.length - custom[field.key].length);
        }
    }

    return {
        url,
        target: link.getAttribute("target") || "_self",
        custom,
    };
}

/** Apply link data attributes to an <a> element. */
function applyLinkData(
    link: HTMLAnchorElement,
    data: LinkData,
    customFields: LinkCustomField[]
): void {
    // Build href: url + any appendToHref custom fields
    let href = data.url;
    for (const field of customFields) {
        if (field.appendToHref && data.custom[field.key]) {
            href += data.custom[field.key];
        }
    }
    link.setAttribute("href", href);

    // Target
    if (data.target && data.target !== "_self") {
        link.setAttribute("target", data.target);
    } else {
        link.removeAttribute("target");
    }

    // Custom field data-attributes
    for (const field of customFields) {
        const value = data.custom[field.key];
        if (value) {
            link.setAttribute(field.dataAttribute, value);
        } else {
            link.removeAttribute(field.dataAttribute);
        }
    }
}

/* ══════════════════════════════════════════════════════════════════════════
   Link Toolbar Button + Floating Editor orchestrator
   ══════════════════════════════════════════════════════════════════════ */

interface LinkButtonProps extends ButtonProps {
    editorAPI?: EditorAPI;
    enableTarget: boolean;
    customFields: LinkCustomField[];
}

const LinkToolbarButton: React.FC<LinkButtonProps> = (props) => {
    const { enableTarget, customFields } = props;

    const [showDialog, setShowDialog] = useState(false);
    const [linkData, setLinkData] = useState<LinkData>(() =>
        createEmptyLinkData(customFields)
    );
    const [isEditing, setIsEditing] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const isOpenRef = useRef(false);

    useEffect(() => {
        isOpenRef.current = showDialog;
    }, [showDialog]);

    // ── Open dialog ─────────────────────────────────────────────────
    const openDialog = useCallback(
        (existingLink?: HTMLAnchorElement | null) => {
            const sel = document.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            savedRangeRef.current = sel.getRangeAt(0).cloneRange();

            const link = existingLink || getSelectedLink();

            if (link) {
                setIsEditing(true);
                setLinkData(readLinkData(link, customFields));
                setAnchorRect(link.getBoundingClientRect());
            } else {
                setIsEditing(false);
                setLinkData(createEmptyLinkData(customFields));
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) {
                    const node = range.commonAncestorContainer;
                    const el =
                        node.nodeType === Node.TEXT_NODE
                            ? node.parentElement
                            : (node as HTMLElement);
                    if (el) {
                        setAnchorRect(el.getBoundingClientRect());
                    }
                } else {
                    setAnchorRect(rect);
                }
            }

            setShowDialog(true);
        },
        [customFields]
    );

    // ── Click on links in the editor ────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest("a") as HTMLAnchorElement | null;
            const editorRoot = target.closest("[contenteditable]");

            if (!link || !editorRoot) return;

            // Cmd/Ctrl+Click → open in new tab
            if (e.metaKey || e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                const href = link.getAttribute("href");
                if (href) window.open(href, "_blank");
                return;
            }

            if (isOpenRef.current) return;

            setTimeout(() => {
                if (!isOpenRef.current) {
                    openDialog(link);
                }
            }, 10);
        };

        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, [openDialog]);

    // ── Restore selection ───────────────────────────────────────────
    const restoreSelection = useCallback(() => {
        if (savedRangeRef.current) {
            const sel = document.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedRangeRef.current);
            }
        }
    }, []);

    // ── Save ────────────────────────────────────────────────────────
    const handleSave = useCallback(
        (data: LinkData) => {
            setShowDialog(false);
            restoreSelection();

            const existingLink = getSelectedLink();

            if (existingLink) {
                applyLinkData(existingLink, data, customFields);
            } else {
                let href = data.url;
                for (const field of customFields) {
                    if (field.appendToHref && data.custom[field.key]) {
                        href += data.custom[field.key];
                    }
                }
                document.execCommand("createLink", false, href);
                const newLink = getSelectedLink();
                if (newLink) {
                    applyLinkData(newLink, data, customFields);
                }
            }

            // Move cursor after the link
            setTimeout(() => {
                const sel = document.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const link = getSelectedLink();
                    if (link) {
                        const range = document.createRange();
                        range.setStartAfter(link);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
            }, 0);
        },
        [restoreSelection, customFields]
    );

    // ── Remove link ─────────────────────────────────────────────────
    const handleRemove = useCallback(() => {
        setShowDialog(false);
        restoreSelection();

        const link = getSelectedLink();
        if (link) {
            const parent = link.parentNode;
            if (parent) {
                while (link.firstChild) {
                    parent.insertBefore(link.firstChild, link);
                }
                parent.removeChild(link);
            }
        }
    }, [restoreSelection]);

    // ── Close ───────────────────────────────────────────────────────
    const handleClose = useCallback(() => {
        setShowDialog(false);
        restoreSelection();

        setTimeout(() => {
            const sel = document.getSelection();
            if (sel && sel.rangeCount > 0) {
                const link = getSelectedLink();
                if (link) {
                    const lastChild = link.lastChild;
                    if (lastChild) {
                        const range = document.createRange();
                        range.setStartAfter(lastChild);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
            }
        }, 0);
    }, [restoreSelection]);

    return (
        <>
            <button
                type="button"
                onClick={() => openDialog()}
                disabled={props.disabled}
                className={`rte-toolbar-button ${
                    props.isActive ? "rte-toolbar-button-active" : ""
                }`}
                title="Link (⌘K)"
                aria-label="Link"
            >
                <IconWrapper icon="mdi:link" width={18} height={18} />
            </button>
            {showDialog && anchorRect && (
                <FloatingLinkEditor
                    linkData={linkData}
                    options={{ enableTarget, customFields }}
                    anchorRect={anchorRect}
                    isEditing={isEditing}
                    onSave={handleSave}
                    onRemove={handleRemove}
                    onClose={handleClose}
                />
            )}
        </>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   Plugin factory + export
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Creates an advanced link plugin with a floating dialog.
 *
 * Core features (always available):
 * - URL input
 * - "Open in new tab" checkbox (enableTarget)
 * - Cmd/Ctrl+Click → open link in new tab
 * - Click on link → edit it inline
 *
 * Platform-specific fields (injected via `customFields`):
 * - Each field is rendered in the "Advanced" section
 * - Values are stored as data-attributes on the <a> element
 * - `appendToHref` fields have their value appended to the href
 * - `disablesUrl` fields disable the URL input when they have a value
 */
export function createAdvancedLinkPlugin(
    options: AdvancedLinkOptions = {}
): Plugin {
    const enableTarget = options.enableTarget ?? true;
    const customFields = options.customFields ?? [];

    return {
        name: "advancedLink",
        type: "inline",
        renderButton: (props: ButtonProps & { [key: string]: unknown }) => (
            <LinkToolbarButton
                {...props}
                editorAPI={props.editorAPI as EditorAPI | undefined}
                enableTarget={enableTarget}
                customFields={customFields}
            />
        ),
        execute: () => {
            // Handled by the dialog component
        },
        isActive: () => {
            if (typeof document === "undefined") return false;
            return getSelectedLink() !== null;
        },
        canExecute: () => {
            const sel = document.getSelection();
            return sel !== null && sel.rangeCount > 0;
        },
    };
}

/** Pre-built link plugin with just target enabled (no custom fields). */
export const advancedLinkPlugin: Plugin = createAdvancedLinkPlugin();
