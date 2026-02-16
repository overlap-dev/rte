# Getting Started

## Installation

```bash
npm install @overlap/rte
```

## CSS Import

Always import the styles file:

```tsx
import "@overlap/rte/dist/styles.css";
```

## Quick Start

```tsx
import { Editor, EditorContent } from "@overlap/rte";
import "@overlap/rte/dist/styles.css";
import { useState } from "react";

function App() {
    const [content, setContent] = useState<EditorContent>();

    return (
        <Editor
            initialContent={content}
            onChange={setContent}
            placeholder="Enter text..."
        />
    );
}
```

This gives you a full editor with the default plugins: undo/redo, headings, bold, italic, underline, strikethrough, inline code, subscript, superscript, horizontal rule, clear formatting, indent/outdent.

## With All Features

```tsx
import { Editor, EditorSettings } from "@overlap/rte";
import "@overlap/rte/dist/styles.css";

const settings: EditorSettings = {
    format: {
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
        code: true,
        subscript: true,
        superscript: true,
        bulletList: true,
        numberedList: true,
        quote: true,
        codeBlock: true,
        check: true,
        typography: ["h1", "h2", "h3"],
        colors: ["#000000", "#ff0000", "#00aa00", "#0000ff"],
        fontSize: true,
        alignment: ["left", "center", "right", "justify", "indent", "outdent"],
    },
    link: { external: true, internal: true },
    table: { enabled: true },
    image: { enabled: true },
};

function App() {
    return (
        <Editor
            settings={settings}
            onImageUpload={async (file) => {
                // Upload file and return URL
                return URL.createObjectURL(file);
            }}
            showWordCount
            placeholder="Start writing..."
        />
    );
}
```

## Peer Dependencies

- **React** 18+ (only peer dependency)
- No other runtime dependencies
