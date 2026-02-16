import { EditorContent } from '../types';
import { SelectionState } from './selection';

export interface HistoryEntry {
  content: EditorContent;
  selection: SelectionState | null;
}

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  push(content: EditorContent, selection: SelectionState | null = null): void {
    // Remove all entries after currentIndex (when we went back)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new entry
    this.history.push({
      content: JSON.parse(JSON.stringify(content)),
      selection: selection ? JSON.parse(JSON.stringify(selection)) : null,
    });
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex = Math.max(0, this.currentIndex - 1);
    }
  }

  undo(): HistoryEntry | null {
    if (this.canUndo()) {
      this.currentIndex--;
      const entry = this.history[this.currentIndex];
      return {
        content: JSON.parse(JSON.stringify(entry.content)),
        selection: entry.selection ? JSON.parse(JSON.stringify(entry.selection)) : null,
      };
    }
    return null;
  }

  redo(): HistoryEntry | null {
    if (this.canRedo()) {
      this.currentIndex++;
      const entry = this.history[this.currentIndex];
      return {
        content: JSON.parse(JSON.stringify(entry.content)),
        selection: entry.selection ? JSON.parse(JSON.stringify(entry.selection)) : null,
      };
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrent(): HistoryEntry | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      const entry = this.history[this.currentIndex];
      return {
        content: JSON.parse(JSON.stringify(entry.content)),
        selection: entry.selection ? JSON.parse(JSON.stringify(entry.selection)) : null,
      };
    }
    return null;
  }

  reset(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}
