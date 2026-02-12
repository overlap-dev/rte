import { EditorAPI } from '../types';

/**
 * Liest die aktuelle Font-Size aus dem DOM an der Cursor-Position
 */
export function getCurrentFontSize(editor: EditorAPI): string | undefined {
  const selection = editor.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container as HTMLElement;

  if (!element) return undefined;

  // Find the nearest element with fontSize
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const fontSize = window.getComputedStyle(current).fontSize;
    if (fontSize && fontSize !== 'inherit' && fontSize !== 'initial') {
      // Konvertiere "16px" zu "16"
      const size = parseInt(fontSize, 10);
      if (!isNaN(size)) {
        return size.toString();
      }
    }
    current = current.parentElement;
  }

  return undefined;
}

/**
 * Reads the current text color from the DOM at the cursor position
 */
export function getCurrentTextColor(editor: EditorAPI): string | undefined {
  const selection = editor.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container as HTMLElement;

  if (!element) return undefined;

  // Find the nearest element with color
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    // Check inline style first (has priority)
    const inlineColor = current.style.color;
    if (inlineColor && inlineColor.trim()) {
      // If already hex, return directly
      if (inlineColor.startsWith('#')) {
        return inlineColor;
      }
      // Wenn RGB/RGBA, konvertieren
      const rgbMatch = inlineColor.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        const hex = '#' + rgbMatch.slice(0, 3).map(x => {
          const hex = parseInt(x, 10).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        return hex;
      }
    }
    
    // Dann computed style
    const color = window.getComputedStyle(current).color;
    if (color && color !== 'inherit' && color !== 'initial' && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
      // Konvertiere RGB zu Hex
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const hex = '#' + rgb.slice(0, 3).map(x => {
          const hex = parseInt(x, 10).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        return hex;
      }
    }
    current = current.parentElement;
  }

  return undefined;
}

/**
 * Reads the current background color from the DOM at the cursor position
 */
export function getCurrentBackgroundColor(editor: EditorAPI): string | undefined {
  const selection = editor.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container as HTMLElement;

  if (!element) return undefined;

  // Find the nearest element with backgroundColor
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    // Check inline style first (has priority)
    const inlineBgColor = current.style.backgroundColor;
    if (inlineBgColor && inlineBgColor.trim()) {
      // If already hex, return directly
      if (inlineBgColor.startsWith('#')) {
        return inlineBgColor;
      }
      // Wenn RGB/RGBA, konvertieren
      const rgbMatch = inlineBgColor.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        const hex = '#' + rgbMatch.slice(0, 3).map(x => {
          const hex = parseInt(x, 10).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        return hex;
      }
    }
    
    // Dann computed style
    const bgColor = window.getComputedStyle(current).backgroundColor;
    if (bgColor && bgColor !== 'inherit' && bgColor !== 'initial' && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      // Konvertiere RGB zu Hex
      const rgb = bgColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const hex = '#' + rgb.slice(0, 3).map(x => {
          const hex = parseInt(x, 10).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        return hex;
      }
    }
    current = current.parentElement;
  }

  return undefined;
}

/**
 * Reads the current heading level from the DOM at the cursor position
 */
export function getCurrentHeading(editor: EditorAPI, availableHeadings: string[]): string | undefined {
  const selection = editor.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container as HTMLElement;

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

