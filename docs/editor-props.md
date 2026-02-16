# Editor Props

All available props for the `<Editor>` component.

## Content & Change

| Prop | Type | Default | Description |
|---|---|---|---|
| `initialContent` | `EditorContent` | — | Initial editor content (JSON data model) |
| `onChange` | `(content: EditorContent) => void` | — | Called on every content change |

## Plugin Configuration

| Prop | Type | Default | Description |
|---|---|---|---|
| `plugins` | `Plugin[]` | `defaultPlugins` | Manual plugin array (overrides settings) |
| `settings` | `EditorSettings` | — | Settings object to auto-build plugins (see [Settings](./settings.md)) |
| `settingsOptions` | `BuildPluginsOptions` | — | Extra options when using settings (e.g. `onImageUpload`, `linkCustomFields`) |

## Appearance

| Prop | Type | Default | Description |
|---|---|---|---|
| `placeholder` | `string` | `"Enter text..."` | Placeholder text shown when editor is empty |
| `className` | `string` | — | CSS class for the outer container |
| `toolbarClassName` | `string` | — | CSS class for the toolbar |
| `editorClassName` | `string` | — | CSS class for the editor content area |
| `theme` | `object` | — | Theme overrides (see [Theming](./theming.md)) |

### Theme Object

```typescript
theme?: {
    borderColor?: string;
    borderRadius?: number;
    toolbarBg?: string;
    buttonHoverBg?: string;
    contentBg?: string;
    primaryColor?: string;
}
```

## Feature Configuration (with default plugins)

| Prop | Type | Default | Description |
|---|---|---|---|
| `headings` | `string[]` | — | Heading levels, e.g. `["h1", "h2", "h3"]` |
| `fontSizes` | `number[]` | — | Font size presets, e.g. `[12, 14, 16, 18, 20, 24]` |
| `colors` | `string[]` | — | Color palette for text/background color pickers |

## Images

| Prop | Type | Default | Description |
|---|---|---|---|
| `onImageUpload` | `(file: File) => Promise<string>` | — | Callback to upload an image file. Must return the URL |

## Read-Only Mode

| Prop | Type | Default | Description |
|---|---|---|---|
| `readOnly` | `boolean` | `false` | When `true`, hides toolbars and disables editing |

```tsx
// Display saved content without editing capabilities
<Editor initialContent={savedContent} readOnly />
```

When `readOnly` is `true`:
- Toolbar and floating toolbar are hidden
- `contentEditable` is set to `false`
- Paste, drag/drop handlers are disabled
- CSS classes `rte-container-readonly` and `rte-editor-readonly` are added

## Focus & Blur

| Prop | Type | Default | Description |
|---|---|---|---|
| `onFocus` | `() => void` | — | Called when the editor receives focus |
| `onBlur` | `() => void` | — | Called when the editor loses focus |

```tsx
const [isFocused, setIsFocused] = useState(false);

<Editor
    onFocus={() => setIsFocused(true)}
    onBlur={() => setIsFocused(false)}
/>
```

## Content Limits

| Prop | Type | Default | Description |
|---|---|---|---|
| `maxLength` | `number` | — | Maximum character count. Prevents input beyond this limit |
| `showWordCount` | `boolean` | `false` | Shows a word/character count bar below the editor |

```tsx
// Editor limited to 500 characters with live count
<Editor maxLength={500} showWordCount />
```

## Callbacks

| Prop | Type | Default | Description |
|---|---|---|---|
| `onEditorAPIReady` | `(api: EditorAPI) => void` | — | Called once when the editor API is available |

```tsx
const apiRef = useRef<EditorAPI>(null);

<Editor
    onEditorAPIReady={(api) => {
        apiRef.current = api;
    }}
/>
```

## Advanced

| Prop | Type | Default | Description |
|---|---|---|---|
| `customLinkComponent` | `React.ComponentType` | — | Custom React component for rendering links |
| `customHeadingRenderer` | `(level, children) => ReactNode` | — | Custom heading renderer |
| `customRenderer` | `CustomRenderer` | — | Custom node/mark renderer for the JSON-to-DOM conversion |
