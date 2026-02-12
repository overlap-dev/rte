import React from "react";
import { EditorContent, EditorNode } from "../types";
import { ensureAllCheckboxes } from "./checkbox";
import { isCheckboxList } from "./dom";

/**
 * Converts a DOM element (editor root) to EditorContent JSON.
 * Supports own format, Lexical HTML, and GitHub HTML.
 */
export function domToContent(element: HTMLElement): EditorContent {
    const blocks: EditorNode[] = [];

    // Normalize all checkbox lists before conversion
    ensureAllCheckboxes(element);

    function processNode(node: Node): EditorNode | null {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text === null || text === undefined) return null;

            // In checkbox lists, skip whitespace-only text nodes
            // if the LI has other meaningful text
            const isOnlyWhitespace = /^[\s\u200B]*$/.test(text);
            const isInCheckboxList =
                node.parentElement?.closest("ul.rte-checkbox-list") !== null;

            if (isOnlyWhitespace && isInCheckboxList) {
                const li = node.parentElement?.closest("li");
                if (li) {
                    const allText = li.textContent || "";
                    const textWithoutWhitespace = allText.replace(
                        /[\s\u200B]/g,
                        ""
                    );
                    if (textWithoutWhitespace.length > 0) {
                        return null;
                    }
                }
            }

            return { type: "text", text };
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }

        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // Skip checkbox input elements (GitHub format remnants)
        if (tagName === "input" && el.getAttribute("type") === "checkbox") {
            return null;
        }

        // Handle <br> as empty text
        if (tagName === "br") {
            return null;
        }

        if (tagName === "img") {
            const attributes: Record<string, string> = {};
            const src = el.getAttribute("src");
            const alt = el.getAttribute("alt");
            if (src) attributes.src = src;
            if (alt) attributes.alt = alt;
            return {
                type: "image",
                attributes:
                    Object.keys(attributes).length > 0
                        ? attributes
                        : undefined,
            };
        }

        // Block elements
        if (
            [
                "p",
                "div",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "blockquote",
                "ul",
                "ol",
                "li",
            ].includes(tagName)
        ) {
            const children: EditorNode[] = [];
            const attributes: Record<string, string> = {};

            // Detect checkbox lists (own + Lexical + GitHub formats)
            if (tagName === "ul" && isCheckboxList(el)) {
                attributes.class = "rte-checkbox-list";
            }

            // Detect checkbox list items via aria-checked
            if (tagName === "li") {
                const parentUl = el.closest("ul");
                if (
                    parentUl &&
                    isCheckboxList(parentUl) &&
                    el.getAttribute("role") === "checkbox"
                ) {
                    const ariaChecked = el.getAttribute("aria-checked");
                    if (ariaChecked !== null) {
                        attributes.checkboxChecked = ariaChecked;
                    }
                }
            }

            // Process children recursively
            Array.from(el.childNodes).forEach((child) => {
                // Skip checkbox input nodes
                if (
                    child.nodeType === Node.ELEMENT_NODE &&
                    (child as HTMLElement).tagName.toLowerCase() === "input" &&
                    (child as HTMLElement).getAttribute("type") === "checkbox"
                ) {
                    return;
                }

                const processed = processNode(child);
                if (processed) {
                    children.push(processed);
                }
            });

            return {
                type: tagName,
                children: children.length > 0 ? children : [],
                attributes:
                    Object.keys(attributes).length > 0
                        ? attributes
                        : undefined,
            };
        }

        // Inline elements
        if (
            [
                "strong",
                "b",
                "em",
                "i",
                "u",
                "s",
                "del",
                "strike",
                "a",
                "span",
            ].includes(tagName)
        ) {
            const children: EditorNode[] = [];
            Array.from(el.childNodes).forEach((child) => {
                const processed = processNode(child);
                if (processed) children.push(processed);
            });

            const attributes: Record<string, string> = {};
            Array.from(el.attributes).forEach((attr) => {
                attributes[attr.name] = attr.value;
            });

            // Links
            if (tagName === "a") {
                const href = el.getAttribute("href");
                if (href) attributes.href = href;
                return {
                    type: "link",
                    children: children.length > 0 ? children : undefined,
                    attributes:
                        Object.keys(attributes).length > 0
                            ? attributes
                            : undefined,
                };
            }

            // Spans: handle Lexical's white-space: pre-wrap wrapper
            if (tagName === "span") {
                const style = el.getAttribute("style") || "";
                const hasSemanticStyle =
                    style.includes("font-size") ||
                    style.includes("color") ||
                    style.includes("background-color");

                // Transparent wrapper (e.g. Lexical's <span style="white-space: pre-wrap;">)
                // Return text content directly
                if (!hasSemanticStyle) {
                    if (
                        el.childNodes.length === 1 &&
                        el.firstChild?.nodeType === Node.TEXT_NODE
                    ) {
                        return {
                            type: "text",
                            text: el.firstChild.textContent || "",
                        };
                    }
                    // Multiple children: flatten (return each child as-is)
                    if (children.length === 1) {
                        return children[0];
                    }
                    // If multiple children, keep as span but without extra attributes
                    if (children.length > 1) {
                        return {
                            type: "span",
                            children,
                        };
                    }
                    return null;
                }

                // Semantic span: extract meaningful style properties
                if (style) {
                    style.split(";").forEach((rule) => {
                        const [key, value] = rule
                            .split(":")
                            .map((s) => s.trim());
                        if (key && value) {
                            if (key === "font-size") {
                                attributes.fontSize = value;
                            } else if (key === "color") {
                                attributes.color = value;
                            } else if (key === "background-color") {
                                attributes.backgroundColor = value;
                            }
                        }
                    });
                }
            }

            // Map tag names to semantic types
            const type =
                tagName === "strong" || tagName === "b"
                    ? "bold"
                    : tagName === "em" || tagName === "i"
                    ? "italic"
                    : tagName === "u"
                    ? "underline"
                    : tagName === "s" ||
                      tagName === "del" ||
                      tagName === "strike"
                    ? "strikethrough"
                    : tagName;

            return {
                type,
                children: children.length > 0 ? children : undefined,
                attributes:
                    Object.keys(attributes).length > 0
                        ? attributes
                        : undefined,
            };
        }

        return null;
    }

    // Process all child nodes of the editor element
    Array.from(element.childNodes).forEach((node) => {
        const processed = processNode(node);
        if (processed) {
            // Wrap bare text nodes in a paragraph
            if (processed.type === "text") {
                blocks.push({ type: "p", children: [processed] });
            } else {
                blocks.push(processed);
            }
        }
    });

    if (blocks.length === 0) {
        blocks.push({ type: "p", children: [] });
    }

    return { blocks };
}

