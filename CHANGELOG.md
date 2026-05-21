# Changelog

## 0.3.0

### Bug fixes

- **B1** `FloatingToolbar` and `LinkTooltip` now reliably receive the editor DOM element. Previously they were initialized with `null` because the parent passed `editorRef.current` directly — and ref assignment does not trigger a re-render. The editor node is now mirrored into state via a callback ref. Floating toolbar / link tooltip work on the very first render without needing an external trigger.
- **B2** Image src validation is now centralized in a single `isImageSrcSafe()` helper in `utils/sanitize.ts`. The previous ad-hoc `startsWith("data:image/")` checks at four places (image upload, `createImageElement`, `contentToDOM`, image modal) all let `data:image/svg+xml` through; the sanitizer policy already blocked it but only on HTML paste. Now consistent across every entry point.
- **B3** `maxLength` enforcement now computes the projected text length from the actual `InputEvent` payload (typed text, paste data) and blocks when the limit would be exceeded. Paste, drop, and `executeCommand("insertImage")` all check `wouldExceedMaxLength()` before mutating the DOM. Previously the limit could be bypassed via paste, drop, plugin-driven inserts, or even by typing once the cap was reached but the projected length wasn't computed.
- **B4** `executeCommand` now snapshots before/after and only pushes a history entry when the document actually changed. No-op commands (e.g. clicking Bold with no selection) no longer pollute the undo stack with identical entries that made Undo seem broken.
- **B5** `handleAutoLink` and `handleMarkdownShortcut` accept an optional `pushHistory` callback that captures a pre-conversion snapshot. `useEditorEvents` wires this in so Undo correctly reverts auto-linked URLs and markdown-triggered formatting.
- **B6** Shift+Paste plain-text branch now explicitly calls `notifyChange` like the HTML and image branches.
- **B7** `useCheckbox.insertCheckboxList` no longer uses a 100ms `setTimeout` to wait for `execCommand("insertUnorderedList")` to commit; it uses two chained `requestAnimationFrame` calls instead.
- **B8** `clearFormatting` (and the sibling `clearTextColor` / `clearBackgroundColor` / `clearFontSize` / `clearLinks` helpers) now use a two-phase collect-then-mutate pattern. The previous code mutated nodes mid-walk, which silently caused the `TreeWalker` to skip siblings and leave behind unformatted-but-not-quite-clean elements.
- **B9** `outdentListItem` now moves only the active list item out of its nested list. Following siblings stay nested (rehoused under the outdented item if needed). Previously every later sibling was bulk-outdented as well, which surprised users coming from Word / Google Docs.
- **B11** Editor drop handler now calls `preventDefault()` for any file drop, not just images. Dropping a non-image file (PDF, plain text) no longer navigates the browser away from the page.
- **B12** Removed the empty `createImagePlugin.execute` and replaced it with a comment explaining why the image flow lives entirely in `renderButton`.
- **B13** Toolbar now uses a single `selectionchange` listener with a `requestAnimationFrame`-debounced re-render. The previous listener trio (`selectionchange` + `mouseup` + `keyup`, each with a 10ms `setTimeout`) caused 2-3 re-renders of the entire toolbar per click.

### Breaking changes

- **B10** `buildPluginsFromSettings` now treats every `format.*` boolean as opt-out (default `true`, only `false` disables). Previously `bold`, `italic`, `underline` were opt-out but `strikethrough`, `code`, `subscript`, `superscript`, `horizontalRule`, `fontSize` were opt-in. The new behavior is consistent and matches `defaultEditorSettings` (which sets everything to `true` explicitly, so users of the default object see no change). If you pass a partial settings object and relied on undefined-meaning-disabled for the previously opt-in flags, you now need to set them to `false` explicitly.

### New exports

- `isImageSrcSafe` from `@overlap/rte` — same policy as the internal sanitizer; reuse in custom plugins or upload pipelines that bypass the editor's own checks.
