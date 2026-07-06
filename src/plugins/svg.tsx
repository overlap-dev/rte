import React, { useEffect, useState } from "react";
import { IconWrapper } from "../components/IconWrapper";
import { ButtonProps, EditorAPI, Plugin } from "../types";
import { sanitizeSvg } from "../utils/sanitizeSvg";

/**
 * Custom DOM event fired by the editor when an existing inline SVG is clicked.
 * The SVG plugin listens for it to reopen its modal in "edit" mode.
 *
 * detail: { api: EditorAPI; markup: string }
 * The `api` field scopes the event to the owning editor so multiple editors on
 * one page don't cross-trigger each other's modals.
 */
export const RTE_EDIT_SVG_EVENT = "rte:edit-svg";

export interface EditSvgEventDetail {
    api: EditorAPI;
    markup: string;
}

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="#4f46e5" />
</svg>`;

/**
 * SVG plugin: insert and edit inline SVG markup.
 *
 * A toolbar button opens a modal with a source textarea and a live (sanitized)
 * preview. Clicking an existing SVG in the editor reopens the same modal in
 * edit mode. All markup is passed through `sanitizeSvg` before it enters the
 * document.
 */
export function createSvgPlugin(): Plugin {
    return {
        name: "svg",
        type: "block",
        renderButton: (props: ButtonProps & { editorAPI?: EditorAPI }) => {
            const [showModal, setShowModal] = useState(false);
            const [mode, setMode] = useState<"insert" | "edit">("insert");
            const [source, setSource] = useState("");
            const [error, setError] = useState("");

            // Reopen in edit mode when an existing SVG in this editor is clicked.
            useEffect(() => {
                const handler = (e: Event) => {
                    const detail = (e as CustomEvent<EditSvgEventDetail>).detail;
                    if (!detail || detail.api !== props.editorAPI) return;
                    setSource(detail.markup || "");
                    setMode("edit");
                    setError("");
                    setShowModal(true);
                };
                document.addEventListener(RTE_EDIT_SVG_EVENT, handler);
                return () =>
                    document.removeEventListener(RTE_EDIT_SVG_EVENT, handler);
            }, [props.editorAPI]);

            const close = () => {
                setShowModal(false);
                setSource("");
                setError("");
                setMode("insert");
            };

            const openInsert = () => {
                setMode("insert");
                setSource("");
                setError("");
                setShowModal(true);
            };

            const handleSubmit = () => {
                if (!props.editorAPI) return;
                const clean = sanitizeSvg(source);
                if (!clean) {
                    setError(
                        "Invalid SVG. Make sure the markup contains a single <svg> root.",
                    );
                    return;
                }
                if (mode === "edit") {
                    props.editorAPI.executeCommand("updateSvg", clean);
                } else {
                    props.editorAPI.executeCommand("insertSvg", clean);
                }
                close();
            };

            const preview = source.trim() ? sanitizeSvg(source) : "";

            return (
                <>
                    <button
                        type="button"
                        onClick={openInsert}
                        disabled={props.disabled}
                        className="rte-toolbar-button"
                        title="Insert SVG"
                        aria-label="Insert SVG"
                    >
                        <IconWrapper
                            icon="mdi:vector-square"
                            width={18}
                            height={18}
                        />
                    </button>

                    {showModal && (
                        <div
                            className="rte-image-modal-overlay"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) close();
                            }}
                        >
                            <div className="rte-image-modal rte-svg-modal">
                                <div className="rte-image-modal-header">
                                    <h3>
                                        {mode === "edit"
                                            ? "Edit SVG"
                                            : "Insert SVG"}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={close}
                                        className="rte-image-modal-close"
                                        aria-label="Close"
                                    >
                                        <IconWrapper
                                            icon="mdi:close"
                                            width={20}
                                            height={20}
                                        />
                                    </button>
                                </div>

                                <div className="rte-image-modal-content">
                                    <div className="rte-svg-source-section">
                                        <label htmlFor="rte-svg-source">
                                            SVG Source
                                        </label>
                                        <textarea
                                            id="rte-svg-source"
                                            className="rte-svg-source-input"
                                            value={source}
                                            spellCheck={false}
                                            onChange={(e) => {
                                                setSource(e.target.value);
                                                if (error) setError("");
                                            }}
                                            placeholder={PLACEHOLDER_SVG}
                                            rows={10}
                                        />
                                    </div>

                                    {error && (
                                        <div className="rte-svg-error">
                                            {error}
                                        </div>
                                    )}

                                    {preview && (
                                        <div className="rte-svg-preview">
                                            <div
                                                className="rte-svg-preview-canvas"
                                                // Preview markup is sanitized by sanitizeSvg above.
                                                dangerouslySetInnerHTML={{
                                                    __html: preview,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="rte-image-modal-footer">
                                    <button
                                        type="button"
                                        onClick={close}
                                        className="rte-image-modal-cancel"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!source.trim()}
                                        className="rte-image-modal-insert"
                                    >
                                        {mode === "edit" ? "Update" : "Insert"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            );
        },
        // Insertion/editing lives entirely in renderButton (modal state must be
        // owned by React). Programmatic insertion goes through
        // editor.executeCommand("insertSvg", markup).
        canExecute: () => true,
    };
}
