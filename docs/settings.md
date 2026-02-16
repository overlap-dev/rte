# Settings Object

Instead of assembling plugins manually, pass a settings object to control which features are enabled. This is the recommended approach for most use cases.

## Usage

```tsx
import { Editor, EditorSettings } from "@overlap/rte";

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

// Option A: Let the Editor build plugins automatically
<Editor settings={settings} onImageUpload={handleUpload} />

// Option B: Build plugins yourself for more control
import { buildPluginsFromSettings } from "@overlap/rte";

const plugins = buildPluginsFromSettings(settings, {
    onImageUpload: handleUpload,
    linkCustomFields: [...],
});
<Editor plugins={plugins} />
```

## EditorSettings Interface

```typescript
interface EditorSettings {
    format?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
        code?: boolean;           // inline <code>
        subscript?: boolean;
        superscript?: boolean;
        bulletList?: boolean;
        numberedList?: boolean;
        quote?: boolean;          // blockquote
        codeBlock?: boolean;      // <pre> block
        check?: boolean;          // checkbox lists
        typography?: string[];    // ["h1", "h2", "h3", ...]
        colors?: string[];        // ["#000", "#ff0000", ...]
        fontSize?: boolean;       // enable font size dropdown
        alignment?: string[];     // ["left", "center", "right", "justify", "indent", "outdent"]
    };
    link?: {
        external?: boolean;
        internal?: boolean;
    };
    table?: {
        enabled?: boolean;
    };
    image?: {
        enabled?: boolean;
    };
}
```

## Default Settings

By default, **everything is enabled** (`defaultEditorSettings`):

```typescript
import { defaultEditorSettings } from "@overlap/rte";
// All features enabled, all heading levels, 16 preset colors
```

## BuildPluginsOptions

When using `buildPluginsFromSettings`, you can pass extra options:

```typescript
interface BuildPluginsOptions {
    onImageUpload?: (file: File) => Promise<string>;
    linkCustomFields?: LinkCustomField[];
    fontSizes?: number[];  // default: [12, 14, 16, 18, 20, 24, 28, 32]
}
```

## Examples

### Minimal Editor (only bold + italic)

```tsx
<Editor settings={{ format: { bold: true, italic: true } }} />
```

### Blog Editor (formatting + images + links)

```tsx
const blogSettings: EditorSettings = {
    format: {
        bold: true,
        italic: true,
        underline: true,
        typography: ["h2", "h3"],
        bulletList: true,
        numberedList: true,
        quote: true,
    },
    link: { external: true },
    image: { enabled: true },
};

<Editor settings={blogSettings} onImageUpload={handleUpload} />
```

### Comment Editor (minimal, no blocks)

```tsx
const commentSettings: EditorSettings = {
    format: {
        bold: true,
        italic: true,
        code: true,
    },
    link: { external: true },
};

<Editor settings={commentSettings} maxLength={1000} showWordCount />
```
