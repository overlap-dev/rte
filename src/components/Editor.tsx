import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { defaultPlugins } from "../plugins";
import {
    createBackgroundColorPlugin,
    createTextColorPlugin,
} from "../plugins/colors";
import { createFontSizePlugin } from "../plugins/fontSize";
import { createHeadingsPlugin } from "../plugins/headings";
import { createImagePlugin } from "../plugins/image";
import { EditorAPI, EditorContent, EditorProps } from "../types";
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
import { Toolbar } from "./Toolbar";

export const Editor: React.FC<EditorProps> = ({
    initialContent,
    onChange,
    plugins: providedPlugins,
    placeholder = "Text eingeben...",
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
}) => {
    const plugins = useMemo(() => {
        const allPlugins = [...(providedPlugins || defaultPlugins)];

        if (fontSizes && fontSizes.length > 0) {
            allPlugins.push(createFontSizePlugin(fontSizes));
        }

        if (colors && colors.length > 0) {
            allPlugins.push(createTextColorPlugin(colors));
            allPlugins.push(createBackgroundColorPlugin(colors));
        }

        if (headings && headings.length > 0) {
            allPlugins.push(createHeadingsPlugin(headings));
        }

        allPlugins.push(createImagePlugin(onImageUpload));

        return allPlugins;
    }, [providedPlugins, fontSizes, colors, headings, onImageUpload]);
    const editorRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HistoryManager>(new HistoryManager());
    const isUpdatingRef = useRef(false);

    const notifyChange = useCallback(
        (content: EditorContent) => {
            if (onChange && !isUpdatingRef.current) {
                onChange(content);
            }
        },
        [onChange]
    );

    const restoreSelection = useCallback((editor: HTMLElement) => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const range = document.createRange();
        const selection = window.getSelection();

        if (editor.firstChild) {
            range.setStart(editor.firstChild, 0);
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }, []);

    const editorAPI = useMemo<EditorAPI>(() => {
        const executeCommand = (command: string, value?: string): boolean => {
            const editor = editorRef.current;
            if (!editor) return false;

            if (
                command !== "undo" &&
                command !== "redo" &&
                command !== "insertImage"
            ) {
                const currentContent = domToContent(editor);
                historyRef.current.push(currentContent);
            }

            if (command === "undo") {
                const content = historyRef.current.undo();
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
                return true;
            }

            if (command === "redo") {
                const content = historyRef.current.redo();
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
                return true;
            }

            if (command === "insertImage" && value) {
                let selection = window.getSelection();
                if (!selection) return false;

                if (document.activeElement !== editor) {
                    editor.focus();
                }

                if (selection.rangeCount === 0) {
                    const range = document.createRange();
                    if (editor.childNodes.length > 0) {
                        const lastChild =
                            editor.childNodes[editor.childNodes.length - 1];
                        range.setStartAfter(lastChild);
                        range.collapse(true);
                    } else {
                        const img = document.createElement("img");
                        img.setAttribute("src", value);
                        img.setAttribute("alt", "");
                        img.style.maxWidth = "100%";
                        img.style.height = "auto";
                        img.style.display = "block";
                        img.style.margin = "16px 0";
                        editor.appendChild(img);

                        const newRange = document.createRange();
                        newRange.setStartAfter(img);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);

                        isUpdatingRef.current = true;
                        setTimeout(() => {
                            if (editor) {
                                const currentContent = domToContent(editor);
                                historyRef.current.push(currentContent);
                                isUpdatingRef.current = false;
                                notifyChange(currentContent);
                            }
                        }, 0);
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

                const img = document.createElement("img");
                img.setAttribute("src", value);
                img.setAttribute("alt", "");
                img.style.maxWidth = "100%";
                img.style.height = "auto";
                img.style.display = "block";
                img.style.margin = "16px 0";

                if (
                    parentElement &&
                    parentElement !== editor &&
                    (parentElement.tagName === "P" ||
                        parentElement.tagName === "DIV" ||
                        parentElement.tagName === "H1" ||
                        parentElement.tagName === "H2" ||
                        parentElement.tagName === "H3" ||
                        parentElement.tagName === "H4" ||
                        parentElement.tagName === "H5" ||
                        parentElement.tagName === "H6")
                ) {
                    if (parentElement.nextSibling) {
                        editor.insertBefore(img, parentElement.nextSibling);
                    } else {
                        editor.appendChild(img);
                    }
                } else {
                    try {
                        range.insertNode(img);
                    } catch (e) {
                        editor.appendChild(img);
                    }
                }

                const newRange = document.createRange();
                newRange.setStartAfter(img);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);

                isUpdatingRef.current = true;
                setTimeout(() => {
                    if (editor) {
                        const currentContent = domToContent(editor);
                        historyRef.current.push(currentContent);
                        isUpdatingRef.current = false;
                        notifyChange(currentContent);
                    }
                }, 0);

                return true;
            }

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
                    const lastChild =
                        editor.childNodes[editor.childNodes.length - 1];
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

            document.execCommand(command, false, value);

            setTimeout(() => {
                if (editor && !isUpdatingRef.current) {
                    const content = domToContent(editor);
                    notifyChange(content);
                }
            }, 0);

            return true;
        };

        return {
            executeCommand,

            getSelection: (): Selection | null => {
                if (typeof window === 'undefined') return null;
                return window.getSelection();
            },

            getContent: (): EditorContent => {
                const editor = editorRef.current;
                if (!editor) return createEmptyContent();
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
                    Object.entries(attributes).forEach(([key, value]) => {
                        block.setAttribute(key, value);
                    });
                }

                range.insertNode(block);
                const textNode = document.createTextNode("\u200B"); // Zero-width space
                block.appendChild(textNode);

                // Cursor setzen
                range.setStartAfter(textNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                const editor = editorRef.current;
                if (editor) {
                    const content = domToContent(editor);
                    notifyChange(content);
                }
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
                    Object.entries(attributes).forEach(([key, value]) => {
                        inline.setAttribute(key, value);
                    });
                }

                try {
                    range.surroundContents(inline);
                } catch (e) {
                    // Falls surroundContents fehlschlägt, versuche es anders
                    const contents = range.extractContents();
                    inline.appendChild(contents);
                    range.insertNode(inline);
                }

                // Cursor setzen
                range.setStartAfter(inline);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                const editor = editorRef.current;
                if (editor) {
                    const content = domToContent(editor);
                    notifyChange(content);
                }
            },

            undo: (): void => {
                executeCommand("undo");
            },

            redo: (): void => {
                executeCommand("redo");
            },

            canUndo: (): boolean => {
                return historyRef.current.canUndo();
            },

            canRedo: (): boolean => {
                return historyRef.current.canRedo();
            },

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
                const content = domToContent(editor);
                return contentToHTML(content);
            },

            clearFormatting: (): void => {
                const editor = editorRef.current;
                if (!editor) return;

                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const currentContent = domToContent(editor);
                    historyRef.current.push(currentContent);

                    clearFormatting(selection);

                    setTimeout(() => {
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                }
            },

            clearTextColor: (): void => {
                const editor = editorRef.current;
                if (!editor) return;

                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const currentContent = domToContent(editor);
                    historyRef.current.push(currentContent);

                    clearTextColor(selection);

                    setTimeout(() => {
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                }
            },

            clearBackgroundColor: (): void => {
                const editor = editorRef.current;
                if (!editor) return;

                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const currentContent = domToContent(editor);
                    historyRef.current.push(currentContent);

                    clearBackgroundColor(selection);

                    setTimeout(() => {
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                }
            },

            clearFontSize: (): void => {
                const editor = editorRef.current;
                if (!editor) return;

                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const currentContent = domToContent(editor);
                    historyRef.current.push(currentContent);

                    clearFontSize(selection);

                    setTimeout(() => {
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                }
            },

            clearLinks: (): void => {
                const editor = editorRef.current;
                if (!editor) return;

                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const currentContent = domToContent(editor);
                    historyRef.current.push(currentContent);

                    clearLinks(selection);

                    setTimeout(() => {
                        if (editor) {
                            const content = domToContent(editor);
                            notifyChange(content);
                        }
                    }, 0);
                }
            },
        };
    }, [
        notifyChange,
        restoreSelection,
        customLinkComponent,
        customHeadingRenderer,
    ]);

    useEffect(() => {
        if (onEditorAPIReady) {
            onEditorAPIReady(editorAPI);
        }
    }, [editorAPI, onEditorAPIReady]);

    const isInitializedRef = useRef(false);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || isInitializedRef.current) return;

        const content = initialContent || createEmptyContent();
        isUpdatingRef.current = true;
        contentToDOM(
            content,
            editor,
            customLinkComponent,
            customHeadingRenderer
        );
        historyRef.current.push(content);
        isUpdatingRef.current = false;
        isInitializedRef.current = true;

        let inputTimeout: ReturnType<typeof setTimeout> | null = null;
        const handleInput = () => {
            if (isUpdatingRef.current) return;

            const content = domToContent(editor);
            notifyChange(content);

            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }
            inputTimeout = setTimeout(() => {
                historyRef.current.push(content);
                inputTimeout = null;
            }, 300);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const isModifierPressed = e.metaKey || e.ctrlKey;

            if (e.key === "Tab" && !isModifierPressed && !e.altKey) {
                const selection = window.getSelection();

                const isSelectionInEditor =
                    selection &&
                    selection.rangeCount > 0 &&
                    editor.contains(
                        selection.getRangeAt(0).commonAncestorContainer
                    );

                const isEditorFocused =
                    document.activeElement === editor ||
                    editor.contains(document.activeElement) ||
                    isSelectionInEditor;

                if (!isEditorFocused) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                if (
                    isSelectionInEditor &&
                    selection &&
                    selection.rangeCount > 0
                ) {
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    const listItem =
                        container.nodeType === Node.TEXT_NODE
                            ? container.parentElement?.closest("li")
                            : (container as HTMLElement).closest("li");

                    if (listItem && editor.contains(listItem)) {
                        e.stopImmediatePropagation();

                        const currentContent = domToContent(editor);
                        historyRef.current.push(currentContent);

                        if (e.shiftKey) {
                            outdentListItem(selection);
                        } else {
                            indentListItem(selection);
                        }

                        setTimeout(() => {
                            if (editor) {
                                const content = domToContent(editor);
                                notifyChange(content);
                            }
                        }, 0);
                        return;
                    }
                }

                document.execCommand("insertText", false, "\t");
            }

            if (isModifierPressed && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                editorAPI.undo();
            } else if (
                isModifierPressed &&
                (e.key === "y" || (e.key === "z" && e.shiftKey))
            ) {
                e.preventDefault();
                e.stopPropagation();
                editorAPI.redo();
            }
        };

        editor.addEventListener("input", handleInput);
        editor.addEventListener("keydown", handleKeyDown);

        return () => {
            editor.removeEventListener("input", handleInput);
            editor.removeEventListener("keydown", handleKeyDown);
            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }
        };
    }, [editorAPI, notifyChange]);

    const handlePaste = (e: React.ClipboardEvent) => {
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

                    const content = domToContent(editor);
                    notifyChange(content);
                }
            } catch (error) {
                document.execCommand("insertText", false, text);
            }
        } else if (text) {
            document.execCommand("insertText", false, text);
        }
    };
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
                suppressContentEditableWarning
            />
        </div>
    );
};
