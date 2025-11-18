# HENDRIKS-RTE

Ein leichtgewichtiger, erweiterbarer Rich Text Editor für React.

## Features

-   ✅ **Leichtgewichtig**: Minimale Abhängigkeiten (nur React und Iconify)
-   ✅ **Erweiterbar**: Einfaches Plugin-System
-   ✅ **Contenteditable-basiert**: Nutzt native Browser-Funktionalität
-   ✅ **Undo/Redo**: Vollständige Historie-Unterstützung
-   ✅ **JSON-Datenmodell**: Strukturierter Export/Import
-   ✅ **TypeScript**: Vollständig typisiert

## Installation

```bash
npm install hendriks-rte
```

## Grundlegende Verwendung

```tsx
import React, { useState } from "react";
import { Editor, EditorContent } from "hendriks-rte";
import "hendriks-rte/dist/styles.css"; // CSS importieren

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

**Hinweis:** Das CSS wird automatisch mit dem Editor importiert, wenn du den Editor verwendest. Falls du das CSS separat importieren möchtest, kannst du `import 'hendriks-rte/dist/styles.css'` verwenden.

## Mit eigenen Plugins

```tsx
import React from "react";
import { Editor, Plugin, EditorAPI, ButtonProps } from "hendriks-rte";
import { Icon } from "@iconify/react";

// Eigenes Plugin erstellen
const customPlugin: Plugin = {
    name: "custom",
    type: "inline",
    command: "bold", // oder eigene Logik
    renderButton: (props: ButtonProps) => (
        <button
            onClick={props.onClick}
            className={`toolbar-button ${props.isActive ? "active" : ""}`}
        >
            <Icon icon="mdi:star" />
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

## Mit optionalen Plugins

```tsx
import React from "react";
import {
    Editor,
    defaultPlugins,
    linkPlugin,
    blockquotePlugin,
    unorderedListPlugin,
    orderedListPlugin,
} from "hendriks-rte";

function App() {
    const allPlugins = [
        ...defaultPlugins,
        linkPlugin,
        blockquotePlugin,
        unorderedListPlugin,
        orderedListPlugin,
    ];

    return (
        <Editor
            plugins={allPlugins}
            onChange={(content) => console.log(content)}
        />
    );
}
```

## API

### Editor Props

| Prop               | Type                                | Beschreibung                                 |
| ------------------ | ----------------------------------- | -------------------------------------------- |
| `initialContent`   | `EditorContent?`                    | Initialer Editor-Inhalt                      |
| `onChange`         | `(content: EditorContent) => void?` | Callback bei Änderungen                      |
| `plugins`          | `Plugin[]?`                         | Array von Plugins (Standard: defaultPlugins) |
| `placeholder`      | `string?`                           | Platzhalter-Text                             |
| `className`        | `string?`                           | CSS-Klasse für Container                     |
| `toolbarClassName` | `string?`                           | CSS-Klasse für Toolbar                       |
| `editorClassName`  | `string?`                           | CSS-Klasse für Editor                        |

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

Die EditorAPI wird an Plugins übergeben und bietet folgende Methoden:

-   `executeCommand(command: string, value?: string): boolean` - Führt einen Command aus
-   `getSelection(): Selection | null` - Gibt die aktuelle Selection zurück
-   `getContent(): EditorContent` - Gibt den aktuellen Content zurück
-   `setContent(content: EditorContent): void` - Setzt den Content
-   `insertBlock(type: string, attributes?: Record<string, string>): void` - Fügt einen Block ein
-   `insertInline(type: string, attributes?: Record<string, string>): void` - Fügt ein Inline-Element ein
-   `undo(): void` - Macht die letzte Aktion rückgängig
-   `redo(): void` - Wiederholt die letzte Aktion
-   `canUndo(): boolean` - Prüft, ob Undo möglich ist
-   `canRedo(): boolean` - Prüft, ob Redo möglich ist

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

## Standard-Plugins

-   `boldPlugin` - Fett
-   `italicPlugin` - Kursiv
-   `underlinePlugin` - Unterstrichen
-   `undoPlugin` - Rückgängig
-   `redoPlugin` - Wiederholen

## Optionale Plugins

-   `linkPlugin` - Links einfügen
-   `blockquotePlugin` - Zitate
-   `unorderedListPlugin` - Aufzählungsliste
-   `orderedListPlugin` - Nummerierte Liste

## Plugin erstellen

### Beispiel: Einfaches Inline-Plugin

```typescript
import { Plugin, EditorAPI, ButtonProps } from "hendriks-rte";
import { Icon } from "@iconify/react";
import { createInlinePlugin } from "hendriks-rte/plugins/base";

const myPlugin = createInlinePlugin(
    "myPlugin",
    "bold", // Command
    "mdi:format-bold", // Icon
    "Mein Plugin" // Label
);
```

### Beispiel: Komplexes Plugin

```typescript
const customPlugin: Plugin = {
    name: "custom",
    type: "block",
    renderButton: (props: ButtonProps) => (
        <button onClick={props.onClick}>
            <Icon icon="mdi:star" />
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.insertBlock("div", { class: "custom-block" });
    },
    isActive: (editor: EditorAPI) => {
        // Prüfe, ob Plugin aktiv ist
        return false;
    },
    canExecute: (editor: EditorAPI) => {
        // Prüfe, ob Plugin ausgeführt werden kann
        return true;
    },
};
```

## Styling

Der Editor kommt mit minimalem CSS. Du kannst die Styles überschreiben:

```css
.rte-container {
    /* Container-Styles */
}

.rte-toolbar {
    /* Toolbar-Styles */
}

.rte-toolbar-button {
    /* Button-Styles */
}

.rte-editor {
    /* Editor-Styles */
}
```

## Entwicklung

```bash
# Dependencies installieren
npm install

# Build
npm run build

# Development mit Watch
npm run dev
```

## Lizenz

MIT
