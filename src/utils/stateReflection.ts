import { EditorAPI } from '../types';

/**
 * Returns the element from a node for style inspection (the node itself if it
 * is an element, otherwise its parent element).
 */
function elementOf(node: Node | null): HTMLElement | null {
  if (!node) return null;
  return node.nodeType === Node.TEXT_NODE
    ? node.parentElement
    : (node as HTMLElement);
}

/**
 * Collects the text nodes that the range actually covers.
 *
 * Triple-click selections extend to (or just past) the next block boundary,
 * so a plain `commonAncestorContainer` lookup resolves to the wrong block.
 * Walking the genuinely-intersected text nodes instead lets the toolbar read
 * the real inline styling. Text nodes that are only touched at a zero-length
 * boundary (the typical triple-click artifact at the start of the following
 * line) are skipped.
 */
export function getSelectedTextNodes(range: Range): Text[] {
  const out: Text[] = [];
  const root = range.commonAncestorContainer;
  const rootEl = root.nodeType === Node.TEXT_NODE ? root.parentElement : (root as HTMLElement);
  if (!rootEl) return out;

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
  let node: Node | null = walker.currentNode;
  // TreeWalker starts on the root element itself; advance to the first text node.
  if (node.nodeType !== Node.TEXT_NODE) node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    if (range.intersectsNode(textNode)) {
      // Skip boundary-only touches (zero-length overlap), the typical
      // triple-click artifact at the start of the following line.
      const overlapStart =
        textNode === range.startContainer ? range.startOffset : 0;
      const overlapEnd =
        textNode === range.endContainer ? range.endOffset : textNode.length;
      const hasContent = (textNode.textContent ?? '').trim().length > 0;
      if (overlapEnd > overlapStart && hasContent) {
        out.push(textNode);
      }
    }
    node = walker.nextNode();
  }
  return out;
}

/**
 * Reads the current font-size from the selection.
 * For a collapsed caret it walks up from the caret element; for a range it
 * inspects every selected text node and only returns a value if they all
 * share the same size (otherwise undefined → blank dropdown for mixed runs).
 */
export function getCurrentFontSize(editor: EditorAPI): string | undefined {
  const selection = editor.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;

  const range = selection.getRangeAt(0);

  const sizeOfElement = (element: HTMLElement | null): string | undefined => {
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      const fontSize = window.getComputedStyle(current).fontSize;
      const size = parseInt(fontSize, 10);
      if (!isNaN(size)) return size.toString();
      current = current.parentElement;
    }
    return undefined;
  };

  if (range.collapsed) {
    return sizeOfElement(elementOf(range.commonAncestorContainer));
  }

  const textNodes = getSelectedTextNodes(range);
  if (textNodes.length === 0) {
    return sizeOfElement(elementOf(range.commonAncestorContainer));
  }

  let result: string | undefined;
  for (const textNode of textNodes) {
    const size = sizeOfElement(textNode.parentElement);
    if (size === undefined) continue;
    if (result === undefined) {
      result = size;
    } else if (result !== size) {
      return undefined; // mixed sizes
    }
  }
  return result;
}

/** Converts a CSS color string (#hex or rgb/rgba) to #hex, or undefined. */
function toHex(color: string): string | undefined {
  if (color.startsWith('#')) return color;
  const rgb = color.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    return (
      '#' +
      rgb
        .slice(0, 3)
        .map((x) => {
          const h = parseInt(x, 10).toString(16);
          return h.length === 1 ? '0' + h : h;
        })
        .join('')
    );
  }
  return undefined;
}

/** Resolves the effective text color (hex) for an element, walking ancestors. */
function textColorOfElement(element: HTMLElement | null): string | undefined {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const inlineColor = current.style.color;
    if (inlineColor && inlineColor.trim()) {
      const hex = toHex(inlineColor);
      if (hex) return hex;
    }
    const color = window.getComputedStyle(current).color;
    if (
      color &&
      color !== 'inherit' &&
      color !== 'initial' &&
      color !== 'rgb(0, 0, 0)' &&
      color !== 'rgba(0, 0, 0, 0)'
    ) {
      const hex = toHex(color);
      if (hex) return hex;
    }
    current = current.parentElement;
  }
  return undefined;
}

/** Resolves the effective background color (hex) for an element. */
function backgroundColorOfElement(element: HTMLElement | null): string | undefined {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const inlineBgColor = current.style.backgroundColor;
    if (inlineBgColor && inlineBgColor.trim()) {
      const hex = toHex(inlineBgColor);
      if (hex) return hex;
    }
    const bgColor = window.getComputedStyle(current).backgroundColor;
    if (
      bgColor &&
      bgColor !== 'inherit' &&
      bgColor !== 'initial' &&
      bgColor !== 'rgba(0, 0, 0, 0)' &&
      bgColor !== 'transparent'
    ) {
      const hex = toHex(bgColor);
      if (hex) return hex;
    }
    current = current.parentElement;
  }
  return undefined;
}

/**
 * Resolves a per-element value over the selection: caret → single element,
 * range → uniform value across all selected text nodes (else undefined).
 */
function resolveOverSelection(
  editor: EditorAPI,
  resolve: (element: HTMLElement | null) => string | undefined,
): string | undefined {
  const selection = editor.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;

  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    return resolve(elementOf(range.commonAncestorContainer));
  }

  const textNodes = getSelectedTextNodes(range);
  if (textNodes.length === 0) {
    return resolve(elementOf(range.commonAncestorContainer));
  }

  let result: string | undefined;
  for (const textNode of textNodes) {
    const value = resolve(textNode.parentElement);
    if (value === undefined) continue;
    if (result === undefined) {
      result = value;
    } else if (result !== value) {
      return undefined; // mixed values
    }
  }
  return result;
}

/**
 * Reads the current text color from the selection (uniform across the range).
 */
export function getCurrentTextColor(editor: EditorAPI): string | undefined {
  return resolveOverSelection(editor, textColorOfElement);
}

/**
 * Reads the current background color from the selection (uniform across range).
 */
export function getCurrentBackgroundColor(editor: EditorAPI): string | undefined {
  return resolveOverSelection(editor, backgroundColorOfElement);
}

/**
 * Reads the current heading level from the DOM at the cursor position
 */
export function getCurrentHeading(editor: EditorAPI, availableHeadings: string[]): string | undefined {
  const selection = editor.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;

  const range = selection.getRangeAt(0);
  // Read from the start block of the selection, not commonAncestorContainer.
  // Triple-click extends the range past the block boundary, which would make
  // commonAncestorContainer resolve to the editor root instead of the block.
  const element = elementOf(range.startContainer);

  if (!element) return undefined;

  // Find the nearest block element
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const tagName = current.tagName.toLowerCase();
    if (availableHeadings.includes(tagName)) {
      return tagName;
    }
    if (tagName === 'p') {
      return 'p';
    }
    current = current.parentElement;
  }

  return undefined;
}

