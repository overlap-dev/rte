import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCheckbox } from "../hooks/useCheckbox";
import { useEditorEvents } from "../hooks/useEditorEvents";
import { useEditorInit } from "../hooks/useEditorInit";
import { defaultPlugins } from "../plugins";
import { createBlockFormatPlugin } from "../plugins/blockFormat";
import {
    createBackgroundColorPlugin,
    createTextColorPlugin,
} from "../plugins/colors";
import { createFontSizePlugin } from "../plugins/fontSize";
import { createImagePlugin } from "../plugins/image";
import { EditorAPI, EditorContent, EditorProps } from "../types";
import { ensureAllCheckboxes } from "../utils/checkbox";
import {
    clearBackgroundColor,
    clearFontSize,
    clearFormatting,
    clearLinks,
    clearTextColor,
} from "../utils/clearFormatting";
import {
    contentToDOM,
    contentToHTML,
    createEmptyContent,
    domToContent,
    htmlToContent,
} from "../utils/content";
import { HistoryManager } from "../utils/history";
import { indentListItem, outdentListItem } from "../utils/listIndent";
import { isUrlSafe, sanitizeHtml } from "../utils/sanitize";
import {
    serializeSelection,
    restoreSerializedSelection,
} from "../utils/selection";
import { buildPluginsFromSettings } from "../utils/settings";
import { FloatingToolbar } from "./FloatingToolbar";
import { LinkTooltip } from "./LinkTooltip";
import { Toolbar } from "./Toolbar";

