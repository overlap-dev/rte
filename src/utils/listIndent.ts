/**
 * Increases the indent level of a list item (Tab)
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

  // Check if already nested (max depth check)
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

  // Max depth: 6 (as per HTML standard)
  if (depth >= 6) return false;

  // Find previous list item
  const previousItem = listItem.previousElementSibling as HTMLElement | null;
  
  if (previousItem && previousItem.tagName === 'LI') {
    // Create nested list in the previous item
    let nestedList = previousItem.querySelector('ul, ol');
    
    if (!nestedList) {
      // Create new nested list
      nestedList = document.createElement(list.tagName.toLowerCase() as 'ul' | 'ol');
      previousItem.appendChild(nestedList);
    }
    
    // Move current item into nested list
    nestedList.appendChild(listItem);
    
    // Set cursor position
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
    // No previous item — create new nested list in current item
    const nestedList = document.createElement(list.tagName.toLowerCase() as 'ul' | 'ol');
    
    // Move all following items into the nested list
    let nextSibling = listItem.nextElementSibling;
    while (nextSibling && nextSibling.tagName === 'LI') {
      const toMove = nextSibling;
      nextSibling = nextSibling.nextElementSibling;
      nestedList.appendChild(toMove);
    }
    
    if (nestedList.children.length > 0) {
      listItem.appendChild(nestedList);
    } else {
      // If no following items, create empty sub-item
      const subItem = document.createElement('li');
      nestedList.appendChild(subItem);
      listItem.appendChild(nestedList);
      
      // Set cursor in sub-item
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
 * Decreases the indent level of a list item (Shift+Tab)
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

  // Check if in nested list
  const parentListItem = list.parentElement;
  if (!parentListItem || parentListItem.tagName !== 'LI') {
    // Already at top level
    return false;
  }

  const parentList = parentListItem.parentElement;
  if (!parentList || (parentList.tagName !== 'UL' && parentList.tagName !== 'OL')) {
    return false;
  }

  // Move item to parent level
  // Find position after the parent item
  const insertAfter = parentListItem;
  
  // Move item and all following items out of the nested list
  const itemsToMove: HTMLElement[] = [listItem];
  let nextSibling = listItem.nextElementSibling;
  while (nextSibling && nextSibling.tagName === 'LI') {
    itemsToMove.push(nextSibling as HTMLElement);
    nextSibling = nextSibling.nextElementSibling;
  }

  // Insert items after the parent item
  itemsToMove.forEach(item => {
    parentList.insertBefore(item, insertAfter.nextSibling);
  });

  // Remove empty nested list
  if (list.children.length === 0) {
    list.remove();
  }

  // Set cursor position
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

