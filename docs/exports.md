# Exports

Complete list of everything exported from `@overlap/rte`.

## Components

```typescript
export { Editor } from "./components/Editor";
export { Toolbar } from "./components/Toolbar";
export { FloatingToolbar } from "./components/FloatingToolbar";
export { Dropdown } from "./components/Dropdown";
```

## Individual Plugins

```typescript
// Inline formatting
export { boldPlugin } from "./plugins";
export { italicPlugin } from "./plugins";
export { underlinePlugin } from "./plugins";
export { strikethroughPlugin } from "./plugins";
export { subscriptPlugin } from "./plugins";
export { superscriptPlugin } from "./plugins";
export { codeInlinePlugin } from "./plugins";

// Commands
export { undoPlugin } from "./plugins";
export { redoPlugin } from "./plugins";
export { horizontalRulePlugin } from "./plugins";
export { clearFormattingPlugin } from "./plugins/clearFormatting";
export { indentListItemPlugin } from "./plugins";
export { outdentListItemPlugin } from "./plugins";

// Pre-configured
export { linkPlugin } from "./plugins/optional";
export { blockquotePlugin } from "./plugins/optional";
export { unorderedListPlugin } from "./plugins/optional";
export { orderedListPlugin } from "./plugins/optional";
export { tablePlugin } from "./plugins/table";
export { advancedLinkPlugin } from "./plugins/linkDialog";
export { alignmentPlugin } from "./plugins/alignment";

// Default plugin array
export { defaultPlugins } from "./plugins";
```

## Plugin Factories

```typescript
export { createBlockFormatPlugin } from "./plugins/blockFormat";
export { createTextColorPlugin, createBackgroundColorPlugin } from "./plugins/colors";
export { createFontSizePlugin } from "./plugins/fontSize";
export { createAlignmentPlugin } from "./plugins/alignment";
export { createAdvancedLinkPlugin } from "./plugins/linkDialog";
export { createImagePlugin } from "./plugins/image";
```

## Settings

```typescript
export { EditorSettings, defaultEditorSettings, buildPluginsFromSettings, BuildPluginsOptions } from "./utils/settings";
```

## Types

```typescript
export { Plugin, EditorAPI, EditorContent, EditorNode, EditorProps, ButtonProps, CustomRenderer } from "./types";
export type { LinkCustomField } from "./plugins/linkDialog";
export type { BlockFormatOptions } from "./plugins/blockFormat";
export type { HistoryEntry } from "./utils/history";
export type { SelectionState, SelectionPoint } from "./utils/selection";
```

## Utilities

```typescript
// Content conversion
export { htmlToContent, contentToHTML, contentToDOM, domToContent, createEmptyContent } from "./utils/content";

// History
export { HistoryManager } from "./utils/history";

// Selection
export { serializeSelection, restoreSerializedSelection } from "./utils/selection";

// Sanitization
export { sanitizeHtml } from "./utils/sanitize";

// List operations
export { indentListItem, outdentListItem } from "./utils/listIndent";

// State reflection (detect current formatting)
export * from "./utils/stateReflection";

// DOM utilities
export { isCheckboxList, findClosestCheckboxList } from "./utils/dom";

// Checkbox utilities
export { ensureAllCheckboxes } from "./utils/checkbox";
```

## Default Export

```typescript
export { Editor as default } from "./components/Editor";
```

This allows both:
```tsx
import Editor from "@overlap/rte";
import { Editor } from "@overlap/rte";
```
