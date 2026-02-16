import {
    boldPlugin,
    ButtonProps,
    createBlockFormatPlugin,
    defaultPlugins,
    Editor,
    EditorAPI,
    EditorContent,
    horizontalRulePlugin,
    italicPlugin,
    linkPlugin,
    Plugin,
    redoPlugin,
    underlinePlugin,
    undoPlugin,
} from "hendriks-rte";
import { useRef, useState } from "react";

/* ==========================================================================
   Custom Plugins — demonstrate how easy it is to extend the editor
   ========================================================================== */

/** Highlight Plugin — wraps selected text in a yellow background */
const highlightPlugin: Plugin = {
    name: "highlight",
    type: "inline",
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            className={`rte-toolbar-button ${
                props.isActive ? "rte-toolbar-button-active" : ""
            }`}
            title="Highlight"
            aria-label="Highlight"
        >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.5 1.15c-.53-.53-1.39-.53-1.92 0L9.22 8.5a1.49 1.49 0 000 2.12l4.16 4.16c.59.59 1.54.59 2.12 0l7.35-7.35c.53-.53.53-1.39 0-1.92l-4.35-4.36zM2 22l5.04-1.21-3.83-3.83L2 22z" />
                <rect
                    x="1"
                    y="20"
                    width="22"
                    height="3"
                    rx="1"
                    opacity=".35"
                    fill="#fbbf24"
                />
            </svg>
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.executeCommand("hiliteColor", "pink");
    },
    isActive: () => {
        if (typeof document === "undefined") return false;
        return document.queryCommandState("hiliteColor");
    },
    canExecute: () => true,
};

/* ==========================================================================
   Demo Content
   ========================================================================== */

const demoContent: EditorContent = {
    blocks: [
        {
            type: "h1",
            children: [{ type: "text", text: "Welcome to @overlap/rte" }],
        },
        {
            type: "p",
            children: [
                { type: "text", text: "A " },
                {
                    type: "bold",
                    children: [{ type: "text", text: "lightweight" }],
                },
                { type: "text", text: ", " },
                {
                    type: "italic",
                    children: [{ type: "text", text: "extensible" }],
                },
                {
                    type: "text",
                    text: " Rich Text Editor for React — with just 1 dependency.",
                },
            ],
        },
        {
            type: "h2",
            children: [{ type: "text", text: "Formatting" }],
        },
        {
            type: "p",
            children: [
                { type: "text", text: "You can make text " },
                {
                    type: "bold",
                    children: [{ type: "text", text: "bold" }],
                },
                { type: "text", text: ", " },
                {
                    type: "italic",
                    children: [{ type: "text", text: "italic" }],
                },
                { type: "text", text: ", " },
                {
                    type: "underline",
                    children: [{ type: "text", text: "underlined" }],
                },
                { type: "text", text: ", or combine " },
                {
                    type: "bold",
                    children: [
                        {
                            type: "italic",
                            children: [
                                { type: "text", text: "multiple formats" },
                            ],
                        },
                    ],
                },
                { type: "text", text: ". Links work too: " },
                {
                    type: "link",
                    attributes: { href: "https://github.com/overlap-dev/rte" },
                    children: [{ type: "text", text: "GitHub Repo" }],
                },
            ],
        },
        {
            type: "blockquote",
            children: [
                {
                    type: "text",
                    text: "Simple things should be simple, complex things should be possible.",
                },
            ],
        },
        {
            type: "h2",
            children: [{ type: "text", text: "Lists" }],
        },
        {
            type: "ul",
            children: [
                {
                    type: "li",
                    children: [
                        {
                            type: "text",
                            text: "Unordered lists with bullet points",
                        },
                    ],
                },
                {
                    type: "li",
                    children: [
                        {
                            type: "text",
                            text: "Nested indentation via Tab key",
                        },
                    ],
                },
            ],
        },
        {
            type: "ul",
            attributes: { class: "rte-checkbox-list" },
            children: [
                {
                    type: "li",
                    attributes: { checkboxChecked: "true" },
                    children: [{ type: "text", text: "Checkbox lists" }],
                },
                {
                    type: "li",
                    attributes: { checkboxChecked: "true" },
                    children: [
                        { type: "text", text: "Lexical HTML compatible" },
                    ],
                },
                {
                    type: "li",
                    attributes: { checkboxChecked: "false" },
                    children: [
                        { type: "text", text: "Click the checkbox to toggle" },
                    ],
                },
            ],
        },
    ],
};

