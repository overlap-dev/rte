import {
    boldPlugin,
    ButtonProps,
    createBlockFormatPlugin,
    defaultPlugins,
    Editor,
    EditorAPI,
    EditorContent,
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

/** Strikethrough Plugin — uses the strikeThrough command */
const strikethroughPlugin: Plugin = {
    name: "strikethrough",
    type: "inline",
    renderButton: (props: ButtonProps) => (
        <button
            type="button"
            onClick={props.onClick}
            className={`rte-toolbar-button ${
                props.isActive ? "rte-toolbar-button-active" : ""
            }`}
            title="Strikethrough"
            aria-label="Strikethrough"
        >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
            </svg>
        </button>
    ),
    execute: (editor: EditorAPI) => {
        editor.executeCommand("strikeThrough");
    },
    isActive: () => {
        if (typeof document === "undefined") return false;
        return document.queryCommandState("strikeThrough");
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
} as const;

/* ==========================================================================
   Features data
   ========================================================================== */

const features = [
    {
        icon: "B",
        name: "Rich Formatting",
        desc: "Bold, italic, underline, strikethrough",
    },
    { icon: "H", name: "Headings", desc: "H1-H6, configurable per instance" },
    {
        icon: "#",
        name: "Lists",
        desc: "Ordered, unordered, nested indentation",
    },
    {
        icon: "\u2611",
        name: "Checkbox Lists",
        desc: "Interactive, Lexical-compatible",
    },
    { icon: "\u201C", name: "Blockquote", desc: "Styled quote blocks" },
    {
        icon: "\uD83D\uDD17",
        name: "Links",
        desc: "Create and remove hyperlinks",
    },
    { icon: "A", name: "Font Size", desc: "Configurable size presets" },
    {
        icon: "\uD83C\uDFA8",
        name: "Colors",
        desc: "Text color and background color",
    },
    {
        icon: "\u21BA",
        name: "Undo / Redo",
        desc: "Full history with Cmd+Z support",
    },
    {
        icon: "\uD83D\uDDBC",
        name: "Images",
        desc: "URL or file upload with preview",
    },
    {
        icon: "</>",
        name: "HTML Import/Export",
        desc: "Round-trip HTML conversion",
    },
    {
        icon: "\u21E5",
        name: "Indent / Outdent",
        desc: "Tab and Shift+Tab in lists",
    },
];

/* ==========================================================================
   App Component
   ========================================================================== */

export default function App() {
    const [content, setContent] = useState<EditorContent | undefined>();
    const [outputTab, setOutputTab] = useState<"html" | "json">("html");
    const [htmlOutput, setHtmlOutput] = useState("");
    const editorAPIRef = useRef<EditorAPI | null>(null);
    const lexicalEditorAPIRef = useRef<EditorAPI | null>(null);

    /* Main editor plugins: all features */
    const mainPlugins = [
        ...defaultPlugins,
        linkPlugin,
        highlightPlugin,
        strikethroughPlugin,
    ];

    /* Custom plugin demo plugins */
    const customDemoPlugins: Plugin[] = [
        undoPlugin,
        redoPlugin,
        createBlockFormatPlugin(["h1", "h2", "h3"]),
        boldPlugin,
        italicPlugin,
        underlinePlugin,
        highlightPlugin,
        strikethroughPlugin,
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
                </div>
            </header>

            {/* ═══════════════════ LIVE EDITOR ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Live Editor</h2>
                <p style={s.sectionDesc}>
                    Full-featured editor with formatting, headings, lists,
                    checkboxes, links, images, colors, and more. Try it out.
                </p>
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
                                (
                                    e.currentTarget as HTMLDivElement
                                ).style.boxShadow =
                                    "0 4px 12px rgba(0,0,0,.08)";
                                (
                                    e.currentTarget as HTMLDivElement
                                ).style.borderColor = "#d1d5db";
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLDivElement
                                ).style.boxShadow = "none";
                                (
                                    e.currentTarget as HTMLDivElement
                                ).style.borderColor = "#e5e7eb";
                            }}
                        >
                            <div style={s.featureIcon}>{f.icon}</div>
                            <div style={s.featureName}>{f.name}</div>
                            <div style={s.featureDesc}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════ CUSTOM PLUGIN DEMO ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Custom Plugins</h2>
                <p style={s.sectionDesc}>
                    Extend the editor with your own plugins. No complex node
                    system -- just a plain TypeScript object.
                </p>
                <div style={s.splitRow}>
                    <div>
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                marginBottom: 12,
                                color: "#374151",
                            }}
                        >
                            Editor with Highlight + Strikethrough plugins
                        </div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    {
                                        type: "p",
                                        children: [
                                            {
                                                type: "text",
                                                text: "Select text and click the highlight or strikethrough button in the toolbar.",
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
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                marginBottom: 12,
                                color: "#374151",
                            }}
                        >
                            Plugin code
                        </div>
                        <pre
                            style={s.codeBlock}
                        >{`const highlightPlugin: Plugin = {
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
                    <code
                        style={{
                            background: "#f3f4f6",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 13,
                        }}
                    >
                        theme
                    </code>{" "}
                    prop. No className mapping needed.
                </p>
                <div style={s.themeGrid}>
                    {/* Default theme */}
                    <div style={s.themeCard}>
                        <div style={s.themeLabel}>Default</div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    {
                                        type: "p",
                                        children: [
                                            {
                                                type: "text",
                                                text: "The default theme with teal accent.",
                                            },
                                        ],
                                    },
                                ],
                            }}
                            plugins={minimalPlugins}
                            editorClassName="showcase-theme-editor"
                        />
                    </div>
                    {/* Dark theme */}
                    <div
                        style={{
                            ...s.themeCard,
                            background: "#0f172a",
                            borderColor: "#334155",
                            color: "#e2e8f0",
                        }}
                    >
                        <div style={s.darkThemeLabel}>Dark</div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    {
                                        type: "p",
                                        children: [
                                            {
                                                type: "text",
                                                text: "Dark mode with slate tones.",
                                            },
                                        ],
                                    },
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
                    <div
                        style={{
                            ...s.themeCard,
                            borderColor: "#80c9ca",
                        }}
                    >
                        <div
                            style={{
                                ...s.themeLabel,
                                background: "#e6f5f5",
                                borderColor: "#80c9ca",
                            }}
                        >
                            Brand (teal)
                        </div>
                        <Editor
                            initialContent={{
                                blocks: [
                                    {
                                        type: "p",
                                        children: [
                                            {
                                                type: "text",
                                                text: "Custom brand colors in two lines.",
                                            },
                                        ],
                                    },
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
                    Import HTML generated by Lexical -- checkboxes, formatting,
                    theme classes, and{" "}
                    <code
                        style={{
                            background: "#f3f4f6",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 13,
                        }}
                    >
                        {'<span style="white-space: pre-wrap">'}
                    </code>{" "}
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
                    <summary
                        style={{
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#6b7280",
                        }}
                    >
                        View source Lexical HTML
                    </summary>
                    <pre
                        style={{
                            ...s.outputPre,
                            borderTop: "1px solid #e5e7eb",
                            borderRadius: 12,
                            marginTop: 8,
                            fontSize: 11,
                        }}
                    >
                        {lexicalSampleHtml}
                    </pre>
                </details>
            </section>

            {/* ═══════════════════ COMPARISON ═══════════════════ */}
            <section style={s.section}>
                <h2 style={s.sectionTitle}>Why @overlap/rte?</h2>
                <p style={s.sectionDesc}>A quick comparison with Lexical.</p>
                <div style={s.compGrid}>
                    <div style={s.compCard}>
                        <div
                            style={{
                                ...s.compHeader,
                                background: "#e6f5f5",
                                color: "#267273",
                            }}
                        >
                            @overlap/rte
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>
                                Runtime dependencies
                            </span>
                            <span style={{ ...s.compValue, color: "#16a34a" }}>
                                1
                            </span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Source files</span>
                            <span style={s.compValue}>31</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Lines of code</span>
                            <span style={s.compValue}>~4,000</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Plugin complexity</span>
                            <span style={s.compValue}>1 object</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Learning curve</span>
                            <span style={{ ...s.compValue, color: "#16a34a" }}>
                                1 day
                            </span>
                        </div>
                        <div style={{ ...s.compRow, borderBottom: "none" }}>
                            <span style={s.compLabel}>Vendor lock-in</span>
                            <span style={{ ...s.compValue, color: "#16a34a" }}>
                                None
                            </span>
                        </div>
                    </div>
                    <div style={s.compCard}>
                        <div
                            style={{
                                ...s.compHeader,
                                background: "#f9fafb",
                                color: "#6b7280",
                            }}
                        >
                            Lexical
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>
                                Runtime dependencies
                            </span>
                            <span style={{ ...s.compValue, color: "#dc2626" }}>
                                20+
                            </span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Source files</span>
                            <span style={s.compValue}>500+</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Lines of code</span>
                            <span style={s.compValue}>~100,000+</span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Plugin complexity</span>
                            <span style={s.compValue}>
                                Nodes + Commands + Transforms
                            </span>
                        </div>
                        <div style={s.compRow}>
                            <span style={s.compLabel}>Learning curve</span>
                            <span style={{ ...s.compValue, color: "#dc2626" }}>
                                1-2 weeks
                            </span>
                        </div>
                        <div style={{ ...s.compRow, borderBottom: "none" }}>
                            <span style={s.compLabel}>Vendor lock-in</span>
                            <span style={{ ...s.compValue, color: "#dc2626" }}>
                                Meta ecosystem
                            </span>
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
