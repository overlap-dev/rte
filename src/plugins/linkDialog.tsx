import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconWrapper } from "../components/IconWrapper";
import { ButtonProps, EditorAPI, Plugin } from "../types";

/* ══════════════════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════════════ */

interface LinkData {
    url: string;
    target: string;
    rel: string;
    title: string;
    pageRef: string;
    urlExtra: string;
}

interface AdvancedLinkOptions {
    enablePageRef?: boolean;
    enableTarget?: boolean;
    enableRel?: boolean;
    enableTitle?: boolean;
    enableUrlExtra?: boolean;
}

const EMPTY_LINK: LinkData = {
    url: "",
    target: "_self",
    rel: "",
    title: "",
    pageRef: "",
    urlExtra: "",
};

/* ══════════════════════════════════════════════════════════════════════════
   Link Dialog component
   ══════════════════════════════════════════════════════════════════════ */

interface LinkDialogProps {
    initialData: LinkData;
    options: AdvancedLinkOptions;
    onSave: (data: LinkData) => void;
    onRemove: () => void;
    onClose: () => void;
    isEditing: boolean;
}

const LinkDialog: React.FC<LinkDialogProps> = ({
    initialData,
    options,
    onSave,
    onRemove,
    onClose,
    isEditing,
}) => {
    const [data, setData] = useState<LinkData>(initialData);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        urlInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dialogRef.current &&
                !dialogRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        // Delay to avoid closing immediately on the same click
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handler);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handler);
        };
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

    const set = (key: keyof LinkData, value: string) =>
        setData((prev) => ({ ...prev, [key]: value }));

    const hasAdvancedOptions =
        options.enableRel ||
        options.enableTitle ||
        options.enableUrlExtra ||
        options.enablePageRef;

    return (
        <div
            ref={dialogRef}
            className="rte-link-dialog"
            onKeyDown={handleKeyDown}
        >
            <div className="rte-link-dialog-title">
                {isEditing ? "Link bearbeiten" : "Link einfügen"}
            </div>

            <div className="rte-link-dialog-field">
                <label className="rte-link-dialog-label">URL</label>
                <input
                    ref={urlInputRef}
                    type="url"
                    className="rte-link-dialog-input"
                    value={data.url}
                    onChange={(e) => set("url", e.target.value)}
                    placeholder="https://..."
                />
            </div>

            {options.enableTarget && (
                <div className="rte-link-dialog-field">
                    <label className="rte-link-dialog-label">Ziel</label>
                    <select
                        className="rte-link-dialog-select"
                        value={data.target}
                        onChange={(e) => set("target", e.target.value)}
                    >
                        <option value="_self">Gleiches Fenster</option>
                        <option value="_blank">Neues Fenster</option>
                    </select>
                </div>
            )}

            {hasAdvancedOptions && (
                <>
                    <button
                        type="button"
                        className="rte-link-dialog-toggle"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? "Erweitert ausblenden" : "Erweitert anzeigen"}
                    </button>

                    {showAdvanced && (
                        <div className="rte-link-dialog-advanced">
                            {options.enablePageRef && (
                                <div className="rte-link-dialog-field">
                                    <label className="rte-link-dialog-label">
                                        Seitenreferenz
                                    </label>
                                    <input
                                        type="text"
                                        className="rte-link-dialog-input"
                                        value={data.pageRef}
                                        onChange={(e) =>
                                            set("pageRef", e.target.value)
                                        }
                                        placeholder="page-id"
                                    />
                                </div>
                            )}
                            {options.enableUrlExtra && (
                                <div className="rte-link-dialog-field">
                                    <label className="rte-link-dialog-label">
                                        URL Extra
                                    </label>
                                    <input
                                        type="text"
                                        className="rte-link-dialog-input"
                                        value={data.urlExtra}
                                        onChange={(e) =>
                                            set("urlExtra", e.target.value)
                                        }
                                        placeholder="?param=value oder #anchor"
                                    />
                                </div>
                            )}
                            {options.enableRel && (
                                <div className="rte-link-dialog-field">
                                    <label className="rte-link-dialog-label">
                                        Rel
                                    </label>
                                    <input
                                        type="text"
                                        className="rte-link-dialog-input"
                                        value={data.rel}
                                        onChange={(e) =>
                                            set("rel", e.target.value)
                                        }
                                        placeholder="noopener noreferrer"
                                    />
                                </div>
                            )}
                            {options.enableTitle && (
                                <div className="rte-link-dialog-field">
                                    <label className="rte-link-dialog-label">
                                        Titel
                                    </label>
                                    <input
                                        type="text"
                                        className="rte-link-dialog-input"
                                        value={data.title}
                                        onChange={(e) =>
                                            set("title", e.target.value)
                                        }
                                        placeholder="Link-Titel"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <div className="rte-link-dialog-actions">
                <button
                    type="button"
                    className="rte-link-dialog-btn rte-link-dialog-btn-primary"
                    onClick={() => onSave(data)}
                    disabled={!data.url.trim()}
                >
                    {isEditing ? "Speichern" : "Einfügen"}
                </button>
                {isEditing && (
                    <button
                        type="button"
                        className="rte-link-dialog-btn rte-link-dialog-btn-danger"
                        onClick={onRemove}
                    >
                        Entfernen
                    </button>
                )}
                <button
                    type="button"
                    className="rte-link-dialog-btn"
                    onClick={onClose}
                >
                    Abbrechen
                </button>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   Link Toolbar Button (stateful — opens dialog)
   ══════════════════════════════════════════════════════════════════════ */

interface LinkButtonProps extends ButtonProps {
    editorAPI?: EditorAPI;
    options: AdvancedLinkOptions;
}

const LinkToolbarButton: React.FC<LinkButtonProps> = (props) => {
    const [showDialog, setShowDialog] = useState(false);
    const [linkData, setLinkData] = useState<LinkData>(EMPTY_LINK);
    const [isEditing, setIsEditing] = useState(false);
    const savedRangeRef = useRef<Range | null>(null);

    const openDialog = useCallback(() => {
        const sel = document.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        // Save the current selection
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element =
            container.nodeType === Node.TEXT_NODE
                ? container.parentElement
                : (container as HTMLElement);

        const existingLink = element?.closest("a") as HTMLAnchorElement | null;

        if (existingLink) {
            setIsEditing(true);
            setLinkData({
                url: existingLink.getAttribute("href") || "",
                target: existingLink.getAttribute("target") || "_self",
                rel: existingLink.getAttribute("rel") || "",
                title: existingLink.getAttribute("title") || "",
                pageRef: existingLink.getAttribute("data-page-ref") || "",
                urlExtra: existingLink.getAttribute("data-url-extra") || "",
            });
        } else {
            setIsEditing(false);
            setLinkData(EMPTY_LINK);
        }

        setShowDialog(true);
    }, []);

    const restoreSelection = useCallback(() => {
        if (savedRangeRef.current) {
            const sel = document.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedRangeRef.current);
            }
        }
    }, []);

    const handleSave = useCallback(
        (data: LinkData) => {
            setShowDialog(false);
            restoreSelection();

            const sel = document.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const range = sel.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element =
                container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : (container as HTMLElement);

            const existingLink = element?.closest(
                "a"
            ) as HTMLAnchorElement | null;

            if (existingLink) {
                // Update existing link
                existingLink.setAttribute("href", data.url);
                if (data.target && data.target !== "_self") {
                    existingLink.setAttribute("target", data.target);
                } else {
                    existingLink.removeAttribute("target");
                }
                if (data.rel) {
                    existingLink.setAttribute("rel", data.rel);
                } else {
                    existingLink.removeAttribute("rel");
                }
                if (data.title) {
                    existingLink.setAttribute("title", data.title);
                } else {
                    existingLink.removeAttribute("title");
                }
                if (data.pageRef) {
                    existingLink.setAttribute("data-page-ref", data.pageRef);
                } else {
                    existingLink.removeAttribute("data-page-ref");
                }
                if (data.urlExtra) {
                    existingLink.setAttribute("data-url-extra", data.urlExtra);
                } else {
                    existingLink.removeAttribute("data-url-extra");
                }
            } else {
                // Create new link
                document.execCommand("createLink", false, data.url);
                // Now find the newly created link and set extra attributes
                const newSel = document.getSelection();
                if (newSel && newSel.rangeCount > 0) {
                    const newRange = newSel.getRangeAt(0);
                    const newContainer = newRange.commonAncestorContainer;
                    const newElement =
                        newContainer.nodeType === Node.TEXT_NODE
                            ? newContainer.parentElement
                            : (newContainer as HTMLElement);
                    const newLink = newElement?.closest(
                        "a"
                    ) as HTMLAnchorElement | null;
                    if (newLink) {
                        if (data.target && data.target !== "_self") {
                            newLink.setAttribute("target", data.target);
                        }
                        if (data.rel) {
                            newLink.setAttribute("rel", data.rel);
                        }
                        if (data.title) {
                            newLink.setAttribute("title", data.title);
                        }
                        if (data.pageRef) {
                            newLink.setAttribute(
                                "data-page-ref",
                                data.pageRef
                            );
                        }
                        if (data.urlExtra) {
                            newLink.setAttribute(
                                "data-url-extra",
                                data.urlExtra
                            );
                        }
                    }
                }
            }
        },
        [restoreSelection]
    );

    const handleRemove = useCallback(() => {
        setShowDialog(false);
        restoreSelection();

        const sel = document.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element =
            container.nodeType === Node.TEXT_NODE
                ? container.parentElement
                : (container as HTMLElement);

        const existingLink = element?.closest("a") as HTMLAnchorElement | null;
        if (existingLink) {
            const parent = existingLink.parentNode;
            if (parent) {
                while (existingLink.firstChild) {
                    parent.insertBefore(existingLink.firstChild, existingLink);
                }
                parent.removeChild(existingLink);
            }
        }
    }, [restoreSelection]);

    return (
        <div style={{ position: "relative" }}>
            <button
                type="button"
                onClick={openDialog}
                disabled={props.disabled}
                className={`rte-toolbar-button ${
                    props.isActive ? "rte-toolbar-button-active" : ""
                }`}
                title="Link"
                aria-label="Link"
            >
                <IconWrapper icon="mdi:link" width={18} height={18} />
            </button>
            {showDialog && (
                <LinkDialog
                    initialData={linkData}
                    options={props.options}
                    onSave={handleSave}
                    onRemove={handleRemove}
                    onClose={() => setShowDialog(false)}
                    isEditing={isEditing}
                />
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   Plugin factory + export
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Creates an advanced link plugin with a floating dialog.
 * Supports URL, target, rel, title, page reference, and URL extra.
 */
export function createAdvancedLinkPlugin(
    options: AdvancedLinkOptions = {}
): Plugin {
    const opts: AdvancedLinkOptions = {
        enablePageRef: false,
        enableTarget: true,
        enableRel: true,
        enableTitle: true,
        enableUrlExtra: false,
        ...options,
    };

    return {
        name: "advancedLink",
        type: "inline",
        renderButton: (props: ButtonProps & { [key: string]: unknown }) => (
            <LinkToolbarButton
                {...props}
                editorAPI={props.editorAPI as EditorAPI | undefined}
                options={opts}
            />
        ),
        execute: () => {
            // Handled by the dialog component
        },
        isActive: () => {
            if (typeof document === "undefined") return false;
            const sel = document.getSelection();
            if (!sel || sel.rangeCount === 0) return false;
            const range = sel.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element =
                container.nodeType === Node.TEXT_NODE
                    ? container.parentElement
                    : (container as HTMLElement);
            return element?.closest("a") !== null;
        },
        canExecute: () => {
            const sel = document.getSelection();
            return sel !== null && sel.rangeCount > 0;
        },
    };
}

/** Pre-built advanced link plugin with target + rel + title enabled */
export const advancedLinkPlugin: Plugin = createAdvancedLinkPlugin();
