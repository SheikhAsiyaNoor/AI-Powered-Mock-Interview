"use client";

import React, { useMemo } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import katex from "katex";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
    const htmlContent = useMemo(() => {
        if (!content || content === "undefined" || content === "null") return "";

        // Remove accidental "undefined" or "null" artifacts from AI responses
        let processed = String(content)
            .replace(/^undefined\s*:\s*/i, "")
            .replace(/^undefined\s+/i, "")
            .replace(/\s+undefined$/i, "");

        if (processed.trim() === "undefined" || processed.trim() === "null") return "";

        // Block Math: $$ ... $$
        processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
            try {
                return `<div class="katex-block my-2 overflow-x-auto text-center py-1">${katex.renderToString(
                    math.trim(),
                    { displayMode: true, throwOnError: false }
                )}</div>`;
            } catch (e) {
                return `$$${math}$$`;
            }
        });

        // Inline Math: $ ... $ (Ensure not currency like $50 or $10.99)
        processed = processed.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (match, prefix, math) => {
            if (/^\s*\d+([.,]\d+)?\s*$/.test(math)) return match;
            try {
                const rendered = katex.renderToString(math.trim(), {
                    displayMode: false,
                    throwOnError: false,
                });
                return `${prefix}<span class="katex-inline">${rendered}</span>`;
            } catch (e) {
                return match;
            }
        });

        // 2. Configure marked renderer
        const renderer: any = new marked.Renderer();

        // Custom Code Block Renderer with Highlight.js and Copy button
        renderer.code = function ({ text, lang }: any) {
            const language = lang && hljs.getLanguage(lang) ? lang : undefined;
            let highlighted = text;
            if (language) {
                try {
                    highlighted = hljs.highlight(text, { language }).value;
                } catch (e) {
                    highlighted = text;
                }
            } else {
                try {
                    highlighted = hljs.highlightAuto(text).value;
                } catch (e) {
                    highlighted = text;
                }
            }

            const encodedCode = encodeURIComponent(text);

            return `<div class="code-block-container my-3 rounded-2xl overflow-hidden border border-border/60 bg-muted/60 dark:bg-card/80 shadow-xs">
                <div class="flex items-center justify-between px-3.5 py-1.5 bg-muted/90 dark:bg-muted/40 border-b border-border/40 text-[11px] text-muted-foreground font-mono font-bold">
                    <span class="text-blue-600 dark:text-blue-400 lowercase">${language || "code"}</span>
                    <button type="button" class="copy-code-btn px-2.5 py-0.5 rounded-lg bg-card/60 border border-border/40 hover:bg-card hover:text-foreground text-[10px] text-muted-foreground transition-all cursor-pointer" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodedCode}')).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 2000); })">Copy</button>
                </div>
                <pre class="p-3.5 overflow-x-auto text-[12px] font-mono leading-relaxed text-foreground"><code>${highlighted}</code></pre>
            </div>`;
        };

        // Inline Code styling
        renderer.codespan = function ({ text }: any) {
            return `<code class="px-1.5 py-0.5 rounded-md bg-muted/80 border border-border/50 text-blue-600 dark:text-blue-400 font-mono text-[11px]">${text}</code>`;
        };

        // Links with target="_blank"
        renderer.link = function ({ href, title, text }: any) {
            return `<a href="${href}" ${
                title ? `title="${title}"` : ""
            } target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline font-semibold">${text}</a>`;
        };

        // Headings
        renderer.heading = function ({ text, depth }: any) {
            const sizes: Record<number, string> = {
                1: "text-base font-extrabold mt-4 mb-2 text-foreground",
                2: "text-sm font-bold mt-3 mb-1.5 text-foreground",
                3: "text-xs font-bold mt-2.5 mb-1 text-foreground",
                4: "text-xs font-semibold mt-2 mb-1 text-foreground",
            };
            const cls = sizes[depth] || sizes[4];
            return `<h${depth} class="${cls}">${text}</h${depth}>`;
        };

        // Blockquotes
        renderer.blockquote = function ({ text }: any) {
            return `<blockquote class="border-l-4 border-blue-600/60 pl-3.5 py-1 my-2.5 bg-blue-500/5 text-muted-foreground text-xs italic rounded-r-xl">${text}</blockquote>`;
        };

        // Unordered and ordered lists
        renderer.list = function ({ body, ordered }: any) {
            return ordered
                ? `<ol class="list-decimal list-outside ml-4 my-2 space-y-1 text-xs leading-relaxed text-foreground">${body}</ol>`
                : `<ul class="list-disc list-outside ml-4 my-2 space-y-1 text-xs leading-relaxed text-foreground">${body}</ul>`;
        };

        renderer.listitem = function ({ text }: any) {
            return `<li class="my-0.5">${text}</li>`;
        };

        // Paragraphs
        renderer.paragraph = function ({ text }: any) {
            return `<p class="mb-2 last:mb-0 leading-relaxed">${text}</p>`;
        };

        return marked.parse(processed, { renderer, gfm: true, breaks: true }) as string;
    }, [content]);

    return (
        <div
            className={`markdown-prose text-xs leading-relaxed text-foreground break-words ${className}`}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

export default MarkdownRenderer;