const lexicalSampleHtml = `<h2 class="PlaygroundEditorTheme__h2"><span style="white-space: pre-wrap;">Imported from Lexical</span></h2><p class="PlaygroundEditorTheme__paragraph"><span style="white-space: pre-wrap;">This HTML was generated by </span><b><strong style="white-space: pre-wrap;">Lexical</strong></b><span style="white-space: pre-wrap;"> and imported into @overlap/rte. All formatting, lists, and checkboxes are preserved.</span></p><ul __lexicallisttype="check" class="PlaygroundEditorTheme__ul PlaygroundEditorTheme__checklist"><li role="checkbox" tabindex="-1" aria-checked="true" value="1" class="PlaygroundEditorTheme__listItem PlaygroundEditorTheme__listItemChecked"><span style="white-space: pre-wrap;">Lexical checkbox (checked)</span></li><li role="checkbox" tabindex="-1" aria-checked="false" value="2" class="PlaygroundEditorTheme__listItem PlaygroundEditorTheme__listItemUnchecked"><span style="white-space: pre-wrap;">Lexical checkbox (unchecked)</span></li></ul><blockquote class="PlaygroundEditorTheme__quote"><span style="white-space: pre-wrap;">This blockquote was also generated by Lexical.</span></blockquote>`;

/* ==========================================================================
   Styles (CSS-in-JS — no extra dependencies)
   ========================================================================== */

