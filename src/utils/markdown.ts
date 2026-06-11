/**
 * Markdown ⇄ EditorContent bridge.
 *
 * Lets consumers feed plain Markdown into the editor (e.g. from LLM/MCP
 * pipelines that emit `# Heading`, `- item`, `**bold**` …) and round-trip
 * EditorContent back to a Markdown string.
 *
 * Strategy:
 *   - md → content:  self-contained GFM-subset parser → HTML → htmlToContent
 *                     (reuses the existing sanitizer + tag whitelist).
 *   - content → md:  recursive walker over EditorNode tree.
 *
 * The markdown→HTML parser is intentionally dependency-free (the RTE ships
 * with zero runtime dependencies). It covers the GFM subset the editor can
 * actually represent: ATX headings, ordered/unordered/task lists (nested),
 * blockquotes, fenced code, horizontal rules, GFM tables (with alignment),
 * bold, italic, strikethrough, inline code, links, images and bare http(s)
 * autolinks. It is NOT a full CommonMark/GFM implementation: setext headings,
 * indented code blocks, reference links, footnotes and www./email autolinks
 * are not supported.
 */

import { EditorContent, EditorNode } from "../types";
import { htmlToContent } from "./content";

/**
 * Convert a Markdown string to an HTML string.
 * Useful when you just want to pipe Markdown to a HTML-consuming renderer.
 */
export function markdownToHtml(md: string): string {
    if (!md) return "";
    const lines = md.replace(/\r\n?/g, "\n").split("\n");
    // Reference definitions must be resolvable from anywhere, so collect them
    // up-front (fence-aware) and blank out their source lines.
    refDefs = Object.create(null) as Record<string, string>;
    const cleaned = collectRefDefinitions(lines, refDefs);
    return parseBlocks(cleaned).join("\n");
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

/* ─────────────────────────────────────────────────────────────────────────
   Markdown → HTML parser (dependency-free, GFM subset)
   ──────────────────────────────────────────────────────────────────────── */

const LIST_ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const HR_RE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const FENCE_RE = /^\s*(```+|~~~+)(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const SETEXT_RE = /^\s{0,3}(=+|-+)\s*$/;
const INDENT_CODE_RE = /^( {4}|\t)/;
const REF_DEF_RE =
    /^ {0,3}\[([^\]]+)\]:\s*(\S+?)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/;

/**
 * Reference link/image definitions, keyed by lowercased label.
 * Populated per markdownToHtml() call; read by matchLink().
 */
let refDefs: Record<string, string> = Object.create(null);

/**
 * Collect reference definitions (`[id]: url "title"`) from the line stream,
 * skipping fenced code regions, and return a copy with those lines blanked.
 */
function collectRefDefinitions(
    lines: string[],
    refs: Record<string, string>,
): string[] {
    const out = lines.slice();
    let inFence = false;
    let fenceChar = "";
    let fenceLen = 0;

    for (let i = 0; i < out.length; i++) {
        const line = out[i];
        const f = line.match(FENCE_RE);
        if (f) {
            const marker = f[1][0];
            if (!inFence) {
                inFence = true;
                fenceChar = marker;
                fenceLen = f[1].length;
            } else if (
                marker === fenceChar &&
                f[1].length >= fenceLen &&
                /^\s*(```+|~~~+)\s*$/.test(line)
            ) {
                inFence = false;
            }
            continue;
        }
        if (inFence) continue;

        const m = line.match(REF_DEF_RE);
        if (m) {
            const id = m[1].trim().toLowerCase();
            let url = m[2];
            if (url.startsWith("<") && url.endsWith(">")) {
                url = url.slice(1, -1);
            }
            if (!(id in refs)) refs[id] = url;
            out[i] = "";
        }
    }
    return out;
}

/** Count leading whitespace columns (tab counts as 4). */
function leadingSpaces(line: string): number {
    let n = 0;
    for (const ch of line) {
        if (ch === " ") n++;
        else if (ch === "\t") n += 4;
        else break;
    }
    return n;
}

/** Remove up to `n` leading whitespace columns from a line. */
function dedent(line: string, n: number): string {
    let removed = 0;
    let i = 0;
    while (i < line.length && removed < n) {
        if (line[i] === " ") removed += 1;
        else if (line[i] === "\t") removed += 4;
        else break;
        i++;
    }
    return line.slice(i);
}

/** Strip a single wrapping `<p>…</p>` (used for tight list items). */
function unwrapParagraph(html: string): string {
    const m = html.match(/^<p>([\s\S]*)<\/p>$/);
    return m ? m[1] : html;
}

