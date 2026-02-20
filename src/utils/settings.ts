import { Plugin } from "../types";
import {
    boldPlugin,
    italicPlugin,
    underlinePlugin,
    strikethroughPlugin,
    subscriptPlugin,
    superscriptPlugin,
    codeInlinePlugin,
    undoPlugin,
    redoPlugin,
    indentListItemPlugin,
    outdentListItemPlugin,
    horizontalRulePlugin,
} from "../plugins";
import { createBlockFormatPlugin } from "../plugins/blockFormat";
import { clearFormattingPlugin } from "../plugins/clearFormatting";
import { createTextColorPlugin } from "../plugins/colors";
import { createFontSizePlugin } from "../plugins/fontSize";
import { createAlignmentPlugin } from "../plugins/alignment";
import { createAdvancedLinkPlugin, LinkCustomField } from "../plugins/linkDialog";
import { tablePlugin } from "../plugins/table";
import { createImagePlugin } from "../plugins/image";

/* ======================================================================
   EditorSettings — matches the Hendriks settings object 1:1
   ====================================================================== */

export interface EditorSettings {
    format?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
        code?: boolean;
        subscript?: boolean;
        superscript?: boolean;
        bulletList?: boolean;
        numberedList?: boolean;
        quote?: boolean;
        codeBlock?: boolean;
        horizontalRule?: boolean;
        check?: boolean;
        /** Heading levels to enable, e.g. ["h1", "h2", "h3"] */
        typography?: string[];
        /** Color palette for text color, e.g. ["#000", "#ff0000"] */
        colors?: string[];
        /** Enable font size dropdown */
        fontSize?: boolean;
        /** Alignment options, e.g. ["left", "center", "right", "justify", "indent", "outdent"] */
        alignment?: string[];
    };
    link?: {
        external?: boolean;
        internal?: boolean;
    };
    table?: {
        enabled?: boolean;
    };
    image?: {
        enabled?: boolean;
    };
}

/** Default: everything enabled. */
export const defaultEditorSettings: EditorSettings = {
    format: {
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
        code: true,
        subscript: true,
        superscript: true,
        bulletList: true,
        numberedList: true,
        quote: true,
        codeBlock: true,
        horizontalRule: true,
        check: true,
        typography: ["h1", "h2", "h3", "h4", "h5", "h6"],
        colors: [
            "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#ffffff",
            "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#9900ff", "#ff00ff",
        ],
        fontSize: true,
        alignment: ["left", "center", "right", "justify", "outdent", "indent"],
    },
    link: {
        external: true,
        internal: true,
    },
    table: {
        enabled: true,
    },
    image: {
        enabled: true,
    },
};

/* ======================================================================
   buildPluginsFromSettings — convert settings object to Plugin[]
   ====================================================================== */

export interface BuildPluginsOptions {
    /** Callback for image uploads (required when image.enabled is true). */
    onImageUpload?: (file: File) => Promise<string>;
    /** Custom fields for the advanced link dialog (e.g. urlExtra, pageRef). */
    linkCustomFields?: LinkCustomField[];
    /** Custom font sizes for the font size dropdown. */
    fontSizes?: number[];
}

/**
 * Builds a Plugin[] array from an EditorSettings object.
 *
 * Usage:
 * ```ts
 * const plugins = buildPluginsFromSettings(settings, {
 *   onImageUpload: handleUpload,
 *   linkCustomFields: [{ key: 'urlExtra', ... }],
 * });
 * ```
 */
export function buildPluginsFromSettings(
    settings: EditorSettings = defaultEditorSettings,
    options: BuildPluginsOptions = {}
): Plugin[] {
    const fmt = settings.format ?? {};
    const plugins: Plugin[] = [];

    // Always: Undo / Redo
    plugins.push(undoPlugin);
    plugins.push(redoPlugin);

    // Block format dropdown (headings, lists, quote, checkbox)
    const headings = fmt.typography ?? [];
    plugins.push(
        createBlockFormatPlugin(headings.length > 0 ? headings : undefined, {
            bulletList: fmt.bulletList,
            numberedList: fmt.numberedList,
            quote: fmt.quote,
            codeBlock: fmt.codeBlock,
            check: fmt.check,
        })
    );

    // Font size
    if (fmt.fontSize) {
        const sizes = options.fontSizes ?? [12, 14, 16, 18, 20, 24, 28, 32];
        plugins.push(createFontSizePlugin(sizes));
    }

    // Inline formatting
    if (fmt.bold !== false) plugins.push(boldPlugin);
    if (fmt.italic !== false) plugins.push(italicPlugin);
    if (fmt.underline !== false) plugins.push(underlinePlugin);
    if (fmt.strikethrough) plugins.push(strikethroughPlugin);

    // Link
    if (settings.link?.external || settings.link?.internal) {
        plugins.push(
            createAdvancedLinkPlugin({
                enableTarget: true,
                customFields: options.linkCustomFields,
            })
        );
    }

    // Colors
    if (fmt.colors && fmt.colors.length > 0) {
        plugins.push(createTextColorPlugin(fmt.colors));
    }

    // Extra inline formatting (code, subscript, superscript)
    if (fmt.code) plugins.push(codeInlinePlugin);
    if (fmt.subscript) plugins.push(subscriptPlugin);
    if (fmt.superscript) plugins.push(superscriptPlugin);

    // Horizontal rule
    if (fmt.horizontalRule) plugins.push(horizontalRulePlugin);

    // Table
    if (settings.table?.enabled) {
        plugins.push(tablePlugin);
    }

    // Alignment
    if (fmt.alignment && fmt.alignment.length > 0) {
        const supported = ["left", "center", "right", "justify"];
        const alignments = fmt.alignment.filter((a) => supported.includes(a));
        if (alignments.length > 0) {
            plugins.push(createAlignmentPlugin(alignments));
        }
    }

    // Image
    if (settings.image?.enabled && options.onImageUpload) {
        plugins.push(createImagePlugin(options.onImageUpload));
    }

    // Always: Clear formatting
    plugins.push(clearFormattingPlugin);

    // Indent / Outdent (controlled by alignment setting)
    const alignArr = fmt.alignment ?? [];
    if (alignArr.includes("indent")) plugins.push(indentListItemPlugin);
    if (alignArr.includes("outdent")) plugins.push(outdentListItemPlugin);

    return plugins;
}
