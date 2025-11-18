# Fresh Framework Integration

## Setup

Der Editor wurde für Fresh Framework integriert. Fresh verwendet Preact statt React, daher wurden folgende Anpassungen vorgenommen:

### 1. Dependencies (deno.json)

```json
{
    "imports": {
        "react": "npm:preact@^10.27.2/compat",
        "react-dom": "npm:preact@^10.27.2/compat",
        "@iconify-icon/preact": "npm:@iconify-icon/preact@^1.2.2"
    }
}
```

### 2. Vite Config (vite.config.ts)

Aliases wurden hinzugefügt, um React durch Preact zu ersetzen:

```ts
resolve: {
  alias: {
    "react": "preact/compat",
    "react-dom": "preact/compat",
    "react/jsx-runtime": "preact/jsx-runtime",
    "@iconify/react": "@iconify-icon/preact",
  },
}
```

### 3. CSS Import

Das CSS wird in `routes/_app.tsx` importiert:

```tsx
<link rel="stylesheet" href="/rte.css" />
```

## Verwendung

### Editor Island erstellen

```tsx
// islands/EditorIsland.tsx
import { useState, useRef } from "preact/hooks";
import { Editor } from "../../src/components/Editor.tsx";
import type { EditorContent, EditorAPI } from "../../src/types.ts";

export default function EditorIsland() {
    const [content, setContent] = useState<EditorContent | undefined>();
    const editorAPIRef = useRef<EditorAPI | null>(null);

    return (
        <Editor
            onChange={(newContent) => {
                setContent(newContent);
            }}
            onEditorAPIReady={(api) => {
                editorAPIRef.current = api;
            }}
            placeholder="Beginne zu tippen..."
            fontSizes={[12, 14, 16, 18, 20, 24]}
            colors={["#000000", "#ff0000", "#0000ff"]}
            headings={["h1", "h2", "h3"]}
        />
    );
}
```

### Route erstellen

```tsx
// routes/editor.tsx
import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import EditorIsland from "../islands/EditorIsland.tsx";

export default define.page(function EditorPage() {
    return (
        <div class="min-h-screen bg-gray-50">
            <Head>
                <title>HENDRIKS-RTE Editor</title>
            </Head>
            <EditorIsland />
        </div>
    );
});
```

## Starten

```bash
cd fresh-example
deno task dev
```

Dann öffne: http://localhost:8000/editor

## Wichtige Hinweise

1. **Islands**: Der Editor muss als Island verwendet werden, da er Client-seitige Interaktivität benötigt
2. **CSS**: Das CSS muss in `_app.tsx` oder als statische Datei importiert werden
3. **Preact Compat**: React wird automatisch durch Preact ersetzt via Vite Aliases
4. **Iconify**: `@iconify/react` wird durch `@iconify-icon/preact` ersetzt

## Troubleshooting

-   **Module not found**: Stelle sicher, dass alle Dependencies in `deno.json` definiert sind
-   **CSS nicht geladen**: Prüfe, ob `/rte.css` in `static/` vorhanden ist
-   **Icons fehlen**: Stelle sicher, dass `@iconify-icon/preact` installiert ist
