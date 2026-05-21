// Components
export { Dropdown } from "./components/Dropdown";
export { Editor } from "./components/Editor";
export { FloatingToolbar } from "./components/FloatingToolbar";
export { Toolbar } from "./components/Toolbar";

// Plugins
export * from "./plugins";
export * from "./plugins/alignment";
export * from "./plugins/blockFormat";
export * from "./plugins/clearFormatting";
export * from "./plugins/colors";
export * from "./plugins/fontSize";
export * from "./plugins/headings";
export * from "./plugins/image";
export * from "./plugins/linkDialog";
export * from "./plugins/optional";
export * from "./plugins/table";

// Types
export * from "./types";

// Content utilities
export * from "./utils/content";
export { contentToHTML, htmlToContent } from "./utils/content";

// Settings
export * from "./utils/settings";

// Other utilities
export { HistoryManager } from "./utils/history";
export type { HistoryEntry } from "./utils/history";
export { indentListItem, outdentListItem } from "./utils/listIndent";
export {
    restoreSerializedSelection,
    serializeSelection,
} from "./utils/selection";
export type { SelectionPoint, SelectionState } from "./utils/selection";
export * from "./utils/stateReflection";

// Sanitization
export { isImageSrcSafe, isUrlSafe, sanitizeHtml } from "./utils/sanitize";

// Markdown bridge
export {
    contentToMarkdown,
    htmlToMarkdown,
    isProbablyMarkdown,
    markdownToContent,
    markdownToHtml,
} from "./utils/markdown";

// DOM utilities
export { findClosestCheckboxList, isCheckboxList } from "./utils/dom";

// Checkbox utilities
export { ensureAllCheckboxes } from "./utils/checkbox";

// Default export
export { Editor as default } from "./components/Editor";
