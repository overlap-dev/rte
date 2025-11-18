import { Plugin } from '../types';
import { createInlinePlugin, createCommandPlugin } from './base';
import { clearFormattingPlugin } from './clearFormatting';

/**
 * Standard-Plugins
 */
export const boldPlugin: Plugin = createInlinePlugin(
  'bold',
  'bold',
  'mdi:format-bold',
  'Fett'
);

export const italicPlugin: Plugin = createInlinePlugin(
  'italic',
  'italic',
  'mdi:format-italic',
  'Kursiv'
);

export const underlinePlugin: Plugin = createInlinePlugin(
  'underline',
  'underline',
  'mdi:format-underline',
  'Unterstrichen'
);

export const undoPlugin: Plugin = createCommandPlugin(
  'undo',
  'undo',
  'mdi:undo',
  'Rückgängig'
);

export const redoPlugin: Plugin = createCommandPlugin(
  'redo',
  'redo',
  'mdi:redo',
  'Wiederholen'
);

/**
 * Standard-Plugin-Liste
 */
export const defaultPlugins: Plugin[] = [
  undoPlugin,
  redoPlugin,
  boldPlugin,
  italicPlugin,
  underlinePlugin,
  clearFormattingPlugin,
];

