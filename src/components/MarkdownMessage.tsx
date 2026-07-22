"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { markdownSanitizeSchema, safeMarkdownUrl } from "@/lib/markdown";
import type { Theme } from "@/lib/theme";

interface MarkdownMessageProps {
  content: string;
  theme: Theme;
}

export function MarkdownMessage({ content, theme }: MarkdownMessageProps) {
  return (
    <div className="cozy-markdown" style={{ color: "inherit" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
        urlTransform={safeMarkdownUrl}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{ color: theme.accentDark, fontWeight: 800 }}
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => (
            <code className={className} style={{ background: theme.inputBg, border: `1px solid ${theme.borderColor}` }}>
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeftColor: theme.accentBg, color: theme.textSecondary }}>
              {children}
            </blockquote>
          ),
          th: ({ children }) => (
            <th style={{ borderColor: theme.borderColor, background: theme.inputBg }}>{children}</th>
          ),
          td: ({ children }) => <td style={{ borderColor: theme.borderColor }}>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