const s = {
    page: {
        maxWidth: 1120,
        margin: "0 auto",
        padding: "0 24px 80px",
    } as React.CSSProperties,

    /* Hero */
    hero: {
        textAlign: "center" as const,
        padding: "64px 0 48px",
    } as React.CSSProperties,
    heroTitle: {
        fontSize: 48,
        fontWeight: 800,
        letterSpacing: "-0.025em",
        lineHeight: 1.1,
        color: "#111827",
    } as React.CSSProperties,
    heroSub: {
        fontSize: 20,
        color: "#6b7280",
        marginTop: 16,
        lineHeight: 1.5,
        maxWidth: 600,
        marginLeft: "auto",
        marginRight: "auto",
    } as React.CSSProperties,
    heroBadges: {
        display: "flex",
        gap: 12,
        justifyContent: "center",
        marginTop: 28,
        flexWrap: "wrap" as const,
    } as React.CSSProperties,
    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        background: "#f3f4f6",
        color: "#374151",
        border: "1px solid #e5e7eb",
    } as React.CSSProperties,
    badgeBlue: {
        background: "#e6f5f5",
        color: "#267273",
        border: "1px solid #80c9ca",
    } as React.CSSProperties,

    /* Sections */
    section: {
        marginTop: 56,
    } as React.CSSProperties,
    sectionTitle: {
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 8,
        color: "#111827",
    } as React.CSSProperties,
    sectionDesc: {
        fontSize: 16,
        color: "#6b7280",
        marginBottom: 24,
        lineHeight: 1.5,
    } as React.CSSProperties,

    /* Feature cards */
    featureGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
    } as React.CSSProperties,
    featureCard: {
        padding: "20px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        transition: "box-shadow .15s, border-color .15s",
    } as React.CSSProperties,
    featureIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        fontSize: 18,
        fontWeight: 700,
        color: "#339192",
        background: "#e6f5f5",
    } as React.CSSProperties,
    featureName: {
        fontSize: 15,
        fontWeight: 600,
        color: "#111827",
        marginBottom: 4,
    } as React.CSSProperties,
    featureDesc: {
        fontSize: 13,
        color: "#6b7280",
        lineHeight: 1.45,
    } as React.CSSProperties,

    /* Custom Plugin section */
    splitRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignItems: "start",
    } as React.CSSProperties,
    codeBlock: {
        background: "#1e293b",
        color: "#e2e8f0",
        borderRadius: 12,
        padding: "20px 24px",
        fontSize: 13,
        lineHeight: 1.6,
        overflow: "auto",
        whiteSpace: "pre" as const,
        border: "1px solid #334155",
    } as React.CSSProperties,

    /* Theming row */
    themeGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 20,
    } as React.CSSProperties,
    themeCard: {
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
    } as React.CSSProperties,
    themeLabel: {
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 600,
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
        color: "#374151",
    } as React.CSSProperties,
    darkThemeLabel: {
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 600,
        background: "#1e293b",
        borderBottom: "1px solid #334155",
        color: "#e2e8f0",
    } as React.CSSProperties,

    /* Output panels */
    tabRow: {
        display: "flex",
        gap: 0,
        borderBottom: "2px solid #e5e7eb",
        marginBottom: 0,
    } as React.CSSProperties,
    tab: {
        padding: "10px 20px",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        background: "none",
        border: "none",
        borderBottom: "2px solid transparent",
        marginBottom: -2,
        color: "#6b7280",
        transition: "color .15s, border-color .15s",
    } as React.CSSProperties,
    tabActive: {
        color: "#339192",
        borderBottomColor: "#339192",
        fontWeight: 600,
    } as React.CSSProperties,
    outputPre: {
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderTop: "none",
        borderRadius: "0 0 12px 12px",
        padding: 20,
        fontSize: 12,
        lineHeight: 1.6,
        overflow: "auto",
        maxHeight: 360,
        whiteSpace: "pre-wrap" as const,
        wordBreak: "break-word" as const,
        color: "#334155",
    } as React.CSSProperties,

    /* Comparison */
    compGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        marginTop: 24,
    } as React.CSSProperties,
    compCard: {
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
    } as React.CSSProperties,
    compHeader: {
        padding: "16px 20px",
        fontWeight: 700,
        fontSize: 18,
        borderBottom: "1px solid #e5e7eb",
    } as React.CSSProperties,
    compRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 20px",
        fontSize: 14,
        borderBottom: "1px solid #f3f4f6",
    } as React.CSSProperties,
    compLabel: { color: "#6b7280" } as React.CSSProperties,
    compValue: { fontWeight: 600, color: "#111827" } as React.CSSProperties,

    /* Buttons */
    btnPrimary: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        background: "#339192",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "background .15s",
    } as React.CSSProperties,
    btnOutline: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        background: "#fff",
        color: "#374151",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        transition: "background .15s",
    } as React.CSSProperties,

    /* Keyboard shortcut badge */
    kbd: {
        display: "inline-block",
        padding: "2px 7px",
        borderRadius: 5,
        border: "1px solid #d1d5db",
        background: "#f9fafb",
        fontFamily: "SF Mono, Menlo, Consolas, monospace",
        fontSize: 12,
        fontWeight: 500,
        color: "#374151",
        lineHeight: "20px",
        boxShadow: "0 1px 0 #d1d5db",
    } as React.CSSProperties,

    /* Shortcut grid */
    shortcutGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 10,
    } as React.CSSProperties,
    shortcutRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 14px",
        borderRadius: 8,
        background: "#f9fafb",
        border: "1px solid #f3f4f6",
    } as React.CSSProperties,
    shortcutLabel: {
        fontSize: 14,
        color: "#374151",
    } as React.CSSProperties,

    /* Info callout */
    callout: {
        padding: "14px 18px",
        borderRadius: 10,
        background: "#e6f5f5",
        border: "1px solid #80c9ca",
        color: "#267273",
        fontSize: 14,
        lineHeight: 1.5,
        marginBottom: 20,
    } as React.CSSProperties,

    /* Markdown shortcuts table */
    mdTable: {
        width: "100%",
        borderCollapse: "collapse" as const,
        fontSize: 14,
        marginBottom: 24,
    } as React.CSSProperties,
    mdTh: {
        textAlign: "left" as const,
        padding: "10px 16px",
        fontWeight: 600,
        color: "#374151",
        borderBottom: "2px solid #e5e7eb",
        background: "#f9fafb",
    } as React.CSSProperties,
    mdTd: {
        padding: "10px 16px",
        borderBottom: "1px solid #f3f4f6",
        color: "#4b5563",
    } as React.CSSProperties,
    mdCode: {
        padding: "2px 6px",
        borderRadius: 4,
        background: "#f3f4f6",
        fontFamily: "SF Mono, Menlo, Consolas, monospace",
        fontSize: 13,
    } as React.CSSProperties,

    /* Status indicator */
    statusDot: {
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        marginRight: 8,
    } as React.CSSProperties,
} as const;

/* ==========================================================================
   Features data
   ========================================================================== */

