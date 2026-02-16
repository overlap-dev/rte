import React from 'react';
import { Plugin, EditorAPI, ButtonProps } from '../types';
import { IconWrapper } from '../components/IconWrapper';

/**
 * Base plugin for inline formatting
 */
export function createInlinePlugin(
  name: string,
  command: string,
  icon: string,
  label: string
): Plugin {
  return {
    name,
    type: 'inline',
    command,
    renderButton: (props: ButtonProps) => (
      <button
        type="button"
        onClick={props.onClick}
        disabled={props.disabled}
        className={`rte-toolbar-button ${props.isActive ? 'rte-toolbar-button-active' : ''}`}
        title={label}
        aria-label={label}
      >
        <IconWrapper icon={icon} width={18} height={18} />
      </button>
    ),
    execute: (editor: EditorAPI) => {
      editor.executeCommand(command);
    },
    isActive: (editor: EditorAPI) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return false;
      const selection = editor.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container as HTMLElement;
      
      if (!element) return false;
      
      return document.queryCommandState(command);
    },
    canExecute: (editor: EditorAPI) => {
      // Formatting should also work without a selection
      // (e.g. when the editor is empty, a selection is created on click)
      return true;
    },
  };
}

/**
 * Base plugin for commands
 */
export function createCommandPlugin(
  name: string,
  command: string,
  icon: string,
  label: string
): Plugin {
  return {
    name,
    type: 'command',
    command,
    renderButton: (props: ButtonProps) => (
      <button
        type="button"
        onClick={props.onClick}
        disabled={props.disabled}
        className="rte-toolbar-button"
        title={label}
        aria-label={label}
      >
        <IconWrapper icon={icon} width={18} height={18} />
      </button>
    ),
    execute: (editor: EditorAPI) => {
      editor.executeCommand(command);
    },
    canExecute: (editor: EditorAPI) => {
      if (command === 'undo') return editor.canUndo();
      if (command === 'redo') return editor.canRedo();
      return true;
    },
  };
}

