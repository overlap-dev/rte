// Components
export { Dropdown } from "./components/Dropdown";
export { Editor } from "./components/Editor";
export { FloatingToolbar } from "./components/FloatingToolbar";
export { Toolbar } from "./components/Toolbar";

// Plugins
export * from "./plugins";
export * from "./plugins/blockFormat";
export * from "./plugins/clearFormatting";
export * from "./plugins/colors";
export * from "./plugins/fontSize";
export * from "./plugins/headings";
export * from "./plugins/image";
export * from "./plugins/optional";
export * from "./plugins/alignment";
export * from "./plugins/table";
export * from "./plugins/linkDialog";

// Types
export * from "./types";

// Content utilities
export * from "./utils/content";
export { contentToHTML, htmlToContent } from "./utils/content";

// Settings
export * from './utils/settings';

// Other utilities
export { HistoryManager } from "./utils/history";
export type { HistoryEntry } from "./utils/history";
export { serializeSelection, restoreSerializedSelection } from "./utils/selection";
export type { SelectionState, SelectionPoint } from "./utils/selection";
export { indentListItem, outdentListItem } from "./utils/listIndent";
export * from "./utils/stateReflection";

// Sanitization
export { sanitizeHtml, isUrlSafe } from "./utils/sanitize";

// DOM utilities
export { isCheckboxList, findClosestCheckboxList } from "./utils/dom";

// Checkbox utilities
export { ensureAllCheckboxes } from "./utils/checkbox";

// Default export
export { Editor as default } from "./components/Editor";
