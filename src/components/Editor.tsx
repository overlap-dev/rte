import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { defaultPlugins } from "../plugins";
import { buildPluginsFromSettings } from "../utils/settings";
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
import { useCheckbox } from "../hooks/useCheckbox";
import { useEditorEvents } from "../hooks/useEditorEvents";
import { useEditorInit } from "../hooks/useEditorInit";
import { useEditorSelection } from "../hooks/useEditorSelection";
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
}) => {
    // --- Shared Refs ---
    const editorRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HistoryManager>(new HistoryManager());
    const isUpdatingRef = useRef(false);

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

        const allPlugins = [...(providedPlugins || defaultPlugins)];

        if (headings && headings.length > 0) {
            const blockFormatIndex = allPlugins.findIndex(
                (p) => p.name === "blockFormat"
            );
            if (blockFormatIndex !== -1) {
                allPlugins[blockFormatIndex] =
                    createBlockFormatPlugin(headings);
            } else {
                const redoIndex = allPlugins.findIndex(
                    (p) => p.name === "redo"
                );
                if (redoIndex !== -1) {
                    allPlugins.splice(
                        redoIndex + 1,
                        0,
                        createBlockFormatPlugin(headings)
                    );
                } else {
                    allPlugins.push(createBlockFormatPlugin(headings));
                }
            }
        }

        if (fontSizes && fontSizes.length > 0) {
            const blockFormatIndex = allPlugins.findIndex(
                (p) => p.name === "blockFormat"
            );
            if (blockFormatIndex !== -1) {
                allPlugins.splice(
                    blockFormatIndex + 1,
                    0,
                    createFontSizePlugin(fontSizes)
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
    }, [providedPlugins, fontSizes, colors, headings, onImageUpload, settings, settingsOptions]);

    // --- Callbacks ---
    const notifyChange = useCallback(
        (content: EditorContent) => {
            if (onChange) onChange(content);
        },
        [onChange]
    );

    const getDomContent = useCallback((): EditorContent => {
        const editor = editorRef.current;
        if (!editor) return createEmptyContent();
        return domToContent(editor);
    }, []);

    const pushToHistory = useCallback((content: EditorContent) => {
        historyRef.current.push(content);
    }, []);

    // --- Hooks ---
    const { restoreSelection } = useEditorSelection();

    const checkbox = useCheckbox({
        editorRef,
        isUpdatingRef,
        pushToHistory,
        notifyChange,
        getDomContent,
    });

    // --- Undo / Redo ---
    const undo = useCallback(() => {
        const content = historyRef.current.undo();
        const editor = editorRef.current;
        if (content && editor) {
            isUpdatingRef.current = true;
            contentToDOM(
                content,
                editor,
                customLinkComponent,
                customHeadingRenderer
            );
            restoreSelection(editor);
            isUpdatingRef.current = false;
            notifyChange(content);
        }
    }, [
        customLinkComponent,
        customHeadingRenderer,
        restoreSelection,
        notifyChange,
    ]);

    const redo = useCallback(() => {
        const content = historyRef.current.redo();
        const editor = editorRef.current;
        if (content && editor) {
            isUpdatingRef.current = true;
            contentToDOM(
                content,
                editor,
                customLinkComponent,
                customHeadingRenderer
            );
            restoreSelection(editor);
            isUpdatingRef.current = false;
            notifyChange(content);
        }
    }, [
        customLinkComponent,
        customHeadingRenderer,
        restoreSelection,
        notifyChange,
    ]);

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
                historyRef.current.push(currentContent);
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
                    notifyChange
                );
            }

            // General commands via document.execCommand
            ensureEditorFocused(editor);

            document.execCommand(command, false, value);

            setTimeout(() => {
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
                    customHeadingRenderer
                );
                historyRef.current.push(content);
                isUpdatingRef.current = false;
                notifyChange(content);
            },

            insertBlock: (
                type: string,
                attributes?: Record<string, string>
            ): void => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                const range = selection.getRangeAt(0);
                const block = document.createElement(type);
                if (attributes) {
                    Object.entries(attributes).forEach(([key, val]) => {
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
                attributes?: Record<string, string>
            ): void => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                const range = selection.getRangeAt(0);
                const inline = document.createElement(type);
                if (attributes) {
                    Object.entries(attributes).forEach(([key, val]) => {
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
                        customHeadingRenderer
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
                    clearBackgroundColor(selection)
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
        };

        /** Helper: push history, execute operation, then notify change. */
        function executeWithHistory(
            operation: (selection: Selection) => void
        ): void {
            const editor = editorRef.current;
            if (!editor) return;
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const currentContent = domToContent(editor);
            historyRef.current.push(currentContent);
            operation(selection);
            setTimeout(() => {
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

                // Parse the "url|__aid__:attachmentId" convention
                let realUrl = url;
                if (url.includes("|__aid__:")) {
                    const idx = url.indexOf("|__aid__:");
                    realUrl = url.substring(0, idx);
                    const attachmentId = url.substring(idx + "|__aid__:".length);
                    if (attachmentId) {
                        placeholder.setAttribute("data-attachment-id", attachmentId);
                    }
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
                    'img[data-uploading="true"]'
                );
                failedImg?.remove();
            }
        },
        [onImageUpload, notifyChange]
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
        const html = e.clipboardData.getData("text/html");
        const text = e.clipboardData.getData("text/plain");

        if (html) {
            try {
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
                        customHeadingRenderer
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
            className={`rte-container ${className || ""}`}
            style={containerStyle}
        >
            <Toolbar
                plugins={plugins}
                editorAPI={editorAPI}
                className={toolbarClassName}
            />
            <div
                ref={editorRef}
                contentEditable
                className={`rte-editor ${editorClassName || ""}`}
                data-placeholder={placeholder}
                onPaste={handlePaste}
                onDrop={(e: React.DragEvent) => {
                    const files = e.dataTransfer.files;
                    for (let i = 0; i < files.length; i++) {
                        if (files[i].type.startsWith("image/")) {
                            e.preventDefault();
                            insertImageFile(files[i]);
                            return;
                        }
                    }
                }}
                onDragOver={(e: React.DragEvent) => {
                    // Allow drop
                    const types = e.dataTransfer.types;
                    if (types && Array.from(types).includes("Files")) {
                        e.preventDefault();
                    }
                }}
                suppressContentEditableWarning
            />
        </div>
    );
};

// --- Helper: Insert Image ---
function handleInsertImage(
    editor: HTMLElement,
    value: string,
    isUpdatingRef: React.MutableRefObject<boolean>,
    historyRef: React.MutableRefObject<HistoryManager>,
    notifyChange: (content: EditorContent) => void
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
            saveAndNotify(editor, isUpdatingRef, historyRef, notifyChange);
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

    saveAndNotify(editor, isUpdatingRef, historyRef, notifyChange);
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
    // Parse the "url|__aid__:attachmentId" convention
    if (src.includes("|__aid__:")) {
        const idx = src.indexOf("|__aid__:");
        realSrc = src.substring(0, idx);
        const attachmentId = src.substring(idx + "|__aid__:".length);
        if (attachmentId) {
            img.setAttribute("data-attachment-id", attachmentId);
        }
    }

    img.setAttribute("src", realSrc);
    img.setAttribute("alt", "");
    img.className = "rte-image";
    return img;
}

function saveAndNotify(
    editor: HTMLElement,
    isUpdatingRef: React.MutableRefObject<boolean>,
    historyRef: React.MutableRefObject<HistoryManager>,
    notifyChange: (content: EditorContent) => void
): void {
    isUpdatingRef.current = true;
    setTimeout(() => {
        const content = domToContent(editor);
        historyRef.current.push(content);
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
                range.setStart(
                    lastChild,
                    lastChild.textContent?.length || 0
                );
                range.setEnd(
                    lastChild,
                    lastChild.textContent?.length || 0
                );
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
