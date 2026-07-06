import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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
import { createSvgPlugin, RTE_EDIT_SVG_EVENT } from "../plugins/svg";
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
import { findClosestListItem } from "../utils/dom";
import { HistoryManager } from "../utils/history";
import { indentListItem, outdentListItem } from "../utils/listIndent";
import { isImageSrcSafe, sanitizeHtml } from "../utils/sanitize";
import {
    restoreSerializedSelection,
    serializeSelection,
} from "../utils/selection";
import { createSvgElementFromMarkup } from "../utils/sanitizeSvg";
import { buildPluginsFromSettings } from "../utils/settings";
import { FloatingToolbar } from "./FloatingToolbar";
import { LinkTooltip } from "./LinkTooltip";
import { Toolbar } from "./Toolbar";

/**
 * When pasting list content while the caret sits inside a list item, merge the
 * pasted <li>s as siblings into the surrounding list instead of dropping a
 * whole <ul>/<ol> inside the current <li>. The naive insert nests the list
 * (<li><ul><li>…), which renders duplicate bullets/numbers and stacked
 * indentation.
 *
 * Returns true when it handled the paste (the caller must not insert the
 * fragment again); false to fall back to the default insertion path.
 */
function tryMergeListPaste(
    range: Range,
    tempDiv: HTMLElement,
    editor: HTMLElement,
): boolean {
    const anchorLi = findClosestListItem(range.startContainer);
    if (!anchorLi || !editor.contains(anchorLi)) return false;

    const parentList = anchorLi.parentElement;
    if (
        !parentList ||
        (parentList.tagName !== "UL" && parentList.tagName !== "OL")
    ) {
        return false;
    }

    // The split below needs the caret to live inside the anchor item.
    if (
        anchorLi !== range.startContainer &&
        !anchorLi.contains(range.startContainer)
    ) {
        return false;
    }

    // Only merge when every top-level pasted node is a list; mixed content
    // keeps the default behavior.
    const topNodes = Array.from(tempDiv.childNodes).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE,
    ) as HTMLElement[];
    if (
        topNodes.length === 0 ||
        !topNodes.every((n) => n.tagName === "UL" || n.tagName === "OL")
    ) {
        return false;
    }

    // Collect the pasted list items in document order.
    const items: HTMLLIElement[] = [];
    topNodes.forEach((list) => {
        Array.from(list.children).forEach((child) => {
            if (child.tagName === "LI") items.push(child as HTMLLIElement);
        });
    });
    if (items.length === 0) return false;

    // Drop any selected content, then split the anchor item at the caret:
    // everything after the caret is re-attached to the last pasted item.
    range.deleteContents();
    const anchorWasEmpty = !(anchorLi.textContent || "").trim();

    const afterRange = document.createRange();
    afterRange.setStart(range.startContainer, range.startOffset);
    afterRange.setEnd(anchorLi, anchorLi.childNodes.length);
    const afterFrag = afterRange.extractContents();

    let ref: Element = anchorLi;
    items.forEach((li) => {
        parentList.insertBefore(li, ref.nextSibling);
        ref = li;
    });
    const lastPasted = ref as HTMLLIElement;

    // Caret goes to the end of the pasted content, before any trailing text.
    const caretAfter = lastPasted.lastChild;
    if ((afterFrag.textContent || "").length > 0 || afterFrag.childNodes.length) {
        lastPasted.appendChild(afterFrag);
    }
    if (anchorWasEmpty) anchorLi.remove();

    const caretRange = document.createRange();
    if (caretAfter) {
        caretRange.setStartAfter(caretAfter);
    } else {
        caretRange.setStart(lastPasted, 0);
    }
    caretRange.collapse(true);

    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(caretRange);
    }
    return true;
}

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
    // The inline SVG most recently clicked for editing; target of "updateSvg".
    const editingSvgRef = useRef<Element | null>(null);

    // Mirror the editor DOM node into state so descendants that need to
    // reactively bind to it (FloatingToolbar, LinkTooltip) re-render once the
    // node attaches. A plain ref does not trigger a re-render on assignment.
    const [editorEl, setEditorEl] = useState<HTMLDivElement | null>(null);
    const setEditorRef = useCallback((node: HTMLDivElement | null) => {
        (editorRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
        setEditorEl(node);
    }, []);

    // Mirror maxLength prop into a ref so any callback can read the current
    // value without being recreated when the prop changes.
    const maxLengthRef = useRef(maxLength);
    useEffect(() => {
        maxLengthRef.current = maxLength;
    }, [maxLength]);

    /**
     * Returns true if appending `toAdd` would push the editor past maxLength.
     * For non-text inserts (e.g. images) pass "" — the helper still blocks
     * when the current length is already at/over the limit.
     */
    const wouldExceedMaxLength = useCallback((toAdd: string): boolean => {
        const max = maxLengthRef.current;
        if (max === undefined) return false;
        const editor = editorRef.current;
        if (!editor) return false;
        return (editor.innerText || "").length + toAdd.length > max;
    }, []);

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
        allPlugins.push(createSvgPlugin());

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

            // History/dispatch commands that manage their own snapshots
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
                if (wouldExceedMaxLength("")) return false;
                return handleInsertImage(
                    editor,
                    value,
                    isUpdatingRef,
                    historyRef,
                    mountedRef,
                    notifyChange,
                );
            }

            if (command === "insertSvg" && value) {
                if (wouldExceedMaxLength("")) return false;
                return handleInsertSvg(
                    editor,
                    value,
                    isUpdatingRef,
                    historyRef,
                    mountedRef,
                    notifyChange,
                );
            }

            if (command === "updateSvg" && value) {
                const target = editingSvgRef.current;
                if (!target || !editor.contains(target)) return false;
                const newEl = createSvgElementFromMarkup(value);
                if (!newEl) return false;

                const beforeContent = domToContent(editor);
                const beforeSel = serializeSelection(editor);
                historyRef.current.push(beforeContent, beforeSel);

                target.replaceWith(newEl);
                editingSvgRef.current = newEl;
                notifyChange(domToContent(editor));
                return true;
            }

            // General commands via document.execCommand.
            // Snapshot before/after so we only push history when the command
            // actually changed the document — this prevents Undo from having
            // to walk through identical no-op entries (e.g. clicking Bold
            // outside the editor or on an empty selection).
            ensureEditorFocused(editor);

            const beforeContent = domToContent(editor);
            const beforeSel = serializeSelection(editor);

            document.execCommand(command, false, value);

            const afterContent = domToContent(editor);
            if (
                JSON.stringify(beforeContent) !== JSON.stringify(afterContent)
            ) {
                historyRef.current.push(beforeContent, beforeSel);
            }

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
                const words =
                    trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
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
        wouldExceedMaxLength,
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

    // --- Click-to-edit inline SVG ---
    useEffect(() => {
        if (readOnly) return;
        const editor = editorRef.current;
        if (!editor) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            const svg = target?.closest?.(".rte-svg") as HTMLElement | null;
            if (!svg || !editor.contains(svg)) return;
            editingSvgRef.current = svg;
            // Present clean source in the editor: hide the internal attributes
            // the editor adds when embedding the SVG.
            const clone = svg.cloneNode(true) as Element;
            clone.classList.remove("rte-svg");
            if (clone.getAttribute("class") === "")
                clone.removeAttribute("class");
            clone.removeAttribute("contenteditable");
            // Scope the event to this editor's API so other editors ignore it.
            document.dispatchEvent(
                new CustomEvent(RTE_EDIT_SVG_EVENT, {
                    detail: { api: editorAPI, markup: clone.outerHTML },
                }),
            );
        };
        editor.addEventListener("click", handleClick);
        return () => editor.removeEventListener("click", handleClick);
    }, [editorAPI, readOnly, editorEl]);

    // --- Max Length enforcement ---
    useEffect(() => {
        if (maxLength === undefined) return;
        const editor = editorRef.current;
        if (!editor) return;
        const handleBeforeInput = (e: Event) => {
            const inputEvent = e as InputEvent;
            if (!inputEvent.inputType?.startsWith("insert")) return;

            // Compute the projected text addition: prefer InputEvent.data
            // (typing, IME), fall back to clipboard text for paste/drop, and
            // treat structural inserts (paragraph, line break) as 1 char so
            // they are blocked once the cap is reached.
            let projected = "";
            if (inputEvent.data) {
                projected = inputEvent.data;
            } else if (inputEvent.dataTransfer) {
                projected = inputEvent.dataTransfer.getData("text/plain") || "";
            } else {
                projected = "\n";
            }

            if (wouldExceedMaxLength(projected)) {
                e.preventDefault();
            }
        };
        editor.addEventListener("beforeinput", handleBeforeInput);
        return () => {
            editor.removeEventListener("beforeinput", handleBeforeInput);
        };
    }, [maxLength, wouldExceedMaxLength]);

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
            const words =
                trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
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
            // Respect maxLength: refuse new content once the cap is reached.
            if (wouldExceedMaxLength("")) return;

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
                if (!isImageSrcSafe(realUrl)) {
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
                if (wouldExceedMaxLength("")) return;
                const file = item.getAsFile();
                if (file) insertImageFile(file);
                return;
            }
        }

        e.preventDefault();

        // Plain-text paste: Cmd/Ctrl+Shift+V
        const nativeEvent = e.nativeEvent as ClipboardEvent & {
            shiftKey?: boolean;
        };
        if (nativeEvent.shiftKey) {
            const text = e.clipboardData.getData("text/plain");
            if (text && !wouldExceedMaxLength(text)) {
                document.execCommand("insertText", false, text);
                const editor = editorRef.current;
                if (editor) notifyChange(domToContent(editor));
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

                    // Build the fragment first so we can measure its text
                    // contribution against maxLength before inserting it.
                    const tempDiv = document.createElement("div");
                    contentToDOM(
                        pastedContent,
                        tempDiv,
                        customLinkComponent,
                        customHeadingRenderer,
                    );
                    const pastedText = tempDiv.innerText || "";
                    if (wouldExceedMaxLength(pastedText)) return;

                    // List-aware paste: merge pasted <li>s into the current
                    // list instead of nesting a whole list inside the item.
                    if (tryMergeListPaste(range, tempDiv, editor)) {
                        ensureAllCheckboxes(editor);
                        notifyChange(domToContent(editor));
                        return;
                    }

                    range.deleteContents();

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
                if (text && !wouldExceedMaxLength(text)) {
                    document.execCommand("insertText", false, text);
                }
            }
        } else if (text) {
            if (wouldExceedMaxLength(text)) return;
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
              ...(theme.buttonActiveBg &&
                  ({
                      "--rte-button-active-bg": theme.buttonActiveBg,
                  } as React.CSSProperties)),
              ...(theme.contentBg &&
                  ({
                      "--rte-content-bg": theme.contentBg,
                  } as React.CSSProperties)),
              ...(theme.textColor &&
                  ({
                      "--rte-text-color": theme.textColor,
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
                ref={setEditorRef}
                contentEditable={!readOnly}
                className={`rte-editor ${readOnly ? "rte-editor-readonly" : ""} ${editorClassName || ""}`}
                data-placeholder={placeholder}
                onPaste={readOnly ? undefined : handlePaste}
                onDrop={
                    readOnly
                        ? undefined
                        : (e: React.DragEvent) => {
                              const files = e.dataTransfer.files;
                              if (files.length === 0) return;
                              // Always preventDefault for any file drop so the browser
                              // does not navigate away from the page when the user
                              // drops e.g. a PDF or text file onto the editor. We only
                              // act on images; other file types are silently ignored.
                              e.preventDefault();
                              for (let i = 0; i < files.length; i++) {
                                  if (files[i].type.startsWith("image/")) {
                                      insertImageFile(files[i]);
                                      return;
                                  }
                              }
                          }
                }
                onDragOver={
                    readOnly
                        ? undefined
                        : (e: React.DragEvent) => {
                              const types = e.dataTransfer.types;
                              if (
                                  types &&
                                  Array.from(types).includes("Files")
                              ) {
                                  e.preventDefault();
                              }
                          }
                }
                suppressContentEditableWarning
            />
            {!readOnly && (
                <FloatingToolbar
                    plugins={plugins}
                    editorAPI={editorAPI}
                    editorElement={editorEl}
                />
            )}
            <LinkTooltip editorElement={editorEl} />
            {showWordCount && (
                <div className="rte-word-count">
                    {wordCount.words} words &middot; {wordCount.characters}{" "}
                    characters
                </div>
            )}
        </div>
    );
};

// --- Helper: Insert inline SVG ---
function handleInsertSvg(
    editor: HTMLElement,
    markup: string,
    isUpdatingRef: { current: boolean },
    historyRef: { current: HistoryManager },
    mountedRef: { current: boolean },
    notifyChange: (content: EditorContent) => void,
): boolean {
    const svg = createSvgElementFromMarkup(markup);
    if (!svg) return false;

    let selection = window.getSelection();
    if (document.activeElement !== editor) {
        editor.focus();
    }
    selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        editor.appendChild(svg);
    } else {
        const range = selection.getRangeAt(0);
        // Only insert at the caret when it lives inside the editor; otherwise
        // append so the SVG never lands in unrelated DOM.
        if (editor.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            range.insertNode(svg);
        } else {
            editor.appendChild(svg);
        }
    }

    const newRange = document.createRange();
    newRange.setStartAfter(svg);
    newRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(newRange);

    saveAndNotify(editor, isUpdatingRef, historyRef, mountedRef, notifyChange);
    return true;
}

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
            saveAndNotify(
                editor,
                isUpdatingRef,
                historyRef,
                mountedRef,
                notifyChange,
            );
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

    // Validate URL safety — block javascript:, data:image/svg, etc.
    if (!isImageSrcSafe(realSrc)) {
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
