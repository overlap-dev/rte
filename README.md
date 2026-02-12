# @overlap/rte

A lightweight, extensible Rich Text Editor for React.

## Installation

```bash
npm install @overlap/rte
```

## Features

-   ✅ **Lightweight**: Minimal dependencies (React only)
-   ✅ **Extensible**: Simple plugin system
-   ✅ **Contenteditable-based**: Uses native browser functionality
-   ✅ **Undo/Redo**: Full history support
-   ✅ **JSON data model**: Structured export/import
-   ✅ **TypeScript**: Fully typed
-   ✅ **Vite & Deno compatible**: ESM module support

## Basic Usage

```tsx
import React, { useState } from "react";
import { Editor, EditorContent } from "@overlap/rte";
import "@overlap/rte/dist/styles.css"; // CSS importieren

function App() {
    const [content, setContent] = useState<EditorContent | undefined>();

    return (
        <Editor
            initialContent={content}
            onChange={(newContent) => {
                setContent(newContent);
                console.log("Content:", newContent);
            }}
            placeholder="Text eingeben..."
        />
    );
}
```

**Note:** The CSS must be imported separately. Import it with `import '@overlap/rte/dist/styles.css'`.

## With Custom Plugins

```tsx
import React from "react";
import { Editor, Plugin, EditorAPI, ButtonProps } from "@overlap/rte";

// Create custom plugin
const customPlugin: Plugin = {
    name: "custom",
    type: "inline",
    command: "bold", // or custom logic
    renderButton: (props: ButtonProps) => (
        <button
            onClick={props.onClick}
            className={`toolbar-button ${props.isActive ? "active" : ""}`}
        >
            ⭐ {/* Or use SVG icons */}
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.executeCommand("bold");
    },
    isActive: (editor: EditorAPI) => {
        return document.queryCommandState("bold");
    },
};

function App() {
    return (
        <Editor
            plugins={[customPlugin]}
            onChange={(content) => console.log(content)}
        />
    );
}
```

## With Optional Plugins

```tsx
import React from "react";
import { Editor, defaultPlugins, linkPlugin } from "@overlap/rte";

function App() {
    const allPlugins = [...defaultPlugins, linkPlugin];

    return (
        <Editor
            plugins={allPlugins}
            onChange={(content) => console.log(content)}
        />
    );
}
```

**Note:** The `defaultPlugins` already include block formatting (headings, lists, blockquote) in a single dropdown. You can customize which headings are available using the `headings` prop:

```tsx
<Editor
    headings={["h1", "h2", "h3", "h4"]} // Customize available headings
    plugins={allPlugins}
    onChange={(content) => console.log(content)}
/>
```

## API

### Editor Props

| Prop               | Type                                | Description                                            |
| ------------------ | ----------------------------------- | ------------------------------------------------------ |
| `initialContent`   | `EditorContent?`                    | Initial editor content                                 |
| `onChange`         | `(content: EditorContent) => void?` | Callback on changes                                    |
| `plugins`          | `Plugin[]?`                         | Array of plugins (default: defaultPlugins)             |
| `headings`         | `string[]?`                         | Available heading levels (default: ["h1", "h2", "h3"]) |
| `placeholder`      | `string?`                           | Placeholder text                                       |
| `className`        | `string?`                           | CSS class for container                                |
| `toolbarClassName` | `string?`                           | CSS class for toolbar                                  |
| `editorClassName`  | `string?`                           | CSS class for editor                                   |
| `onImageUpload`    | `(file: File) => Promise<string>?`  | Callback for image uploads                             |

### EditorContent

```typescript
interface EditorContent {
    blocks: EditorNode[];
}

interface EditorNode {
    type: string;
    children?: EditorNode[];
    text?: string;
    attributes?: Record<string, string>;
}
```

### EditorAPI

The EditorAPI is passed to plugins and provides the following methods:

-   `executeCommand(command: string, value?: string): boolean` - Executes a command
-   `getSelection(): Selection | null` - Returns the current selection
-   `getContent(): EditorContent` - Returns the current content
-   `setContent(content: EditorContent): void` - Sets the content
-   `insertBlock(type: string, attributes?: Record<string, string>): void` - Inserts a block
-   `insertInline(type: string, attributes?: Record<string, string>): void` - Inserts an inline element
-   `undo(): void` - Undoes the last action
-   `redo(): void` - Redoes the last action
-   `canUndo(): boolean` - Checks if undo is possible
-   `canRedo(): boolean` - Checks if redo is possible
-   `indentListItem(): void` - Indents a list item (creates sub-list)
-   `outdentListItem(): void` - Outdents a list item

### Plugin Interface

```typescript
interface Plugin {
    name: string;
    type: "inline" | "block" | "command";
    command?: string;
    renderButton?: (props: ButtonProps) => React.ReactElement;
    execute?: (editor: EditorAPI) => void;
    isActive?: (editor: EditorAPI) => boolean;
    canExecute?: (editor: EditorAPI) => boolean;
}
```

## Default Plugins

The `defaultPlugins` include:

-   **Bold, Italic, Underline** - Text formatting
-   **Undo/Redo** - History management
-   **Block Format Dropdown** - Headings (h1-h3 by default), Lists (ul, ol), Blockquote
-   **Clear Formatting** - Remove all formatting
-   **Indent/Outdent** - List indentation (Tab/Shift+Tab)

## Optional Plugins

-   `linkPlugin` - Insert and edit links
-   `createFontSizePlugin` - Font size selector
-   `createColorPlugin` - Text color picker
-   `createBackgroundColorPlugin` - Background color picker
-   `createImagePlugin` - Image upload
-   `createHeadingsPlugin` - Custom heading levels (if not using default block format)

## Creating Plugins

### Example: Simple Inline Plugin

```typescript
import { Plugin, EditorAPI, ButtonProps } from "@overlap/rte";
import { createInlinePlugin } from "@overlap/rte";

const myPlugin = createInlinePlugin(
    "myPlugin",
    "bold", // Command
    "mdi:format-bold", // Icon name (rendered internally as SVG)
    "My Plugin" // Label
);
```

**Note:** Icons are rendered internally as SVG. You can also use your own SVG icons in your plugins.

### Example: Complex Plugin

```typescript
const customPlugin: Plugin = {
    name: "custom",
    type: "block",
    renderButton: (props: ButtonProps) => (
        <button onClick={props.onClick}>
            {/* Use SVG icons or emojis */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.insertBlock("div", { class: "custom-block" });
    },
    isActive: (editor: EditorAPI) => {
        // Check if plugin is active
        return false;
    },
    canExecute: (editor: EditorAPI) => {
        // Check if plugin can be executed
        return true;
    },
};
```

## Styling

The editor comes with minimal CSS. You can override the styles:

```css
.rte-container {
    /* Container styles */
}

.rte-toolbar {
    /* Toolbar styles */
}

.rte-toolbar-button {
    /* Button styles */
}

.rte-editor {
    /* Editor styles */
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development with watch
npm run dev
```

## Lizenz

MIT