const features = [
    { icon: "B", name: "Rich Formatting", desc: "Bold, italic, underline, strikethrough, subscript, superscript" },
    { icon: "H", name: "Headings", desc: "H1-H6, configurable per instance" },
    { icon: "#", name: "Lists", desc: "Ordered, unordered, nested indentation" },
    { icon: "\u2611", name: "Checkbox Lists", desc: "Interactive, Lexical-compatible" },
    { icon: "\u201C", name: "Blockquote", desc: "Styled quote blocks" },
    { icon: "<>", name: "Code Block", desc: "Preformatted monospace code blocks" },
    { icon: "</>", name: "Inline Code", desc: "Inline monospace code spans" },
    { icon: "\u2014", name: "Horizontal Rule", desc: "Visual section dividers" },
    { icon: "\uD83D\uDD17", name: "Links", desc: "Create, edit, hover preview" },
    { icon: "A", name: "Font Size", desc: "Configurable size presets" },
    { icon: "\uD83C\uDFA8", name: "Colors", desc: "Presets + custom hex picker" },
    { icon: "\u21BA", name: "Undo / Redo", desc: "Full history with cursor restore" },
    { icon: "\uD83D\uDDBC", name: "Images", desc: "URL, upload, drag & drop, paste" },
    { icon: "\u21E5", name: "Indent / Outdent", desc: "Tab and Shift+Tab in lists" },
    { icon: "\u2328", name: "Keyboard Shortcuts", desc: "Cmd+B, Cmd+I, Cmd+E, and more" },
    { icon: "#\u2423", name: "Markdown Shortcuts", desc: "# heading, - list, > quote, ```" },
    { icon: "\uD83D\uDD12", name: "Read-Only Mode", desc: "Lock editor with readOnly prop" },
    { icon: "\uD83D\uDD17\u2197", name: "Auto-Linking", desc: "URLs auto-convert to links" },
    { icon: "123", name: "Word Count", desc: "Characters and word count display" },
    { icon: "\u26A0", name: "HTML Sanitization", desc: "XSS protection on paste/import" },
    { icon: "\u2699", name: "Settings Object", desc: "Toggle features via config object" },
    { icon: "</>", name: "HTML Import/Export", desc: "Round-trip HTML conversion" },
];

/* Keyboard shortcuts data */
const keyboardShortcuts = [
    { keys: ["Cmd", "B"], label: "Bold" },
    { keys: ["Cmd", "I"], label: "Italic" },
    { keys: ["Cmd", "U"], label: "Underline" },
    { keys: ["Cmd", "Shift", "X"], label: "Strikethrough" },
    { keys: ["Cmd", "E"], label: "Inline Code" },
    { keys: ["Cmd", "Shift", "7"], label: "Numbered List" },
    { keys: ["Cmd", "Shift", "8"], label: "Bullet List" },
    { keys: ["Cmd", "K"], label: "Insert Link" },
    { keys: ["Cmd", "Z"], label: "Undo" },
    { keys: ["Cmd", "Shift", "Z"], label: "Redo" },
    { keys: ["Cmd", "Shift", "V"], label: "Paste as Plain Text" },
    { keys: ["Tab"], label: "Indent (in list)" },
    { keys: ["Shift", "Tab"], label: "Outdent (in list)" },
];

/* Markdown shortcuts data */
const markdownShortcuts = [
    { trigger: "# + Space", result: "Heading 1" },
    { trigger: "## + Space", result: "Heading 2" },
    { trigger: "### + Space", result: "Heading 3" },
    { trigger: "- + Space", result: "Bullet List" },
    { trigger: "1. + Space", result: "Numbered List" },
    { trigger: "> + Space", result: "Blockquote" },
    { trigger: "[] + Space", result: "Checkbox List" },
    { trigger: "``` + Enter", result: "Code Block" },
    { trigger: "--- + Enter", result: "Horizontal Rule" },
];

/* ==========================================================================
   App Component
   ========================================================================== */

