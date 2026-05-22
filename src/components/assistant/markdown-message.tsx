"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

// Tree-shaken language registration to keep the bundle slim.
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("ts", ts);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("xml", markup);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("yml", yaml);
SyntaxHighlighter.registerLanguage("go", go);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("rs", rust);

interface MarkdownMessageProps {
  content: string;
  /** Render a blinking cursor at the end while the model is streaming. */
  streaming?: boolean;
  className?: string;
}

/**
 * Renders an assistant reply as rich Markdown with:
 *  · GFM extensions (tables, strikethrough, task lists, autolink)
 *  · Syntax-highlighted multi-line code blocks (vsc-dark-plus theme)
 *  · Inline code, blockquotes, lists, links — all styled to fit the dark UI
 *  · Copy-to-clipboard button on each code block
 *  · Optional trailing typing cursor for streamed messages
 */
export function MarkdownMessage({
  content,
  streaming,
  className,
}: MarkdownMessageProps) {
  return (
    <div className={cn("prose-nova", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-300 underline-offset-2 hover:underline"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children, ...props }) => {
            const checked = (props as { checked?: boolean | null }).checked;
            if (typeof checked === "boolean") {
              return (
                <li className="my-0.5 flex items-start gap-2 list-none">
                  <input
                    type="checkbox"
                    defaultChecked={checked}
                    className="mt-1 size-3.5 shrink-0 rounded border-white/20 bg-white/[0.04] text-violet-500 focus:ring-violet-500/30"
                  />
                  <span className={checked ? "text-muted-foreground line-through" : ""}>
                    {children}
                  </span>
                </li>
              );
            }
            return (
              <li className="my-0.5 flex gap-2 list-none before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-violet-300/70">
                <span className="flex-1">{children}</span>
              </li>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-violet-500/40 bg-violet-500/[0.04] px-3 py-1.5 italic text-foreground/85">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="mt-3 mb-2 text-base font-semibold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 mb-2 text-sm font-semibold uppercase tracking-wider text-foreground/90">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 mb-1 text-sm font-semibold text-foreground/95">
              {children}
            </h3>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-foreground/90">{children}</em>
          ),
          hr: () => <hr className="my-3 border-white/[0.06]" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/[0.04] text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              {children}
            </thead>
          ),
          th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
          td: ({ children }) => (
            <td className="border-t border-white/[0.05] px-3 py-2">{children}</td>
          ),
          code({ inline, className: cls, children, ...rest }: React.HTMLAttributes<HTMLElement> & { inline?: boolean; children?: React.ReactNode }) {
            const match = /language-(\w+)/.exec(cls || "");
            const codeText = String(children ?? "").replace(/\n$/, "");

            if (inline || !match) {
              return (
                <code
                  className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[12px] text-violet-200"
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={match[1]}>{codeText}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-pulse rounded-full bg-violet-300 align-baseline"
        />
      )}
    </div>
  );
}

function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }
  return (
    <div className="group/code my-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0a13]">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {language}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-300" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "12px 14px",
          background: "transparent",
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
        codeTagProps={{
          style: { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