/**
 * Converts EditorContent JSON to DOM and appends to the container.
 */
export function contentToDOM(
    content: EditorContent,
    container: HTMLElement,
    customLinkComponent?: React.ComponentType<{
        href: string;
        children: React.ReactNode;
        [key: string]: unknown;
    }>,
    customHeadingRenderer?: (
        level: string,
        children: React.ReactNode
    ) => React.ReactElement
): void {
    container.innerHTML = "";

    function createNode(node: EditorNode): Node {
        if (node.type === "text" && node.text !== undefined) {
            return document.createTextNode(node.text);
        }

        if (node.type === "image") {
            const img = document.createElement("img");
            if (node.attributes) {
                if (node.attributes.src)
                    img.setAttribute("src", node.attributes.src);
                if (node.attributes.alt)
                    img.setAttribute("alt", node.attributes.alt);
                if (node.attributes.uploading === "true") {
                    img.setAttribute("data-uploading", "true");
                }
            }
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            img.style.display = "block";
            img.style.margin = "16px 0";
            return img;
        }

        const tagMap: Record<string, string> = {
            bold: "strong",
            italic: "em",
            underline: "u",
            strikethrough: "s",
            link: "a",
        };

        let tagName = tagMap[node.type] || node.type;

        if (node.type === "link" && customLinkComponent) {
            tagName = "a";
            if (node.attributes) {
                node.attributes["data-custom-link"] = "true";
            }
        }

        const element = document.createElement(tagName);

        if (node.attributes) {
            Object.entries(node.attributes).forEach(([key, value]) => {
                if (key === "fontSize") {
                    element.style.fontSize = value;
                } else if (key === "color") {
                    element.style.color = value;
                } else if (key === "backgroundColor") {
                    element.style.backgroundColor = value;
                } else if (key === "href" && tagName === "a") {
                    element.setAttribute("href", value);
                } else if (key === "class") {
                    element.className = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
        }

        if (node.children) {
            node.children.forEach((child) => {
                element.appendChild(createNode(child));
            });
        }

        // Set checkbox attributes on list items
        if (
            node.type === "li" &&
            node.attributes?.checkboxChecked !== undefined
        ) {
            element.setAttribute("role", "checkbox");
            element.setAttribute("tabIndex", "-1");
            element.setAttribute(
                "aria-checked",
                node.attributes.checkboxChecked
            );
        }

        return element;
    }

    content.blocks.forEach((block) => {
        container.appendChild(createNode(block));
    });

    // Normalize all checkbox lists after DOM creation
    ensureAllCheckboxes(container);
}

/**
 * Creates empty editor content with a single paragraph.
 */
export function createEmptyContent(): EditorContent {
    return {
        blocks: [{ type: "p", children: [] }],
    };
}

/**
 * Converts EditorContent to an HTML string.
 */
export function contentToHTML(content: EditorContent): string {
    const tempDiv = document.createElement("div");
    contentToDOM(content, tempDiv);
    return tempDiv.innerHTML;
}

/**
 * Converts an HTML string to EditorContent.
 * Supports Lexical, GitHub, and standard HTML formats.
 */
export function htmlToContent(htmlString: string): EditorContent {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    return domToContent(tempDiv);
}
