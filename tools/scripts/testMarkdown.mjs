/**
 * Zero-dependency smoke test for the markdown→HTML parser.
 *
 * Runs against the built bundle (run `npm run build` first) so it needs no
 * test framework. Exits non-zero on the first failed assertion.
 *
 *   npm run test:markdown
 */

import { markdownToHtml } from "../../dist/index.esm.js";

let passed = 0;
const failures = [];

function check(name, condition) {
    if (condition) {
        passed++;
    } else {
        failures.push(name);
    }
}

/* ── Targeted unit checks ──────────────────────────────────────────────── */

check("h1", markdownToHtml("# Title") === "<h1>Title</h1>");
check("h3", markdownToHtml("### Sub") === "<h3>Sub</h3>");
check(
    "bold + italic",
    markdownToHtml("**b** and *i*") ===
        "<p><strong>b</strong> and <em>i</em></p>",
);
check(
    "strikethrough",
    markdownToHtml("~~old~~") === "<p><s>old</s></p>",
);
check(
    "inline code keeps specials",
    markdownToHtml("use `a | b` here") ===
        "<p>use <code>a | b</code> here</p>",
);
check(
    "link",
    markdownToHtml("[text](https://x.io)") ===
        '<p><a href="https://x.io">text</a></p>',
);
check(
    "bare autolink",
    markdownToHtml("see https://docs.anthropic.com/mcp now").includes(
        '<a href="https://docs.anthropic.com/mcp">https://docs.anthropic.com/mcp</a>',
    ),
);
check("hr", markdownToHtml("---") === "<hr>");

/* ── Fenced code with ASCII art + pipes must NOT become a table ────────── */

const asciiArt = [
    "```",
    "┌─────────┐   ┌───────────────┐",
    "│  User   │──►│ Claude Sonnet │",
    "└─────────┘   └───────────────┘",
    "```",
].join("\n");
const asciiOut = markdownToHtml(asciiArt);
check("code fence opens <pre><code>", asciiOut.startsWith("<pre><code>"));
check("code fence has no <table>", !asciiOut.includes("<table>"));
check("code fence preserves pipes", asciiOut.includes("──►"));
check(
    "code fence escapes angle brackets",
    asciiOut.includes("&lt;") === false && asciiOut.includes("┌"),
);

/* ── GFM table with alignment ──────────────────────────────────────────── */

const table = [
    "| Rolle | Lesen | Schließen |",
    "|-------|:-----:|:---------:|",
    "| viewer | yes | no |",
].join("\n");
const tableOut = markdownToHtml(table);
check("table element", tableOut.includes("<table>"));
check("table header cell", tableOut.includes("<th"));
check("table body cell", tableOut.includes("<td"));
check("table center alignment", tableOut.includes("text-align:center"));

/* ── Task list maps to checkbox list ───────────────────────────────────── */

const tasks = ["- [x] done", "- [ ] todo"].join("\n");
const tasksOut = markdownToHtml(tasks);
check("task list ul class", tasksOut.includes('class="rte-checkbox-list"'));
check(
    "task checked",
    tasksOut.includes('role="checkbox" aria-checked="true"'),
);
check(
    "task unchecked",
    tasksOut.includes('role="checkbox" aria-checked="false"'),
);

/* ── Nested list ───────────────────────────────────────────────────────── */

const nested = ["- parent", "    - child"].join("\n");
const nestedOut = markdownToHtml(nested);
check(
    "nested list",
    /<ul><li>parent<ul><li>child<\/li><\/ul><\/li><\/ul>/.test(nestedOut),
);

/* ── Blockquote ────────────────────────────────────────────────────────── */

check(
    "blockquote",
    markdownToHtml("> quoted").includes("<blockquote><p>quoted</p></blockquote>"),
);

/* ── Heading directly followed by a table (no stray blank text) ────────── */

const headingTable = ["## Matrix", "", table].join("\n");
const htOut = markdownToHtml(headingTable);
check("heading then table: heading", htOut.includes("<h2>Matrix</h2>"));
check("heading then table: table", htOut.includes("<table>"));
check(
    "heading then table: no empty paragraphs",
    !htOut.includes("<p></p>"),
);

/* ── Setext headings ───────────────────────────────────────────────────── */

check("setext h1", markdownToHtml("Title\n===") === "<h1>Title</h1>");
check("setext h2", markdownToHtml("Title\n---") === "<h2>Title</h2>");
check(
    "standalone --- stays hr",
    markdownToHtml("text\n\n---") === "<p>text</p>\n<hr>",
);

/* ── Indented code block ───────────────────────────────────────────────── */

check(
    "indented code block",
    markdownToHtml("    const x = 1;") ===
        "<pre><code>const x = 1;</code></pre>",
);

/* ── Autolinks (email / www / angle) ───────────────────────────────────── */

check(
    "email autolink",
    markdownToHtml("mail a.nakicevic@overlap.at now").includes(
        '<a href="mailto:a.nakicevic@overlap.at">a.nakicevic@overlap.at</a>',
    ),
);
check(
    "www autolink",
    markdownToHtml("go www.example.com now").includes(
        '<a href="http://www.example.com">www.example.com</a>',
    ),
);
check(
    "angle url autolink",
    markdownToHtml("<https://x.io>").includes(
        '<a href="https://x.io">https://x.io</a>',
    ),
);
check(
    "angle email autolink",
    markdownToHtml("<a@b.io>").includes('<a href="mailto:a@b.io">a@b.io</a>'),
);

/* ── Reference links / images ──────────────────────────────────────────── */

check(
    "reference link",
    markdownToHtml("[text][id]\n\n[id]: https://x.io").includes(
        '<a href="https://x.io">text</a>',
    ),
);
check(
    "collapsed reference link",
    markdownToHtml("[id][]\n\n[id]: https://x.io").includes(
        '<a href="https://x.io">id</a>',
    ),
);
check(
    "shortcut reference link",
    markdownToHtml("see [id] here\n\n[id]: https://x.io").includes(
        '<a href="https://x.io">id</a>',
    ),
);
check(
    "reference image",
    markdownToHtml("![logo][l]\n\n[l]: https://x.io/a.png").includes(
        '<img src="https://x.io/a.png" alt="logo">',
    ),
);

/* ── Ordered list with `)` marker ──────────────────────────────────────── */

check(
    "ordered list with ) marker",
    markdownToHtml("1) one\n2) two") ===
        "<ol><li>one</li><li>two</li></ol>",
);

/* ── Loose vs tight lists ──────────────────────────────────────────────── */

check(
    "tight list (no <p>)",
    markdownToHtml("- a\n- b") === "<ul><li>a</li><li>b</li></ul>",
);
check(
    "loose list wraps items in <p>",
    markdownToHtml("- a\n\n- b") ===
        "<ul><li><p>a</p></li><li><p>b</p></li></ul>",
);

/* ── Backslash hard break ──────────────────────────────────────────────── */

check(
    "backslash hard break",
    markdownToHtml("a\\\nb") === "<p>a<br>b</p>",
);

/* ── Report ────────────────────────────────────────────────────────────── */

if (failures.length > 0) {
    console.error(`\n✗ ${failures.length} markdown test(s) failed:`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error(`\n${passed} passed, ${failures.length} failed.\n`);
    process.exit(1);
}

console.log(`\n✓ All ${passed} markdown parser tests passed.\n`);
