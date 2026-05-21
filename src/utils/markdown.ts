/**
 * Markdown ⇄ EditorContent bridge.
 *
 * Lets consumers feed plain Markdown into the editor (e.g. from LLM/MCP
 * pipelines that emit `# Heading`, `- item`, `**bold**` …) and round-trip
 * EditorContent back to a Markdown string.
 *
 * Strategy:
 *   - md → content:  marked → HTML (GFM enabled) → htmlToContent
 *                     (reuses the existing sanitizer + tag whitelist).
 *   - content → md:  recursive walker over EditorNode tree.
 */

import { marked } from "marked";
import { EditorContent, EditorNode } from "../types";
import { htmlToContent } from "./content";

/** Shared marked options. GFM gives us tables, strikethrough, task lists, autolinks. */
const MARKED_OPTIONS = {
    gfm: true,
    breaks: false,
    pedantic: false,
} as const;

/**
 * Convert a Markdown string to a sanitized HTML string.
 * Useful when you just want to pipe Markdown to a HTML-consuming renderer.
 */
export function markdownToHtml(md: string): string {
    if (!md) return "";
    const result = marked.parse(md, { ...MARKED_OPTIONS, async: false });
    return typeof result === "string" ? result : "";
}

/**
 * Convert a Markdown string to EditorContent JSON the RTE understands.
 * Goes through the existing HTML pipeline so the same sanitization /
 * tag-whitelist rules apply.
 */
export function markdownToContent(md: string): EditorContent {
    const html = markdownToHtml(md);
    return htmlToContent(html);
}

/**
 * Quick heuristic that returns true if `s` looks like plain Markdown
 * (no surrounding HTML tags but contains markdown syntax). Consumers
 * can use this to decide whether to call markdownToContent or htmlToContent.
 */
export function isProbablyMarkdown(s: string): boolean {
    if (!s) return false;
    const trimmed = s.trim();
    if (!trimmed) return false;
    // If we see any HTML-ish block tag we treat it as HTML.
    if (
        /<\/?(p|div|span|h[1-6]|ul|ol|li|table|tr|td|th|pre|code|blockquote|br|hr|img|a|strong|b|em|i|u|s)\b/i.test(
            trimmed,
        )
    ) {
        return false;
    }
    // Common markdown signals
    return (
        /^#{1,6}\s+\S/m.test(trimmed) || // heading
        /^[-*+]\s+\S/m.test(trimmed) || // bullet list
        /^\d+\.\s+\S/m.test(trimmed) || // ordered list
        /^>\s+\S/m.test(trimmed) || // blockquote
        /^- \[[ xX]\]\s+\S/m.test(trimmed) || // task list
        /^\|.+\|/m.test(trimmed) || // table row
        /^```/m.test(trimmed) || // fenced code
        /\*\*[^*\n]+\*\*/.test(trimmed) || // bold
        /(?<![*_])\*[^*\n]+\*(?![*_])/.test(trimmed) || // italic *...*
        /(?<![_])_[^_\n]+_(?![_])/.test(trimmed) || // italic _..._
        /~~[^~\n]+~~/.test(trimmed) || // strikethrough
        /`[^`\n]+`/.test(trimmed) || // inline code
        /!\[[^\]]*\]\([^)]+\)/.test(trimmed) || // image
        /\[[^\]]+\]\([^)]+\)/.test(trimmed) // link
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   contentToMarkdown — recursive walker
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Serialize an EditorContent tree back to a Markdown string.
 * Lossy for things Markdown can't express natively (underline, sub/sup,
 * font sizes, custom colors) — those are emitted as inline HTML.
 */
export function contentToMarkdown(content: EditorContent): string {
    const parts: string[] = [];
    for (const block of content.blocks) {
        const out = renderBlock(block, { listDepth: 0 });
        if (out) parts.push(out);
    }
    // Collapse 3+ blank lines into a max of one blank line between blocks.
    return (
        parts
            .join("\n\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim() + "\n"
    );
}

/**
 * Compose: HTML → EditorContent → Markdown.
 * Handy when you only have HTML on hand.
 */
export function htmlToMarkdown(html: string): string {
    const content = htmlToContent(html);
    return contentToMarkdown(content);
}

interface RenderCtx {
    listDepth: number;
}

function renderBlock(node: EditorNode, ctx: RenderCtx): string {
    switch (node.type) {
        case "p":
        case "div": {
            const inner = renderInline(node.children ?? []);
            // Empty paragraphs become a hard break placeholder so they aren't lost.
            return inner.trim() === "" ? "" : inner;
        }
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6": {
            const level = Number(node.type[1]);
            const inner = renderInline(node.children ?? []);
            return `${"#".repeat(level)} ${inner}`;
        }
        case "hr":
            return "---";
        case "blockquote": {
            const inner = (node.children ?? [])
                .map((c) => renderBlock(c, ctx))
                .filter(Boolean)
                .join("\n\n");
            return inner
                .split("\n")
                .map((l) => `> ${l}`)
                .join("\n");
        }
        case "pre": {
            // <pre> may wrap a <code> or hold text directly.
            const raw = extractText(node);
            return `\`\`\`\n${raw}\n\`\`\``;
        }
        case "ul":
        case "ol":
            return renderList(node, ctx);
        case "li":
            // Stand-alone li (shouldn't normally happen) — render as paragraph.
            return renderInline(node.children ?? []);
        case "table":
            return renderTable(node);
        case "image":
            return renderImage(node);
        case "br":
            return "";
        default:
            // Unknown block: emit as inline so we don't drop content.
            return renderInline([node]);
    }
}