export default function App() {
    const [content, setContent] = useState<EditorContent | undefined>();
    const [outputTab, setOutputTab] = useState<"html" | "json">("html");
    const [htmlOutput, setHtmlOutput] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const editorAPIRef = useRef<EditorAPI | null>(null);
    const lexicalEditorAPIRef = useRef<EditorAPI | null>(null);

    /* Main editor plugins: defaults + link + highlight */
    const mainPlugins = [
        ...defaultPlugins,
        linkPlugin,
        highlightPlugin,
    ];

    /* Custom plugin demo plugins */
    const customDemoPlugins: Plugin[] = [
        undoPlugin,
        redoPlugin,
        createBlockFormatPlugin(["h1", "h2", "h3"]),
        boldPlugin,
        italicPlugin,
        underlinePlugin,
        horizontalRulePlugin,
        highlightPlugin,
    ];

    /* Minimal plugins for theming demo */
    const minimalPlugins: Plugin[] = [
        boldPlugin,
        italicPlugin,
        underlinePlugin,
    ];

    const handleImageUpload = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleLexicalImport = () => {
        if (lexicalEditorAPIRef.current) {
            lexicalEditorAPIRef.current.importHtml(lexicalSampleHtml);
        }
    };

    /* ── Render ────────────────────────────────────────────────────────── */

    return (
        <div style={s.page}>
            {/* ═══════════════════ HERO ═══════════════════ */}
            <header style={s.hero}>
                <h1 style={s.heroTitle}>@overlap/rte</h1>
                <p style={s.heroSub}>
                    A lightweight, extensible Rich Text Editor for React.
                    <br />
                    Zero lock-in. Full control. Lexical-compatible.
                </p>
                <div style={s.heroBadges}>
                    <span style={s.badge}>1 dependency</span>
                    <span style={s.badge}>~4k lines of code</span>
                    <span style={{ ...s.badge, ...s.badgeBlue }}>
                        Lexical HTML compatible
                    </span>
                    <span style={s.badge}>React 18+</span>
                    <span style={{ ...s.badge, ...s.badgeBlue }}>
                        14+ keyboard shortcuts
                    </span>
                </div>
            </header>

            {/* ═══════════════════ LIVE EDITOR ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Live Editor</h2>
                <p style={s.sectionDesc}>
                    Full-featured editor with all formatting options, word count,
                    link hover tooltips, auto-linking, and markdown shortcuts.
                    Try typing <code style={s.mdCode}># Hello</code> followed by
                    Space, or paste a URL and press Space.
                </p>
                <div style={{ marginBottom: 8, fontSize: 13, color: "#6b7280" }}>
                    <span
                        style={{
                            ...s.statusDot,
                            background: isFocused ? "#16a34a" : "#d1d5db",
                        }}
                    />
                    {isFocused ? "Editor focused" : "Editor not focused"}
                </div>
                <Editor
                    initialContent={demoContent}
                    onChange={(c) => {
                        setContent(c);
                        if (editorAPIRef.current) {
                            setHtmlOutput(editorAPIRef.current.exportHtml());
                        }
                    }}
                    onEditorAPIReady={(api) => {
                        editorAPIRef.current = api;
                        setHtmlOutput(api.exportHtml());
                    }}
                    plugins={mainPlugins}
                    placeholder="Start typing..."
                    fontSizes={[12, 14, 16, 18, 20, 24, 32]}
                    colors={[
                        "#000000",
                        "#374151",
                        "#dc2626",
                        "#ea580c",
                        "#ca8a04",
                        "#16a34a",
                        "#2563eb",
                        "#7c3aed",
                    ]}
                    headings={["h1", "h2", "h3"]}
                    onImageUpload={handleImageUpload}
                    showWordCount
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </section>

            {/* ═══════════════════ HTML / JSON OUTPUT ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Output</h2>
                <p style={s.sectionDesc}>
                    Live HTML export and JSON data model, updated as you type.
                </p>
                <div>
                    <div style={s.tabRow}>
                        <button
                            style={{
                                ...s.tab,
                                ...(outputTab === "html" ? s.tabActive : {}),
                            }}
                            onClick={() => setOutputTab("html")}
                        >
                            HTML Export
                        </button>
                        <button
                            style={{
                                ...s.tab,
                                ...(outputTab === "json" ? s.tabActive : {}),
                            }}
                            onClick={() => setOutputTab("json")}
                        >
                            JSON Model
                        </button>
                    </div>
                    <pre style={s.outputPre}>
                        {outputTab === "html"
                            ? htmlOutput ||
                              "(edit the editor above to see output)"
                            : JSON.stringify(content, null, 2) ||
                              "(edit the editor above to see output)"}
                    </pre>
                </div>
            </section>

            {/* ═══════════════════ FEATURE CARDS ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Features</h2>
                <p style={s.sectionDesc}>
                    Everything you need for rich text editing, out of the box.
                </p>
                <div style={s.featureGrid}>
                    {features.map((f) => (
                        <div
                            key={f.name}
                            style={s.featureCard}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow =
                                    "0 4px 12px rgba(0,0,0,.08)";
                                (e.currentTarget as HTMLDivElement).style.borderColor = "#d1d5db";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                                (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb";
                            }}
                        >
                            <div style={s.featureIcon}>{f.icon}</div>
                            <div style={s.featureName}>{f.name}</div>
                            <div style={s.featureDesc}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════ KEYBOARD SHORTCUTS ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Keyboard Shortcuts</h2>
                <p style={s.sectionDesc}>
                    All standard formatting shortcuts work out of the box, with
                    proper undo/redo history integration.
                </p>
                <div style={s.shortcutGrid}>
                    {keyboardShortcuts.map((sc) => (
                        <div key={sc.label} style={s.shortcutRow}>
                            <span style={s.shortcutLabel}>{sc.label}</span>
                            <div style={{ display: "flex", gap: 4 }}>
                                {sc.keys.map((k, i) => (
                                    <span key={i}>
                                        <kbd style={s.kbd}>{k}</kbd>
                                        {i < sc.keys.length - 1 && (
                                            <span style={{ margin: "0 2px", color: "#9ca3af" }}>+</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════ MARKDOWN SHORTCUTS ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Markdown Shortcuts</h2>
                <p style={s.sectionDesc}>
                    Type markdown-style triggers at the start of a line and they
                    auto-convert to the corresponding format.
                </p>
                <table style={s.mdTable}>
                    <thead>
                        <tr>
                            <th style={s.mdTh}>You type</th>
                            <th style={s.mdTh}>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {markdownShortcuts.map((ms) => (
                            <tr key={ms.trigger}>
                                <td style={s.mdTd}>
                                    <code style={s.mdCode}>{ms.trigger}</code>
                                </td>
                                <td style={s.mdTd}>{ms.result}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* ═══════════════════ READ-ONLY MODE ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Read-Only Mode</h2>
                <p style={s.sectionDesc}>
                    Set <code style={s.mdCode}>readOnly</code> to display
                    content without the toolbar, floating toolbar, or editing
                    capabilities.
                </p>
                <div style={s.splitRow}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                            Read-only output
                        </div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    { type: "h2", children: [{ type: "text", text: "Published Article" }] },
                                    {
                                        type: "p",
                                        children: [
                                            { type: "text", text: "This editor is in " },
                                            { type: "bold", children: [{ type: "text", text: "read-only" }] },
                                            { type: "text", text: " mode. No toolbar is shown, and the content cannot be edited. Perfect for displaying saved content." },
                                        ],
                                    },
                                    {
                                        type: "ul",
                                        attributes: { class: "rte-checkbox-list" },
                                        children: [
                                            { type: "li", attributes: { checkboxChecked: "true" }, children: [{ type: "text", text: "No toolbar shown" }] },
                                            { type: "li", attributes: { checkboxChecked: "true" }, children: [{ type: "text", text: "Content not editable" }] },
                                            { type: "li", attributes: { checkboxChecked: "true" }, children: [{ type: "text", text: "All formatting preserved" }] },
                                        ],
                                    },
                                ],
                            }}
                            readOnly
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                            Usage code
                        </div>
                        <pre style={s.codeBlock}>{`<Editor
  initialContent={content}
  readOnly
/>`}</pre>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ MAX LENGTH + WORD COUNT ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Max Length + Word Count</h2>
                <p style={s.sectionDesc}>
                    Limit input length with <code style={s.mdCode}>maxLength</code> and
                    show live statistics with <code style={s.mdCode}>showWordCount</code>.
                    Try typing in the editor below — it stops accepting input after 200 characters.
                </p>
                <Editor
                    initialContent={{
                        blocks: [
                            {
                                type: "p",
                                children: [
                                    {
                                        type: "text",
                                        text: "This editor has a 200 character limit. Try typing more to see it enforced.",
                                    },
                                ],
                            },
                        ],
                    }}
                    plugins={[boldPlugin, italicPlugin, underlinePlugin]}
                    maxLength={200}
                    showWordCount
                    placeholder="Type up to 200 characters..."
                />
            </section>

            {/* ═══════════════════ CUSTOM PLUGIN DEMO ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Custom Plugins</h2>
                <p style={s.sectionDesc}>
                    Extend the editor with your own plugins. No complex node
                    system — just a plain TypeScript object.
                </p>
                <div style={s.splitRow}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                            Editor with Highlight + HR plugins
                        </div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    {
                                        type: "p",
                                        children: [
                                            {
                                                type: "text",
                                                text: "Select text and click the highlight button. Use the HR button to insert a divider.",
                                            },
                                        ],
                                    },
                                ],
                            }}
                            plugins={customDemoPlugins}
                            placeholder="Try the custom plugins..."
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                            Plugin code
                        </div>
                        <pre style={s.codeBlock}>{`const highlightPlugin: Plugin = {
  name: "highlight",
  type: "inline",
  renderButton: (props) => (
    <button
      onClick={props.onClick}
      className="rte-toolbar-button"
      title="Highlight"
    >
      <HighlightIcon />
    </button>
  ),
  execute: (editor) => {
    editor.executeCommand(
      "hiliteColor", "#fef08a"
    );
  },
  isActive: () =>
    document.queryCommandState(
      "hiliteColor"
    ),
};`}</pre>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ THEMING ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Theming</h2>
                <p style={s.sectionDesc}>
                    Customize the look with CSS variables via the{" "}
                    <code style={s.mdCode}>theme</code> prop. No className mapping needed.
                </p>
                <div style={s.themeGrid}>
                    {/* Default theme */}
                    <div style={s.themeCard}>
                        <div style={s.themeLabel}>Default</div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    { type: "p", children: [{ type: "text", text: "The default theme with teal accent." }] },
                                ],
                            }}
                            plugins={minimalPlugins}
                            editorClassName="showcase-theme-editor"
                        />
                    </div>
                    {/* Dark theme */}
                    <div style={{ ...s.themeCard, background: "#0f172a", borderColor: "#334155", color: "#e2e8f0" }}>
                        <div style={s.darkThemeLabel}>Dark</div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    { type: "p", children: [{ type: "text", text: "Dark mode with slate tones." }] },
                                ],
                            }}
                            plugins={minimalPlugins}
                            theme={{
                                borderColor: "#334155",
                                toolbarBg: "#1e293b",
                                contentBg: "#0f172a",
                                primaryColor: "#60a5fa",
                                buttonHoverBg: "#334155",
                            }}
                            editorClassName="showcase-theme-editor"
                        />
                    </div>
                    {/* Brand theme */}
                    <div style={{ ...s.themeCard, borderColor: "#80c9ca" }}>
                        <div style={{ ...s.themeLabel, background: "#e6f5f5", borderColor: "#80c9ca" }}>
                            Brand (teal)
                        </div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    { type: "p", children: [{ type: "text", text: "Custom brand colors in two lines." }] },
                                ],
                            }}
                            plugins={minimalPlugins}
                            theme={{
                                primaryColor: "#339192",
                                borderColor: "#80c9ca",
                                toolbarBg: "#e6f5f5",
                                buttonHoverBg: "#ccebeb",
                            }}
                            editorClassName="showcase-theme-editor"
                        />
                    </div>
                </div>
            </section>

            {/* ═══════════════════ LEXICAL COMPATIBILITY ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Lexical Compatibility</h2>
                <p style={s.sectionDesc}>
                    Import HTML generated by Lexical — checkboxes, formatting,
                    theme classes, and{" "}
                    <code style={s.mdCode}>{'<span style="white-space: pre-wrap">'}</code>{" "}
                    wrappers are handled automatically.
                </p>
                <div style={{ marginBottom: 16 }}>
                    <button style={s.btnPrimary} onClick={handleLexicalImport}>
                        Import Lexical HTML
                    </button>
                </div>
                <Editor
                    onEditorAPIReady={(api) => {
                        lexicalEditorAPIRef.current = api;
                    }}
                    plugins={defaultPlugins}
                    placeholder="Click the button above to import Lexical HTML..."
                />
                <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#6b7280" }}>
                        View source Lexical HTML
                    </summary>
                    <pre style={{ ...s.outputPre, borderTop: "1px solid #e5e7eb", borderRadius: 12, marginTop: 8, fontSize: 11 }}>
                        {lexicalSampleHtml}
                    </pre>
                </details>
            </section>

            {/* ═══════════════════ NEW FEATURES HIGHLIGHTS ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>New Features</h2>
                <p style={s.sectionDesc}>
                    Recently added capabilities that make the editing experience smoother.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ ...s.featureCard, padding: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
                            Auto-Linking
                        </h3>
                        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>
                            Type a URL like <code style={s.mdCode}>https://example.com</code> and
                            press Space — it automatically becomes a clickable link.
                        </p>
                    </div>
                    <div style={{ ...s.featureCard, padding: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
                            Link Hover Tooltip
                        </h3>
                        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>
                            Hover over any link in the editor to see a tooltip with the URL,
                            plus buttons to open or copy the link.
                        </p>
                    </div>
                    <div style={{ ...s.featureCard, padding: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
                            Custom Color Picker
                        </h3>
                        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>
                            The color dropdown now includes a hex input and native color picker
                            at the bottom, allowing any custom color beyond the presets.
                        </p>
                    </div>
                    <div style={{ ...s.featureCard, padding: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
                            HTML Sanitization
                        </h3>
                        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>
                            Pasted HTML is automatically sanitized — dangerous tags like{" "}
                            <code style={s.mdCode}>&lt;script&gt;</code>,{" "}
                            <code style={s.mdCode}>&lt;iframe&gt;</code>, and event handler
                            attributes are stripped for XSS protection.
                        </p>
                    </div>
                    <div style={{ ...s.featureCard, padding: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
                            Plain-Text Paste
                        </h3>
                        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>
                            Use <kbd style={s.kbd}>Cmd</kbd> + <kbd style={s.kbd}>Shift</kbd> + <kbd style={s.kbd}>V</kbd> to
                            paste clipboard content as plain text, stripping all formatting.
                        </p>
                    </div>
                    <div style={{ ...s.featureCard, padding: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
                            Toolbar Keyboard Navigation
                        </h3>
                        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>
                            The toolbar follows the ARIA toolbar pattern with{" "}
                            <kbd style={s.kbd}>Arrow</kbd> key navigation between buttons
                            for improved accessibility.
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ COMPARISON ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Why @overlap/rte?</h2>
                <p style={s.sectionDesc}>A quick comparison with Lexical.</p>
                <div style={s.compGrid}>
                    <div style={s.compCard}>
                        <div style={{ ...s.compHeader, background: "#e6f5f5", color: "#267273" }}>
                            @overlap/rte
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Runtime dependencies</span>
                            <span style={{ ...s.compValue, color: "#16a34a" }}>1</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Keyboard shortcuts</span>
                            <span style={{ ...s.compValue, color: "#16a34a" }}>14+</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Markdown shortcuts</span>
                            <span style={{ ...s.compValue, color: "#16a34a" }}>9 patterns</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Plugin complexity</span>
                            <span style={s.compValue}>1 object</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Learning curve</span>
                            <span style={{ ...s.compValue, color: "#16a34a" }}>1 day</span>
                        </div>
                        <div style={{ ...s.compRow, borderBottom: "none" }}>
                            <span style={s.compLabel}>Vendor lock-in</span>
                            <span style={{ ...s.compValue, color: "#16a34a" }}>None</span>
                        </div>
                    </div>
                    <div style={s.compCard}>
                        <div style={{ ...s.compHeader, background: "#f9fafb", color: "#6b7280" }}>
                            Lexical
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Runtime dependencies</span>
                            <span style={{ ...s.compValue, color: "#dc2626" }}>20+</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Keyboard shortcuts</span>
                            <span style={s.compValue}>Custom setup required</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Markdown shortcuts</span>
                            <span style={s.compValue}>Plugin required</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Plugin complexity</span>
                            <span style={s.compValue}>Nodes + Commands + Transforms</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Learning curve</span>
                            <span style={{ ...s.compValue, color: "#dc2626" }}>1-2 weeks</span>
                        </div>
                        <div style={{ ...s.compRow, borderBottom: "none" }}>
                            <span style={s.compLabel}>Vendor lock-in</span>
                            <span style={{ ...s.compValue, color: "#dc2626" }}>Meta ecosystem</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ FOOTER ═══════════════════ */}
            <footer
                style={{
                    marginTop: 80,
                    paddingTop: 32,
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: 14,
                }}
            >
                <p>
                    @overlap/rte
                    {" / "}
                    Built by{" "}
                    <a
                        href="https://overlap.at"
                        style={{
                            color: "#6b7280",
                            textDecoration: "underline",
                        }}
                    >
                        overlap.at
                    </a>
                </p>
            </footer>
        </div>
    );
}