/** HTML-escape text content. */
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/** HTML-escape an attribute value (adds quote escaping). */
function escapeAttr(s: string): string {
    return escapeHtml(s).replace(/"/g, "&quot;");
}

/** GFM table delimiter row, e.g. `| :--- | :--: | ---: |`. */
function isTableDelimiter(line: string | undefined): boolean {
    if (!line) return false;
    return /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(line);
}

/** True if `line` starts a new block (used to terminate paragraphs). */
function isBlockStart(line: string | undefined, next: string | undefined): boolean {
    if (line === undefined) return true;
    if (/^\s*$/.test(line)) return true;
    if (FENCE_RE.test(line)) return true;
    if (HEADING_RE.test(line)) return true;
    if (HR_RE.test(line)) return true;
    if (/^\s*>/.test(line)) return true;
    if (LIST_ITEM_RE.test(line)) return true;
    if (line.includes("|") && isTableDelimiter(next)) return true;
    return false;
}

/** Parse a list of markdown lines into an array of HTML block strings. */
function parseBlocks(lines: string[]): string[] {
    const out: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (/^\s*$/.test(line)) {
            i++;
            continue;
        }

        // Fenced code block — consume verbatim until the closing fence.
        const fence = line.match(FENCE_RE);
        if (fence) {
            const marker = fence[1][0];
            const fenceLen = fence[1].length;
            const codeLines: string[] = [];
            i++;
            while (i < lines.length) {
                const close = lines[i].match(/^\s*(```+|~~~+)\s*$/);
                if (
                    close &&
                    close[1][0] === marker &&
                    close[1].length >= fenceLen
                ) {
                    i++;
                    break;
                }
                codeLines.push(lines[i]);
                i++;
            }
            out.push(
                `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
            );
            continue;
        }

        // Indented code block (4 spaces / tab) — checked before headings etc.
        // because indented content is verbatim. Lists consume their own
        // indented children, so reaching here means top-level code.
        if (INDENT_CODE_RE.test(line)) {
            const codeLines: string[] = [];
            while (i < lines.length) {
                if (INDENT_CODE_RE.test(lines[i])) {
                    codeLines.push(lines[i].replace(INDENT_CODE_RE, ""));
                    i++;
                } else if (
                    /^\s*$/.test(lines[i]) &&
                    INDENT_CODE_RE.test(lines[i + 1] ?? "")
                ) {
                    // Blank line inside the code block (more code follows).
                    codeLines.push("");
                    i++;
                } else {
                    break;
                }
            }
            out.push(
                `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
            );
            continue;
        }

        // ATX heading
        const heading = line.match(HEADING_RE);
        if (heading) {
            const level = heading[1].length;
            out.push(`<h${level}>${parseInline(heading[2])}</h${level}>`);
            i++;
            continue;
        }

        // Horizontal rule (checked before lists so `- - -` isn't a list)
        if (HR_RE.test(line)) {
            out.push("<hr>");
            i++;
            continue;
        }

        // Blockquote — gather consecutive `>` lines, parse recursively.
        if (/^\s*>/.test(line)) {
            const quoteLines: string[] = [];
            while (i < lines.length && /^\s*>/.test(lines[i])) {
                quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
                i++;
            }
            const inner = parseBlocks(quoteLines).join("\n");
            out.push(`<blockquote>${inner}</blockquote>`);
            continue;
        }

        // GFM table — current line has pipes and the next is a delimiter row.
        if (line.includes("|") && isTableDelimiter(lines[i + 1])) {
            const table = parseTable(lines, i);
            out.push(table.html);
            i = table.next;
            continue;
        }

        // List
        if (LIST_ITEM_RE.test(line)) {
            const indent = line.match(LIST_ITEM_RE)![1].length;
            const list = parseList(lines, i, indent);
            out.push(list.html);
            i = list.next;
            continue;
        }

        // Paragraph — gather until a block boundary or a setext underline.
        const paraLines: string[] = [line];
        i++;
        let setextLevel = 0;
        while (i < lines.length) {
            // A setext underline turns the gathered paragraph into a heading.
            const u = lines[i].match(SETEXT_RE);
            if (u) {
                setextLevel = u[1][0] === "=" ? 1 : 2;
                i++;
                break;
            }
            if (isBlockStart(lines[i], lines[i + 1])) break;
            paraLines.push(lines[i]);
            i++;
        }
        const inlineHtml = parseInline(paraLines.join("\n"));
        if (setextLevel) {
            out.push(`<h${setextLevel}>${inlineHtml}</h${setextLevel}>`);
        } else {
            out.push(`<p>${inlineHtml}</p>`);
        }
    }

    return out;
}

interface ListItem {
    /** Dedented body lines of the item (parsed recursively as blocks). */
    body: string[];
    checked: boolean | null;
    /** Column width of the marker (where the item's content starts). */
    contentIndent: number;
}

/**
 * Parse a list starting at `start` whose markers are indented by `baseIndent`.
 * Items' bodies are parsed recursively as blocks, which yields correct
 * nesting plus tight/loose handling (loose items wrap content in <p>).
 * Returns the rendered HTML and the index of the first unconsumed line.
 */
function parseList(
    lines: string[],
    start: number,
    baseIndent: number,
): { html: string; next: number } {
    const ordered = /\d+[.)]/.test(lines[start].match(LIST_ITEM_RE)![2]);
    const items: ListItem[] = [];
    let isTaskList = false;
    let loose = false;
    let blankPending = false;
    let i = start;

    while (i < lines.length) {
        const line = lines[i];

        if (/^\s*$/.test(line)) {
            blankPending = true;
            i++;
            continue;
        }

        const m = line.match(LIST_ITEM_RE);

        // A new item at the base indent.
        if (m && m[1].length === baseIndent) {
            if (blankPending && items.length) loose = true;
            blankPending = false;

            const contentIndent = m[1].length + m[2].length + 1;
            let content = m[3];
            let checked: boolean | null = null;
            const task = content.match(/^\[([ xX])\]\s+(.*)$/);
            if (task) {
                checked = task[1].toLowerCase() === "x";
                content = task[2];
                isTaskList = true;
            }
            items.push({ body: [content], checked, contentIndent });
            i++;
            continue;
        }

        if (!items.length) break;
        const cur = items[items.length - 1];
        const indent = leadingSpaces(line);

        // A marker that is outdented past the base belongs to a parent list.
        if (m && m[1].length < baseIndent) break;

        // Content indented to (or past) the item's content column belongs to
        // the item (nested lists, continuation paragraphs, code, …).
        if (indent >= cur.contentIndent) {
            if (blankPending) {
                cur.body.push("");
                loose = true;
                blankPending = false;
            }
            cur.body.push(dedent(line, cur.contentIndent));
            i++;
            continue;
        }

        // A lazy continuation line (not indented, no preceding blank) still
        // belongs to the current item's paragraph.
        if (!m && !blankPending) {
            cur.body.push(line.trim());
            i++;
            continue;
        }

        // Anything else ends the list.
        break;
    }

    const tag = ordered ? "ol" : "ul";
    const cls = isTaskList ? ' class="rte-checkbox-list"' : "";
    let html = `<${tag}${cls}>`;
    for (const item of items) {
        // Drop trailing blank lines, then parse the body as blocks.
        const body = item.body.slice();
        while (body.length && body[body.length - 1] === "") body.pop();
        const blocks = parseBlocks(body);

        // Tight items unwrap their single paragraph; loose items keep <p>.
        const inner = loose
            ? blocks.join("")
            : blocks.map(unwrapParagraph).join("");

        const attrs =
            item.checked !== null
                ? ` role="checkbox" aria-checked="${item.checked}"`
                : "";
        html += `<li${attrs}>${inner}</li>`;
    }
    html += `</${tag}>`;
    return { html, next: i };
}

/** Split a table row into trimmed cell strings (respecting `\|` escapes). */
function splitTableRow(line: string): string[] {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    const cells: string[] = [];
    let cur = "";
    for (let i = 0; i < s.length; i++) {
        if (s[i] === "\\" && s[i + 1] === "|") {
            cur += "|";
            i++;
            continue;
        }
        if (s[i] === "|") {
            cells.push(cur);
            cur = "";
            continue;
        }
        cur += s[i];
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
}

/** Parse the alignment row into per-column css text-align values. */
function parseAlignments(line: string): (string | null)[] {
    return splitTableRow(line).map((c) => {
        const left = c.startsWith(":");
        const right = c.endsWith(":");
        if (left && right) return "center";
        if (right) return "right";
        if (left) return "left";
        return null;
    });
}

function parseTable(
    lines: string[],
    start: number,
): { html: string; next: number } {
    const header = splitTableRow(lines[start]);
    const aligns = parseAlignments(lines[start + 1]);
    let i = start + 2;
    const body: string[][] = [];
    while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        lines[i].includes("|")
    ) {
        body.push(splitTableRow(lines[i]));
        i++;
    }

    const alignAttr = (idx: number) =>
        aligns[idx] ? ` style="text-align:${aligns[idx]}"` : "";

    let html = "<table><thead><tr>";
    header.forEach((cell, idx) => {
        html += `<th${alignAttr(idx)}>${parseInline(cell)}</th>`;
    });
    html += "</tr></thead><tbody>";
    body.forEach((row) => {
        html += "<tr>";
        for (let idx = 0; idx < header.length; idx++) {
            html += `<td${alignAttr(idx)}>${parseInline(row[idx] ?? "")}</td>`;
        }
        html += "</tr>";
    });
    html += "</tbody></table>";
    return { html, next: i };
}

/** Find the next unescaped occurrence of `marker` from index `from`. */
function findClose(text: string, from: number, marker: string): number {
    let i = from;
    while (i < text.length) {
        if (text[i] === "\\") {
            i += 2;
            continue;
        }
        if (text.startsWith(marker, i)) return i;
        i++;
    }
    return -1;
}

/**
 * Match a link/image construct starting at the opening `[`.
 * Supports inline `[label](url)`, reference `[label][id]`, collapsed
 * `[label][]` and shortcut `[label]` forms (the latter three resolve
 * against the collected reference definitions).
 */
function matchLink(
    text: string,
    start: number,
): { label: string; url: string; end: number } | null {
    let depth = 0;
    let labelEnd = -1;
    let i = start;
    for (; i < text.length; i++) {
        const c = text[i];
        if (c === "\\") {
            i++;
            continue;
        }
        if (c === "[") depth++;
        else if (c === "]") {
            depth--;
            if (depth === 0) {
                labelEnd = i;
                break;
            }
        }
    }
    if (labelEnd === -1) return null;

    const label = text.slice(start + 1, labelEnd);
    const after = text[labelEnd + 1];

    // Inline form: [label](url "title")
    if (after === "(") {
        let pdepth = 1;
        let urlEnd = -1;
        let j = labelEnd + 2;
        for (; j < text.length; j++) {
            const c = text[j];
            if (c === "\\") {
                j++;
                continue;
            }
            if (c === "(") pdepth++;
            else if (c === ")") {
                pdepth--;
                if (pdepth === 0) {
                    urlEnd = j;
                    break;
                }
            }
        }
        if (urlEnd === -1) return null;
        let url = text.slice(labelEnd + 2, urlEnd).trim();
        const titled = url.match(/^(\S+)\s+["'(].*$/);
        if (titled) url = titled[1];
        if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1);
        return { label, url, end: urlEnd + 1 };
    }

    // Reference form: [label][id]  /  collapsed [label][]
    if (after === "[") {
        const idEnd = text.indexOf("]", labelEnd + 2);
        if (idEnd !== -1) {
            let id = text.slice(labelEnd + 2, idEnd).trim();
            if (id === "") id = label;
            const url = refDefs[id.toLowerCase()];
            if (url) return { label, url, end: idEnd + 1 };
        }
        return null;
    }

    // Shortcut form: [label] — only if a matching definition exists.
    const url = refDefs[label.trim().toLowerCase()];
    if (url) return { label, url, end: labelEnd + 1 };
    return null;
}

/**
 * Try to match a bare autolink (http(s), www., or email) at the start of
 * `rest`. Returns the href, display text and consumed length, or null.
 */
function tryAutolink(
    rest: string,
): { href: string; text: string; len: number } | null {
    const trimTrailing = (u: string): string => {
        const m = u.match(/[.,;:!?)\]}'"]+$/);
        return m ? u.slice(0, u.length - m[0].length) : u;
    };

    let m = rest.match(/^https?:\/\/[^\s<]+/);
    if (m) {
        const url = trimTrailing(m[0]);
        if (url.length > 8) return { href: url, text: url, len: url.length };
    }
    m = rest.match(/^www\.[^\s<]+/);
    if (m) {
        const url = trimTrailing(m[0]);
        return { href: `http://${url}`, text: url, len: url.length };
    }
    m = rest.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    if (m) {
        const url = m[0];
        return { href: `mailto:${url}`, text: url, len: url.length };
    }
    return null;
}

/** Match emphasis/strong (`*`/`_`/`**`/`__`) starting at index `start`. */
function matchEmphasis(
    text: string,
    start: number,
    marker: string,
): { html: string; end: number } | null {
    // Strong (double marker)
    if (text[start + 1] === marker) {
        const close = findClose(text, start + 2, marker + marker);
        if (close > start + 2) {
            return {
                html: `<strong>${parseInline(text.slice(start + 2, close))}</strong>`,
                end: close + 2,
            };
        }
    }
    // Emphasis (single marker) — require non-space right after the opener to
    // avoid turning ` * ` arithmetic-style text into emphasis.
    if (!/\s/.test(text[start + 1] ?? " ")) {
        // For `_`, skip intra-word underscores (GFM behavior).
        if (marker === "_") {
            const prev = text[start - 1];
            if (prev && /[A-Za-z0-9]/.test(prev)) return null;
        }
        const close = findClose(text, start + 1, marker);
        if (close > start + 1 && !/\s/.test(text[close - 1])) {
            return {
                html: `<em>${parseInline(text.slice(start + 1, close))}</em>`,
                end: close + 1,
            };
        }
    }
    return null;
}

/** Parse inline markdown within a single block into HTML. */
function parseInline(text: string): string {
    let out = "";
    let i = 0;

    while (i < text.length) {
        const ch = text[i];

        // Backslash hard line break (`\` at end of line)
        if (ch === "\\" && text[i + 1] === "\n") {
            out += "<br>";
            i += 2;
            continue;
        }

        // Backslash escape
        if (ch === "\\" && i + 1 < text.length) {
            out += escapeHtml(text[i + 1]);
            i += 2;
            continue;
        }

        // Angle autolink: <https://…> or <user@host>
        if (ch === "<") {
            const m = text
                .slice(i)
                .match(
                    /^<((?:https?:\/\/|mailto:)[^>\s]+|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)>/,
                );
            if (m) {
                const raw = m[1];
                const isEmail = raw.includes("@") && !/^mailto:/.test(raw);
                const href = isEmail ? `mailto:${raw}` : raw;
                const disp = raw.replace(/^mailto:/, "");
                out += `<a href="${escapeAttr(href)}">${escapeHtml(disp)}</a>`;
                i += m[0].length;
                continue;
            }
        }

        // Inline code span
        if (ch === "`") {
            let run = 1;
            while (text[i + run] === "`") run++;
            const fence = "`".repeat(run);
            const end = text.indexOf(fence, i + run);
            if (end !== -1) {
                let code = text.slice(i + run, end);
                // CommonMark: strip one surrounding space if both present.
                if (/^ .* $/s.test(code)) code = code.slice(1, -1);
                out += `<code>${escapeHtml(code)}</code>`;
                i = end + run;
                continue;
            }
            out += escapeHtml(ch);
            i++;
            continue;
        }

        // Image
        if (ch === "!" && text[i + 1] === "[") {
            const m = matchLink(text, i + 1);
            if (m) {
                out += `<img src="${escapeAttr(m.url)}" alt="${escapeAttr(m.label)}">`;
                i = m.end;
                continue;
            }
        }

        // Link
        if (ch === "[") {
            const m = matchLink(text, i);
            if (m) {
                out += `<a href="${escapeAttr(m.url)}">${parseInline(m.label)}</a>`;
                i = m.end;
                continue;
            }
        }

        // Strong / emphasis
        if (ch === "*" || ch === "_") {
            const res = matchEmphasis(text, i, ch);
            if (res) {
                out += res.html;
                i = res.end;
                continue;
            }
        }

        // Strikethrough
        if (ch === "~" && text[i + 1] === "~") {
            const end = text.indexOf("~~", i + 2);
            if (end > i + 2) {
                out += `<s>${parseInline(text.slice(i + 2, end))}</s>`;
                i = end + 2;
                continue;
            }
        }

        // Bare autolink (http(s) / www. / email) at a token boundary.
        if (/[A-Za-z0-9]/.test(ch)) {
            const prev = text[i - 1];
            const atBoundary =
                i === 0 || !/[A-Za-z0-9@._/+-]/.test(prev ?? "");
            if (atBoundary) {
                const a = tryAutolink(text.slice(i));
                if (a) {
                    out += `<a href="${escapeAttr(a.href)}">${escapeHtml(a.text)}</a>`;
                    i += a.len;
                    continue;
                }
            }
        }

        // Hard line break (two trailing spaces) → <br>
        if (ch === " " && text[i + 1] === " " && text[i + 2] === "\n") {
            out += "<br>";
            i += 3;
            continue;
        }

        // Soft line break → space
        if (ch === "\n") {
            out += " ";
            i++;
            continue;
        }

        out += escapeHtml(ch);
        i++;
    }

    return out;
}
