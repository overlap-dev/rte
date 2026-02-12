import { EditorContent } from '../types';

export class HistoryManager {
  private history: EditorContent[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  push(content: EditorContent): void {
    // Remove all entries after currentIndex (when we went back)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new entry
    this.history.push(JSON.parse(JSON.stringify(content))); // Deep clone
    this.currentIndex++;
    
    // Begrenze die Historie
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): EditorContent | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  redo(): EditorContent | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrent(): EditorContent | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  reset(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

