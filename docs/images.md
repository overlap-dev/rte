# Images

## Setup

Images require an upload callback that receives a `File` and returns a URL:

```tsx
async function handleUpload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const { url } = await res.json();
    return url;
}
```

### Via Settings

```tsx
<Editor
    settings={{ image: { enabled: true } }}
    onImageUpload={handleUpload}
/>
```

### Via Plugin

```tsx
import { createImagePlugin } from "@overlap/rte";

<Editor plugins={[...otherPlugins, createImagePlugin(handleUpload)]} />
```

## Insertion Methods

### Toolbar Button

Click the image button in the toolbar to open a modal with:
- **File Upload** -- drag/drop zone or file picker
- **URL Input** -- paste an image URL
- **Alt Text** -- optional alt text for accessibility
- **Preview** -- see the image before inserting

### Clipboard Paste

Paste an image directly from the clipboard (e.g. screenshot). The editor detects image data and calls `onImageUpload` automatically.

### Drag & Drop

Drag an image file from your file system onto the editor. The image is uploaded and inserted at the drop position.

## Attachment IDs

The upload callback can return a special format to attach metadata:

```tsx
async function handleUpload(file: File): Promise<string> {
    const { url, attachmentId } = await uploadToServer(file);
    // Return with attachment ID convention
    return `${url}|__aid__:${attachmentId}`;
}
```

The `|__aid__:` separator is parsed automatically. The resulting `<img>` gets:
- `src` set to the URL part
- `data-attachment-id` attribute set to the attachment ID

## Styling

Images use the `.rte-image` class:

```css
.rte-image {
    max-width: 370px;
    height: auto;
    display: block;
    margin: 8px auto;
    object-fit: contain;
    border-radius: 4px;
}
```

Override in your CSS to change the default size/alignment.

## Upload Placeholder

While uploading, a placeholder image is shown with reduced opacity. If the upload fails, the placeholder is removed automatically.