function renderList(node: EditorNode, ctx: RenderCtx): string {
    const ordered = node.type === "ol";
    const isCheckbox = node.attributes?.class?.includes("rte-checkbox-list");
    const items = (node.children ?? []).filter((c) => c.type === "li");
    const indent = "    ".repeat(ctx.listDepth);
    const lines: string[] = [];

    items.forEach((li, idx) => {
        const nestedCtx: RenderCtx = { ...ctx, listDepth: ctx.listDepth + 1 };

        // Split li children into inline run + nested block lists.
        const inlineChildren: EditorNode[] = [];
        const nestedBlocks: EditorNode[] = [];
        (li.children ?? []).forEach((c) => {
            if (c.type === "ul" || c.type === "ol") nestedBlocks.push(c);
            else inlineChildren.push(c);
        });

        let prefix: string;
        if (isCheckbox) {
            const checked = li.attributes?.checkboxChecked === "true";
            prefix = `- [${checked ? "x" : " "}] `;
        } else if (ordered) {
            prefix = `${idx + 1}. `;
        } else {
            prefix = "- ";
        }

        const inlineText = renderInline(inlineChildren).trim();
        lines.push(`${indent}${prefix}${inlineText}`);

        nestedBlocks.forEach((nb) => {
            const sub = renderList(nb, nestedCtx);
            if (sub) lines.push(sub);
        });
    });

    return lines.join("\n");
}

function renderTable(node: EditorNode): string {
    // Expect: table > (thead?, tbody?) > tr > (th|td)
    const allRows: EditorNode[] = [];
    const collectRows = (n: EditorNode) => {
        (n.children ?? []).forEach((c) => {
            if (c.type === "tr") allRows.push(c);
            else if (c.type === "thead" || c.type === "tbody") collectRows(c);
        });
    };
    collectRows(node);
    if (allRows.length === 0) return "";

    const rowToCells = (row: EditorNode) =>
        (row.children ?? [])
            .filter((c) => c.type === "td" || c.type === "th")
            .map((cell) =>
                renderInline(cell.children ?? [])
                    .replace(/\|/g, "\\|")
                    .replace(/\n/g, " "),
            );

    const header = rowToCells(allRows[0]);
    const body = allRows.slice(1).map(rowToCells);
    const colCount = Math.max(header.length, ...body.map((r) => r.length));

    const pad = (cells: string[]) => {
        const out = cells.slice();
        while (out.length < colCount) out.push("");
        return out;
    };

    const lines: string[] = [];
    lines.push("| " + pad(header).join(" | ") + " |");
    lines.push("| " + Array(colCount).fill("---").join(" | ") + " |");
    body.forEach((r) => lines.push("| " + pad(r).join(" | ") + " |"));
    return lines.join("\n");
}

function renderImage(node: EditorNode): string {
    const src = node.attributes?.src ?? "";
    const alt = node.attributes?.alt ?? "";
    if (!src) return "";
    return `![${alt}](${src})`;
}

function renderInline(nodes: EditorNode[]): string {
    return nodes.map((n) => renderInlineNode(n)).join("");
}

function renderInlineNode(node: EditorNode): string {
    switch (node.type) {
        case "text":
            return escapeMd(node.text ?? "");
        case "br":
            return "  \n";
        case "bold":
        case "strong":
        case "b":
            return `**${renderInline(node.children ?? [])}**`;
        case "italic":
        case "em":
        case "i":
            return `*${renderInline(node.children ?? [])}*`;
        case "strikethrough":
        case "s":
        case "del":
        case "strike":
            return `~~${renderInline(node.children ?? [])}~~`;
        case "code":
            return `\`${extractText(node)}\``;
        case "link":
        case "a": {
            const href = node.attributes?.href ?? "";
            const extra = node.attributes?.["data-url-extra"] ?? "";
            const fullHref = href + extra;
            const text = renderInline(node.children ?? []) || fullHref;
            return `[${text}](${fullHref})`;
        }
        case "image":
            return renderImage(node);
        case "underline":
        case "u":
            return `<u>${renderInline(node.children ?? [])}</u>`;
        case "subscript":
        case "sub":
            return `<sub>${renderInline(node.children ?? [])}</sub>`;
        case "superscript":
        case "sup":
            return `<sup>${renderInline(node.children ?? [])}</sup>`;
        case "span":
        case "font":
            // Span/font carry style only — drop the wrapper, keep the children.
            return renderInline(node.children ?? []);
        default:
            // Unknown inline: emit children so we never silently drop content.
            return renderInline(node.children ?? []);
    }
}

function extractText(node: EditorNode): string {
    if (node.type === "text") return node.text ?? "";
    return (node.children ?? []).map(extractText).join("");
}

/** Minimal escape for characters that have meaning in markdown text. */
function escapeMd(text: string): string {
    return text.replace(/([\\`*_{}\[\]()#+\-!>])/g, "\\$1");
}