export const Editor: React.FC<EditorProps> = ({
    initialContent,
    onChange,
    plugins: providedPlugins,
    placeholder = "Enter text...",
    className,
    toolbarClassName,
    editorClassName,
    fontSizes,
    colors,
    headings,
    customLinkComponent,
    customHeadingRenderer,
    customRenderer,
    onEditorAPIReady,
    theme,
    onImageUpload,
    settings,
    settingsOptions,
    readOnly,
    onFocus,
    onBlur,
    maxLength,
    showWordCount,
}) => {
    // --- Shared Refs ---
    const editorRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HistoryManager>(new HistoryManager());
    const isUpdatingRef = useRef(false);
    const mountedRef = useRef(true);

    // Track mount status to guard async callbacks
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // --- Plugins ---
    const plugins = useMemo(() => {
        // When settings is provided and plugins is not, use buildPluginsFromSettings
        if (settings && !providedPlugins) {
            const opts = {
                ...settingsOptions,
                onImageUpload: settingsOptions?.onImageUpload ?? onImageUpload,
            };
            return buildPluginsFromSettings(settings, opts);
        }

        // When plugins are explicitly provided, use them as-is
        if (providedPlugins) {
            return [...providedPlugins];
        }

        // Default plugins path: apply shorthand customizations
        const allPlugins = [...defaultPlugins];

        if (headings && headings.length > 0) {
            const blockFormatIndex = allPlugins.findIndex(
                (p) => p.name === "blockFormat",
            );
            if (blockFormatIndex !== -1) {
                allPlugins[blockFormatIndex] =
                    createBlockFormatPlugin(headings);
            } else {
                const redoIndex = allPlugins.findIndex(
                    (p) => p.name === "redo",
                );
                if (redoIndex !== -1) {
                    allPlugins.splice(
                        redoIndex + 1,
                        0,
                        createBlockFormatPlugin(headings),
                    );
                } else {
                    allPlugins.push(createBlockFormatPlugin(headings));
                }
            }
        }

        if (fontSizes && fontSizes.length > 0) {
            const blockFormatIndex = allPlugins.findIndex(
                (p) => p.name === "blockFormat",
            );
            if (blockFormatIndex !== -1) {
                allPlugins.splice(
                    blockFormatIndex + 1,
                    0,
                    createFontSizePlugin(fontSizes),
                );
            } else {
                allPlugins.push(createFontSizePlugin(fontSizes));
            }
        }

        if (colors && colors.length > 0) {
            allPlugins.push(createTextColorPlugin(colors));
            allPlugins.push(createBackgroundColorPlugin(colors));
        }

        allPlugins.push(createImagePlugin(onImageUpload));

        return allPlugins;
    }, [
        providedPlugins,
        fontSizes,
        colors,
        headings,
        onImageUpload,
        settings,
        settingsOptions,
    ]);

    // --- Callbacks ---
    const notifyChange = useCallback(
        (content: EditorContent) => {
            if (onChange) onChange(content);
        },
        [onChange],
    );

    const getDomContent = useCallback((): EditorContent => {
        const editor = editorRef.current;
        if (!editor) return createEmptyContent();
        return domToContent(editor);
    }, []);

    const pushToHistory = useCallback((content: EditorContent) => {
        const editor = editorRef.current;
        const sel = editor ? serializeSelection(editor) : null;
        historyRef.current.push(content, sel);
    }, []);

    // --- Hooks ---
    const checkbox = useCheckbox({
        editorRef,
        isUpdatingRef,
        pushToHistory,
        notifyChange,
        getDomContent,
    });

    // --- Undo / Redo ---
    const undo = useCallback(() => {
        const entry = historyRef.current.undo();
        const editor = editorRef.current;
        if (entry && editor) {
            isUpdatingRef.current = true;
            contentToDOM(
                entry.content,
                editor,
                customLinkComponent,
                customHeadingRenderer,
            );
            restoreSerializedSelection(editor, entry.selection);
            isUpdatingRef.current = false;
            notifyChange(entry.content);
        }
    }, [customLinkComponent, customHeadingRenderer, notifyChange]);

    const redo = useCallback(() => {
        const entry = historyRef.current.redo();
        const editor = editorRef.current;
        if (entry && editor) {
            isUpdatingRef.current = true;
            contentToDOM(
                entry.content,
                editor,
                customLinkComponent,
                customHeadingRenderer,
            );
            restoreSerializedSelection(editor, entry.selection);
            isUpdatingRef.current = false;
            notifyChange(entry.content);
        }
    }, [customLinkComponent, customHeadingRenderer, notifyChange]);

    // --- Editor API ---
    const editorAPI = useMemo<EditorAPI>(() => {
        const executeCommand = (command: string, value?: string): boolean => {
            const editor = editorRef.current;
            if (!editor) return false;

            // Save history before non-history commands
            if (
                command !== "undo" &&
                command !== "redo" &&
                command !== "insertImage" &&
                command !== "insertCheckboxList"
            ) {
                const currentContent = domToContent(editor);
                const sel = serializeSelection(editor);
                historyRef.current.push(currentContent, sel);
            }

            if (command === "undo") {
                undo();
                return true;
            }

            if (command === "redo") {
                redo();
                return true;
            }

            if (command === "insertCheckboxList") {
                return checkbox.insertCheckboxList(editor);
            }

            if (command === "insertImage" && value) {
                return handleInsertImage(
                    editor,
                    value,
                    isUpdatingRef,
                    historyRef,
                    mountedRef,
                    notifyChange,
                );
            }

            // General commands via document.execCommand
            ensureEditorFocused(editor);

            document.execCommand(command, false, value);

            setTimeout(() => {
                if (!mountedRef.current) return;
                if (editor && !isUpdatingRef.current) {
                    ensureAllCheckboxes(editor);
                    const content = domToContent(editor);
                    notifyChange(content);
                }
            }, 0);

            return true;
        };

        return {
            executeCommand,

            getSelection: (): Selection | null => {
                if (typeof window === "undefined") return null;
                return window.getSelection();
            },

            getContent: (): EditorContent => {
                const editor = editorRef.current;
                if (!editor) return createEmptyContent();
                ensureAllCheckboxes(editor);
                return domToContent(editor);
            },

            setContent: (content: EditorContent): void => {
                const editor = editorRef.current;
                if (!editor) return;
                isUpdatingRef.current = true;
                contentToDOM(
                    content,
                    editor,
                    customLinkComponent,
                    customHeadingRenderer,
                );
                historyRef.current.push(content);
                isUpdatingRef.current = false;
                notifyChange(content);
            },

            insertBlock: (
                type: string,
                attributes?: Record<string, string>,
            ): void => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                const range = selection.getRangeAt(0);
                const block = document.createElement(type);
                if (attributes) {
                    Object.entries(attributes).forEach(([key, val]) => {
                        // Filter out event handler attributes
                        if (key.toLowerCase().startsWith("on")) return;
                        block.setAttribute(key, val);
                    });
                }
                range.insertNode(block);
                const textNode = document.createTextNode("\u200B");
                block.appendChild(textNode);
                range.setStartAfter(textNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                const editor = editorRef.current;
                if (editor) notifyChange(domToContent(editor));
            },

            insertInline: (
                type: string,
                attributes?: Record<string, string>,
            ): void => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                const range = selection.getRangeAt(0);
                const inline = document.createElement(type);
                if (attributes) {
                    Object.entries(attributes).forEach(([key, val]) => {
                        // Filter out event handler attributes
                        if (key.toLowerCase().startsWith("on")) return;
                        inline.setAttribute(key, val);
                    });
                }
                try {
                    range.surroundContents(inline);
                } catch (_) {
                    const contents = range.extractContents();
                    inline.appendChild(contents);
                    range.insertNode(inline);
                }
                range.setStartAfter(inline);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                const editor = editorRef.current;
                if (editor) notifyChange(domToContent(editor));
            },

            undo: (): void => undo(),
            redo: (): void => redo(),
            canUndo: (): boolean => historyRef.current.canUndo(),
            canRedo: (): boolean => historyRef.current.canRedo(),

            importHtml: (htmlString: string): EditorContent => {
                const content = htmlToContent(htmlString);
                const editor = editorRef.current;
                if (editor) {
                    isUpdatingRef.current = true;
                    contentToDOM(
                        content,
                        editor,
                        customLinkComponent,
                        customHeadingRenderer,
                    );
                    historyRef.current.push(content);
                    isUpdatingRef.current = false;
                    notifyChange(content);
                }
                return content;
            },

            exportHtml: (): string => {
                const editor = editorRef.current;
                if (!editor) return "";
                return contentToHTML(domToContent(editor));
            },

            clearFormatting: (): void => {
                executeWithHistory((selection) => clearFormatting(selection));
            },
            clearTextColor: (): void => {
                executeWithHistory((selection) => clearTextColor(selection));
            },
            clearBackgroundColor: (): void => {
                executeWithHistory((selection) =>
                    clearBackgroundColor(selection),
                );
            },
            clearFontSize: (): void => {
                executeWithHistory((selection) => clearFontSize(selection));
            },
            clearLinks: (): void => {
                executeWithHistory((selection) => clearLinks(selection));
            },
            indentListItem: (): void => {
                executeWithHistory((selection) => indentListItem(selection));
            },
            outdentListItem: (): void => {
                executeWithHistory((selection) => outdentListItem(selection));
            },
            getTextStats: (): { characters: number; words: number } => {
                const editor = editorRef.current;
                if (!editor) return { characters: 0, words: 0 };
                const text = editor.innerText || "";
                const characters = text.length;
                const trimmed = text.trim();
                const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
                return { characters, words };
            },
        };

        /** Helper: push history, execute operation, then notify change. */
        function executeWithHistory(
            operation: (selection: Selection) => void,
        ): void {
            const editor = editorRef.current;
            if (!editor) return;
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const currentContent = domToContent(editor);
            const sel = serializeSelection(editor);
            historyRef.current.push(currentContent, sel);
            operation(selection);
            setTimeout(() => {
                if (!mountedRef.current) return;
                if (editor) notifyChange(domToContent(editor));
            }, 0);
        }
    }, [
        undo,
        redo,
        checkbox,
        notifyChange,
        customLinkComponent,
        customHeadingRenderer,
    ]);

    // --- Initialize editor ---
    useEditorInit({
        editorRef,
        historyRef,
        isUpdatingRef,
        initialContent,
        notifyChange,
        customLinkComponent,
        customHeadingRenderer,
    });

    // --- Set up event listeners ---
    useEditorEvents({
        editorRef,
        historyRef,
        isUpdatingRef,
        mountedRef,
        notifyChange,
        handleCheckboxKeyDown: checkbox.handleCheckboxKeyDown,
        handleCheckboxEnter: checkbox.handleCheckboxEnter,
        undo,
        redo,
    });

    // --- Expose editor API ---
    useEffect(() => {
        if (onEditorAPIReady) onEditorAPIReady(editorAPI);
    }, [editorAPI, onEditorAPIReady]);

    // --- Focus / Blur callbacks ---
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const handleFocus = () => onFocus?.();
        const handleBlur = () => onBlur?.();
        editor.addEventListener("focus", handleFocus);
        editor.addEventListener("blur", handleBlur);
        return () => {
            editor.removeEventListener("focus", handleFocus);
            editor.removeEventListener("blur", handleBlur);
        };
    }, [onFocus, onBlur]);

    // --- Max Length enforcement ---
    useEffect(() => {
        if (maxLength === undefined) return;
        const editor = editorRef.current;
        if (!editor) return;
        const handleBeforeInput = (e: Event) => {
            const text = editor.innerText || "";
            if (text.length >= maxLength) {
                const inputEvent = e as InputEvent;
                if (inputEvent.inputType?.startsWith("insert")) {
                    e.preventDefault();
                }
            }
        };
        editor.addEventListener("beforeinput", handleBeforeInput);
        return () => {
            editor.removeEventListener("beforeinput", handleBeforeInput);
        };
    }, [maxLength]);

    // --- Word count state ---
    const [wordCount, setWordCount] = useState({ characters: 0, words: 0 });
    useEffect(() => {
        if (!showWordCount) return;
        const editor = editorRef.current;
        if (!editor) return;
        const updateCount = () => {
            const text = editor.innerText || "";
            const characters = text.length;
            const trimmed = text.trim();
            const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
            setWordCount({ characters, words });
        };
        updateCount();
        editor.addEventListener("input", updateCount);
        return () => editor.removeEventListener("input", updateCount);
    }, [showWordCount]);

    // --- Helper: insert an image file via the onImageUpload callback ---
    const insertImageFile = useCallback(
        async (file: File) => {
            if (!onImageUpload || !file.type.startsWith("image/")) return;
            const editor = editorRef.current;
            if (!editor) return;

            try {
                // Show a placeholder while uploading
                const placeholder = document.createElement("img");
                placeholder.setAttribute("data-uploading", "true");
                placeholder.className = "rte-image rte-image-uploading";
                // Use a tiny transparent gif as placeholder src
                placeholder.src =
                    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                placeholder.alt = file.name;

                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(placeholder);
                    range.setStartAfter(placeholder);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else {
                    editor.appendChild(placeholder);
                }

                // Upload
                const url = await onImageUpload(file);

                // Guard against unmount during async upload
                if (!mountedRef.current) return;

                // Parse the "url|__aid__:attachmentId" convention
                let realUrl = url;
                if (url.includes("|__aid__:")) {
                    const idx = url.indexOf("|__aid__:");
                    realUrl = url.substring(0, idx);
                    const attachmentId = url.substring(
                        idx + "|__aid__:".length,
                    );
                    if (attachmentId) {
                        placeholder.setAttribute(
                            "data-attachment-id",
                            attachmentId,
                        );
                    }
                }

                // Validate the returned URL before setting it
                if (!isUrlSafe(realUrl) && !realUrl.startsWith("data:image/")) {
                    placeholder.remove();
                    return;
                }

                // Replace placeholder with final image
                placeholder.src = realUrl;
                placeholder.removeAttribute("data-uploading");
                placeholder.style.opacity = "1";

                notifyChange(domToContent(editor));
            } catch (err) {
                console.error("Image upload failed:", err);
                // Remove failed placeholder
                const failedImg = editor.querySelector(
                    'img[data-uploading="true"]',
                );
                failedImg?.remove();
            }
        },
        [onImageUpload, notifyChange],
    );

    // --- Paste handler ---
    const handlePaste = (e: React.ClipboardEvent) => {
        // Check for pasted image files first
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) insertImageFile(file);
                return;
            }
        }

        e.preventDefault();

        // Plain-text paste: Cmd/Ctrl+Shift+V
        const nativeEvent = e.nativeEvent as ClipboardEvent & { shiftKey?: boolean };
        if (nativeEvent.shiftKey) {
            const text = e.clipboardData.getData("text/plain");
            if (text) {
                document.execCommand("insertText", false, text);
            }
            return;
        }

        const rawHtml = e.clipboardData.getData("text/html");
        const text = e.clipboardData.getData("text/plain");

        if (rawHtml) {
            try {
                const html = sanitizeHtml(rawHtml);
                const pastedContent = htmlToContent(html);
                const editor = editorRef.current;
                if (!editor) return;

                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();

                    const tempDiv = document.createElement("div");
                    contentToDOM(
                        pastedContent,
                        tempDiv,
                        customLinkComponent,
                        customHeadingRenderer,
                    );

                    const fragment = document.createDocumentFragment();
                    while (tempDiv.firstChild) {
                        fragment.appendChild(tempDiv.firstChild);
                    }

                    range.insertNode(fragment);
                    if (fragment.lastChild) {
                        range.setStartAfter(fragment.lastChild);
                        range.collapse(true);
                    }
                    selection.removeAllRanges();
                    selection.addRange(range);
                    notifyChange(domToContent(editor));
                }
            } catch (_) {
                document.execCommand("insertText", false, text);
            }
        } else if (text) {
            document.execCommand("insertText", false, text);
        }
    };

    // --- Theme styles ---
    const containerStyle: React.CSSProperties = theme
        ? {
              ...(theme.borderColor &&
                  ({
                      "--rte-border-color": theme.borderColor,
                  } as React.CSSProperties)),
              ...(theme.borderRadius &&
                  ({
                      "--rte-border-radius": `${theme.borderRadius}px`,
                  } as React.CSSProperties)),
              ...(theme.toolbarBg &&
                  ({
                      "--rte-toolbar-bg": theme.toolbarBg,
                  } as React.CSSProperties)),
              ...(theme.buttonHoverBg &&
                  ({
                      "--rte-button-hover-bg": theme.buttonHoverBg,
                  } as React.CSSProperties)),
              ...(theme.contentBg &&
                  ({
                      "--rte-content-bg": theme.contentBg,
                  } as React.CSSProperties)),
              ...(theme.primaryColor &&
                  ({
                      "--rte-primary-color": theme.primaryColor,
                  } as React.CSSProperties)),
          }
        : {};

    return (
        <div
            className={`rte-container ${readOnly ? "rte-container-readonly" : ""} ${className || ""}`}
            style={containerStyle}
        >
            {!readOnly && (
                <Toolbar
                    plugins={plugins}
                    editorAPI={editorAPI}
                    className={toolbarClassName}
                />
            )}
            <div
                ref={editorRef}
                contentEditable={!readOnly}
                className={`rte-editor ${readOnly ? "rte-editor-readonly" : ""} ${editorClassName || ""}`}
                data-placeholder={placeholder}
                onPaste={readOnly ? undefined : handlePaste}
                onDrop={readOnly ? undefined : (e: React.DragEvent) => {
                    const files = e.dataTransfer.files;
                    for (let i = 0; i < files.length; i++) {
                        if (files[i].type.startsWith("image/")) {
                            e.preventDefault();
                            insertImageFile(files[i]);
                            return;
                        }
                    }
                }}
                onDragOver={readOnly ? undefined : (e: React.DragEvent) => {
                    const types = e.dataTransfer.types;
                    if (types && Array.from(types).includes("Files")) {
                        e.preventDefault();
                    }
                }}
                suppressContentEditableWarning
            />
            {!readOnly && (
                <FloatingToolbar
                    plugins={plugins}
                    editorAPI={editorAPI}
                    editorElement={editorRef.current}
                />
            )}
            <LinkTooltip editorElement={editorRef.current} />
            {showWordCount && (
                <div className="rte-word-count">
                    {wordCount.words} words &middot; {wordCount.characters} characters
                </div>
            )}
        </div>
    );
};

