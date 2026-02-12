/**
 * Removes all formatting from the current selection
 */
export function clearFormatting(selection: Selection): void {
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  
  // Wenn Selection leer ist, nichts zu tun
  if (range.collapsed) return;

  try {
    // Use document.execCommand for standard formatting
    document.execCommand('removeFormat', false);
    document.execCommand('unlink', false);
    
    // Remove all inline styles and formatting manually
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      null
    );
    
    const elements: HTMLElement[] = [];
    let node: Node | null = walker.currentNode as Node;
    
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (range.intersectsNode(el)) {
          const tagName = el.tagName.toLowerCase();
          
          // Remove inline formatting (strong, em, u, span, a, etc.)
          if (['strong', 'b', 'em', 'i', 'u', 'span', 'a', 'font'].includes(tagName)) {
            // Ersetze durch Text-Node
            const text = el.textContent || '';
            const textNode = document.createTextNode(text);
            el.parentNode?.replaceChild(textNode, el);
          }
          
          // Entferne alle Styles
          if (el.style.length > 0) {
            el.removeAttribute('style');
          }
          
          // Konvertiere Headings zu Paragraphs
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            const p = document.createElement('p');
            while (el.firstChild) {
              p.appendChild(el.firstChild);
            }
            el.parentNode?.replaceChild(p, el);
          }
        }
      }
      node = walker.nextNode();
    }
    
    // Normalize: remove empty formatting tags
    const normalizeWalker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      null
    );
    
    node = normalizeWalker.currentNode as Node;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        
        if (['strong', 'b', 'em', 'i', 'u', 'span'].includes(tagName) && !el.textContent?.trim()) {
          el.parentNode?.removeChild(el);
        }
      }
      node = normalizeWalker.nextNode();
    }
    
  } catch (error) {
    console.error('Error clearing formatting:', error);
    // Fallback: Einfache Methode
    document.execCommand('removeFormat', false);
    document.execCommand('unlink', false);
  }
}

/**
 * Removes only text color
 */
export function clearTextColor(selection: Selection): void {
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  
  // Finde alle Elemente mit color style
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    null
  );
  
  const elements: HTMLElement[] = [];
  let node: Node | null = walker.currentNode as Node;
  
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (range.intersectsNode(el) && el.style.color) {
        elements.push(el);
      }
    }
    node = walker.nextNode();
  }
  
  elements.forEach(el => {
    el.style.color = '';
    if (!el.style.length) {
      el.removeAttribute('style');
    }
  });
}

/**
 * Removes only background color
 */
export function clearBackgroundColor(selection: Selection): void {
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  
  // Finde alle Elemente mit backgroundColor style
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    null
  );
  
  const elements: HTMLElement[] = [];
  let node: Node | null = walker.currentNode as Node;
  
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (range.intersectsNode(el) && el.style.backgroundColor) {
        elements.push(el);
      }
    }
    node = walker.nextNode();
  }
  
  elements.forEach(el => {
    el.style.backgroundColor = '';
    if (!el.style.length) {
      el.removeAttribute('style');
    }
  });
}

/**
 * Entfernt nur Font-Size
 */
export function clearFontSize(selection: Selection): void {
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  
  // Finde alle Elemente mit fontSize style
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    null
  );
  
  const elements: HTMLElement[] = [];
  let node: Node | null = walker.currentNode as Node;
  
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (range.intersectsNode(el) && el.style.fontSize) {
        elements.push(el);
      }
    }
    node = walker.nextNode();
  }
  
  elements.forEach(el => {
    el.style.fontSize = '';
    if (!el.style.length) {
      el.removeAttribute('style');
    }
  });
}

/**
 * Removes links (keeps text)
 */
export function clearLinks(selection: Selection): void {
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  
  // Finde alle Links in der Selection
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName.toLowerCase() === 'a' && range.intersectsNode(el)) {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  const links: HTMLAnchorElement[] = [];
  let node: Node | null = walker.currentNode as Node;
  
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'a') {
      links.push(node as HTMLAnchorElement);
    }
    node = walker.nextNode();
  }
  
  // Remove links (keep text)
  links.forEach(link => {
    const parent = link.parentNode;
    if (parent) {
      while (link.firstChild) {
        parent.insertBefore(link.firstChild, link);
      }
      parent.removeChild(link);
    }
  });
}

