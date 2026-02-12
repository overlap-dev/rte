export interface EditorNode {
  type: string;
  children?: EditorNode[];
  text?: string;
  attributes?: Record<string, string>;
}

export interface EditorContent {
  blocks: EditorNode[];
}

export interface Plugin {
  name: string;
  type: 'inline' | 'block' | 'command';
  command?: string;
  renderButton?: (props: ButtonProps & { [key: string]: unknown }) => React.ReactElement;
  execute?: (editor: EditorAPI, value?: string) => void;
  isActive?: (editor: EditorAPI) => boolean;
  canExecute?: (editor: EditorAPI) => boolean;
  // State Reflection: Returns the current value (e.g. "22" for fontSize, "#ff0000" for color, "h1" for heading)
  getCurrentValue?: (editor: EditorAPI) => string | undefined;
}

export interface ButtonProps {
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: string;
  label?: string;
}

export interface EditorAPI {
  executeCommand: (command: string, value?: string) => boolean;
  getSelection: () => Selection | null;
  getContent: () => EditorContent;
  setContent: (content: EditorContent) => void;
  insertBlock: (type: string, attributes?: Record<string, string>) => void;
  insertInline: (type: string, attributes?: Record<string, string>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  // HTML Import & Export
  importHtml: (htmlString: string) => EditorContent;
  exportHtml: () => string;
  // Clear Formatting
  clearFormatting: () => void;
  clearTextColor: () => void;
  clearBackgroundColor: () => void;
  clearFontSize: () => void;
  clearLinks: () => void;
  // List Indent
  indentListItem: () => void;
  outdentListItem: () => void;
}

export interface CustomRenderer {
  renderNode?: (node: EditorNode, children: React.ReactNode) => React.ReactElement | null;
  renderMark?: (mark: string, attributes: Record<string, string>, children: React.ReactNode) => React.ReactElement | null;
}

export interface EditorProps {
  initialContent?: EditorContent;
  onChange?: (content: EditorContent) => void;
  plugins?: Plugin[];
  placeholder?: string;
  className?: string;
  toolbarClassName?: string;
  editorClassName?: string;
  // Link System
  customLinkComponent?: React.ComponentType<{ href: string; children: React.ReactNode; [key: string]: unknown }>;
  // Font Size System
  fontSizes?: number[];
  // Color System
  colors?: string[];
  // Headings System
  headings?: string[];
  customHeadingRenderer?: (level: string, children: React.ReactNode) => React.ReactElement;
  // Custom Renderer
  customRenderer?: CustomRenderer;
  // Editor API Callback
  onEditorAPIReady?: (api: EditorAPI) => void;
  // Theme Configuration
  theme?: {
    borderColor?: string;
    borderRadius?: number;
    toolbarBg?: string;
    buttonHoverBg?: string;
    contentBg?: string;
    primaryColor?: string;
  };
  // Image Upload
  onImageUpload?: (file: File) => Promise<string>;
  // Settings-based configuration (alternative to manual plugins)
  settings?: import('./utils/settings').EditorSettings;
  // Options for buildPluginsFromSettings when using settings prop
  settingsOptions?: import('./utils/settings').BuildPluginsOptions;
}