// --- Helper: Insert Image ---
function handleInsertImage(
    editor: HTMLElement,
    value: string,
    isUpdatingRef: { current: boolean },
    historyRef: { current: HistoryManager },
    mountedRef: { current: boolean },
    notifyChange: (content: EditorContent) => void,
): boolean {
    let selection = window.getSelection();
    if (!selection) return false;

    if (document.activeElement !== editor) {
        editor.focus();
    }

    if (selection.rangeCount === 0) {
        const range = document.createRange();
        if (editor.childNodes.length > 0) {
            const lastChild = editor.childNodes[editor.childNodes.length - 1];
            range.setStartAfter(lastChild);
            range.collapse(true);
        } else {
            const img = createImageElement(value);
            editor.appendChild(img);
            const newRange = document.createRange();
            newRange.setStartAfter(img);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            saveAndNotify(editor, isUpdatingRef, historyRef, mountedRef, notifyChange);
            return true;
        }
        selection.removeAllRanges();
        selection.addRange(range);
    }

    if (selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    let parentElement: HTMLElement | null = null;

    if (container.nodeType === Node.TEXT_NODE) {
        parentElement = container.parentElement;
    } else if (container.nodeType === Node.ELEMENT_NODE) {
        parentElement = container as HTMLElement;
    }

    const img = createImageElement(value);

    if (
        parentElement &&
        parentElement !== editor &&
        /^(P|DIV|H[1-6])$/.test(parentElement.tagName)
    ) {
        if (parentElement.nextSibling) {
            editor.insertBefore(img, parentElement.nextSibling);
        } else {
            editor.appendChild(img);
        }
    } else {
        try {
            range.insertNode(img);
        } catch (_) {
            editor.appendChild(img);
        }
    }

    const newRange = document.createRange();
    newRange.setStartAfter(img);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    saveAndNotify(editor, isUpdatingRef, historyRef, mountedRef, notifyChange);
    return true;
}

/**
 * Creates an <img> element from a src string.
 *
 * Supports an extended format for passing attachment metadata:
 *   "url|__aid__:attachmentId"
 * If that format is detected, the real URL is extracted and
 * data-attachment-id is set on the element.
 */
function createImageElement(src: string): HTMLImageElement {
    const img = document.createElement("img");

    let realSrc = src;
    let altText = "";

    // Parse the "url|__alt__:altText" convention
    if (realSrc.includes("|__alt__:")) {
        const altIdx = realSrc.indexOf("|__alt__:");
        altText = realSrc.substring(altIdx + "|__alt__:".length);
        realSrc = realSrc.substring(0, altIdx);
    }

    // Parse the "url|__aid__:attachmentId" convention
    if (realSrc.includes("|__aid__:")) {
        const idx = realSrc.indexOf("|__aid__:");
        const attachmentId = realSrc.substring(idx + "|__aid__:".length);
        realSrc = realSrc.substring(0, idx);
        if (attachmentId) {
            img.setAttribute("data-attachment-id", attachmentId);
        }
    }

    // Validate URL safety — block javascript:, data:, etc.
    if (!isUrlSafe(realSrc) && !realSrc.startsWith("data:image/")) {
        realSrc = "";
    }

    img.setAttribute("src", realSrc);
    img.setAttribute("alt", altText);
    img.className = "rte-image";
    return img;
}

function saveAndNotify(
    editor: HTMLElement,
    isUpdatingRef: { current: boolean },
    historyRef: { current: HistoryManager },
    mountedRef: { current: boolean },
    notifyChange: (content: EditorContent) => void,
): void {
    isUpdatingRef.current = true;
    setTimeout(() => {
        if (!mountedRef.current) return;
        const content = domToContent(editor);
        const sel = serializeSelection(editor);
        historyRef.current.push(content, sel);
        isUpdatingRef.current = false;
        notifyChange(content);
    }, 0);
}

/** Ensures the editor is focused and has a valid selection. */
function ensureEditorFocused(editor: HTMLElement): void {
    const selection = window.getSelection();
    let savedRange: Range | null = null;

    if (selection && selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
    }

    if (document.activeElement !== editor) {
        editor.focus();
    }

    if (!selection || selection.rangeCount === 0) {
        const range = document.createRange();
        if (editor.childNodes.length > 0) {
            const lastChild = editor.childNodes[editor.childNodes.length - 1];
            if (lastChild.nodeType === Node.TEXT_NODE) {
                range.setStart(lastChild, lastChild.textContent?.length || 0);
                range.setEnd(lastChild, lastChild.textContent?.length || 0);
            } else {
                range.selectNodeContents(lastChild);
                range.collapse(false);
            }
        } else {
            const p = document.createElement("p");
            editor.appendChild(p);
            const textNode = document.createTextNode("");
            p.appendChild(textNode);
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
        }
        selection?.removeAllRanges();
        selection?.addRange(range);
    } else if (savedRange) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
    }
}
