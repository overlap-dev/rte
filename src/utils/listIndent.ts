/**
 * Erhöht den Einrückungs-Level eines List-Items (Tab)
 */
export function indentListItem(selection: Selection): boolean {
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const listItem = container.nodeType === Node.TEXT_NODE
    ? container.parentElement?.closest('li')
    : (container as HTMLElement).closest('li');

  if (!listItem) return false;

  const list = listItem.parentElement;
  if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return false;

  // Prüfe ob bereits verschachtelt (max depth check)
  let depth = 0;
  let current: HTMLElement | null = listItem;
  while (current) {
    const parent: HTMLElement | null = current.parentElement;
    if (parent && (parent.tagName === 'UL' || parent.tagName === 'OL')) {
      depth++;
      current = parent.closest('li');
    } else {
      break;
    }
  }

  // Max depth: 6 (wie in HTML Standard)
  if (depth >= 6) return false;

  // Finde vorheriges List-Item
  const previousItem = listItem.previousElementSibling as HTMLElement | null;
  
  if (previousItem && previousItem.tagName === 'LI') {
    // Erstelle verschachtelte Liste im vorherigen Item
    let nestedList = previousItem.querySelector('ul, ol');
    
    if (!nestedList) {
      // Erstelle neue verschachtelte Liste
      nestedList = document.createElement(list.tagName.toLowerCase() as 'ul' | 'ol');
      previousItem.appendChild(nestedList);
    }
    
    // Verschiebe aktuelles Item in verschachtelte Liste
    nestedList.appendChild(listItem);
    
    // Cursor setzen
    const textNode = listItem.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      range.setStart(textNode, 0);
      range.collapse(true);
    } else if (listItem.firstChild) {
      range.setStart(listItem.firstChild, 0);
      range.collapse(true);
    } else {
      const newText = document.createTextNode('');
      listItem.appendChild(newText);
      range.setStart(newText, 0);
      range.collapse(true);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    
    return true;
  } else {
    // Kein vorheriges Item - erstelle neue verschachtelte Liste im aktuellen Item
    const nestedList = document.createElement(list.tagName.toLowerCase() as 'ul' | 'ol');
    
    // Verschiebe alle nachfolgenden Items in die verschachtelte Liste
    let nextSibling = listItem.nextElementSibling;
    while (nextSibling && nextSibling.tagName === 'LI') {
      const toMove = nextSibling;
      nextSibling = nextSibling.nextElementSibling;
      nestedList.appendChild(toMove);
    }
    
    if (nestedList.children.length > 0) {
      listItem.appendChild(nestedList);
    } else {
      // Wenn keine nachfolgenden Items, erstelle leeres Sub-Item
      const subItem = document.createElement('li');
      nestedList.appendChild(subItem);
      listItem.appendChild(nestedList);
      
      // Cursor ins Sub-Item setzen
      const newText = document.createTextNode('');
      subItem.appendChild(newText);
      range.setStart(newText, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    return true;
  }
}

/**
 * Reduziert den Einrückungs-Level eines List-Items (Shift+Tab)
 */
export function outdentListItem(selection: Selection): boolean {
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const listItem = container.nodeType === Node.TEXT_NODE
    ? container.parentElement?.closest('li')
    : (container as HTMLElement).closest('li');

  if (!listItem) return false;

  const list = listItem.parentElement;
  if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return false;

  // Prüfe ob in verschachtelter Liste
  const parentListItem = list.parentElement;
  if (!parentListItem || parentListItem.tagName !== 'LI') {
    // Bereits auf oberstem Level
    return false;
  }

  const parentList = parentListItem.parentElement;
  if (!parentList || (parentList.tagName !== 'UL' && parentList.tagName !== 'OL')) {
    return false;
  }

  // Verschiebe Item auf oberes Level
  // Finde Position nach dem Parent-Item
  const insertAfter = parentListItem;
  
  // Verschiebe Item und alle nachfolgenden Items aus der verschachtelten Liste
  const itemsToMove: HTMLElement[] = [listItem];
  let nextSibling = listItem.nextElementSibling;
  while (nextSibling && nextSibling.tagName === 'LI') {
    itemsToMove.push(nextSibling as HTMLElement);
    nextSibling = nextSibling.nextElementSibling;
  }

  // Füge Items nach dem Parent-Item ein
  itemsToMove.forEach(item => {
    parentList.insertBefore(item, insertAfter.nextSibling);
  });

  // Entferne leere verschachtelte Liste
  if (list.children.length === 0) {
    list.remove();
  }

  // Cursor setzen
  const textNode = listItem.firstChild;
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    range.setStart(textNode, 0);
    range.collapse(true);
  } else if (listItem.firstChild) {
    range.setStart(listItem.firstChild, 0);
    range.collapse(true);
  } else {
    const newText = document.createTextNode('');
    listItem.appendChild(newText);
    range.setStart(newText, 0);
    range.collapse(true);
  }
  selection.removeAllRanges();
  selection.addRange(range);

  return true;
}

