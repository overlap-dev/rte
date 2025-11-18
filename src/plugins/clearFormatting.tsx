import React from 'react';
import { Plugin, EditorAPI, ButtonProps } from '../types';
import { IconWrapper } from '../components/IconWrapper';

/**
 * Clear Formatting Plugin - Entfernt alle Formatierungen
 */
export const clearFormattingPlugin: Plugin = {
    name: 'clearFormatting',
    type: 'command',
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            className="rte-toolbar-button"
            title="Formatierung entfernen"
            aria-label="Formatierung entfernen"
        >
            <IconWrapper icon="mdi:format-clear" width={18} height={18} />
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.clearFormatting();
    },
    canExecute: (editor: EditorAPI) => {
        const selection = editor.getSelection();
        return selection !== null && selection.rangeCount > 0 && !selection.isCollapsed;
    },
};

