import React from "react";
import { EditorContent, EditorNode } from "../types";

export function domToContent(element: HTMLElement): EditorContent {
    const blocks: EditorNode[] = [];

    function processNode(node: Node): EditorNode | null {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text === null || text === undefined) return null;
            return { type: "text", text };
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();

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
                Array.from(el.childNodes).forEach((child) => {
                    const processed = processNode(child);
                    if (processed) children.push(processed);
                });

                const attributes: Record<string, string> = {};
                if (tagName === "a") {
                    const href = el.getAttribute("href");
                    if (href) attributes.href = href;
                }

                return {
                    type: tagName,
                    children: children.length > 0 ? children : [],
                    attributes:
                        Object.keys(attributes).length > 0
                            ? attributes
                            : undefined,
                };
            }

            if (
                ["strong", "b", "em", "i", "u", "a", "span"].includes(tagName)
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

                if (tagName === "span") {
                    const style = el.getAttribute("style");
                    if (style) {
                        const styleObj: Record<string, string> = {};
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

                return {
                    type:
                        tagName === "strong" || tagName === "b"
                            ? "bold"
                            : tagName === "em" || tagName === "i"
                            ? "italic"
                            : tagName === "u"
                            ? "underline"
                            : tagName,
                    children: children.length > 0 ? children : undefined,
                    attributes:
                        Object.keys(attributes).length > 0
                            ? attributes
                            : undefined,
                };
            }

            const children: EditorNode[] = [];
            Array.from(el.childNodes).forEach((child) => {
                const processed = processNode(child);
                if (processed) children.push(processed);
            });

            if (children.length > 0) {
                return {
                    type: tagName,
                    children,
                };
            }
        }

        return null;
    }

    Array.from(element.childNodes).forEach((node) => {
        const processed = processNode(node);
        if (processed) {
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

export function contentToDOM(
    content: EditorContent,
    container: HTMLElement,
    customLinkComponent?: React.ComponentType<{
        href: string;
        children: React.ReactNode;
        [key: string]: any;
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
                if (
                    key === "fontSize" ||
                    key === "color" ||
                    key === "backgroundColor"
                ) {
                    const currentStyle = element.getAttribute("style") || "";
                    if (key === "fontSize") {
                        element.setAttribute(
                            "style",
                            `${currentStyle}font-size: ${value};`.trim()
                        );
                    } else if (key === "color") {
                        element.setAttribute(
                            "style",
                            `${currentStyle}color: ${value};`.trim()
                        );
                    } else if (key === "backgroundColor") {
                        element.setAttribute(
                            "style",
                            `${currentStyle}background-color: ${value};`.trim()
                        );
                    }
                } else {
                    element.setAttribute(key, value);
                }
            });
        }

        if (node.children) {
            node.children.forEach((child) => {
                const childNode = createNode(child);
                element.appendChild(childNode);
            });
        }

        return element;
    }

    content.blocks.forEach((block) => {
        const blockNode = createNode(block);
        container.appendChild(blockNode);
    });
}

export function createEmptyContent(): EditorContent {
    return {
        blocks: [{ type: "p", children: [] }],
    };
}

export function htmlToContent(htmlString: string): EditorContent {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString.trim();
    return domToContent(tempDiv);
}

export function contentToHTML(content: EditorContent): string {
    const tempDiv = document.createElement("div");
    contentToDOM(content, tempDiv);
    return tempDiv.innerHTML;
}
