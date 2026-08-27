import { memo } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const SAFE_HREF_RE = /^(https?|mailto):/i;

const componentes: Components = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 text-[13px] leading-relaxed text-ink last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-pine">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mb-1.5 mt-3 font-serif text-base font-semibold text-ink first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mb-1.5 mt-3 font-serif text-[15px] font-semibold text-ink first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-1.5 mt-2.5 font-serif text-sm font-semibold text-ink first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: ReactNode }) => (
    <h4 className="mb-1.5 mt-2.5 text-sm font-semibold text-ink first:mt-0">
      {children}
    </h4>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 marker:text-brass last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 marker:text-brass last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="text-[13px] leading-relaxed text-ink">{children}</li>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="mb-2 border-l-2 border-brass/50 pl-3 text-[13px] italic text-ink-soft last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({
    children,
    className,
    ...props
  }: {
    children?: ReactNode;
    className?: string;
  }) => {
    const isFenced = className?.startsWith("language-");
    if (isFenced) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-ivory-200 px-1 py-0.5 font-mono text-xs text-ink">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg border border-hairline bg-ivory-50 p-2.5 last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="bg-ivory-200">{children}</thead>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border border-hairline px-2 py-1 text-left font-semibold text-pine">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border border-hairline px-2 py-1 align-top text-ink">
      {children}
    </td>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) => {
    const safeHref = href && SAFE_HREF_RE.test(href) ? href : undefined;
    if (!safeHref) {
      return (
        <span className="text-ink underline underline-offset-2">{children}</span>
      );
    }
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cialco-600 underline underline-offset-2 hover:text-cialco-500"
      >
        {children}
      </a>
    );
  },
  hr: () => <hr className="my-3 border-hairline" />,
};

interface MarkdownProps {
  children: string;
}

export const Markdown = memo(function Markdown({ children }: MarkdownProps) {
  return (
    <div className="min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
        {children}
      </ReactMarkdown>
    </div>
  );
});
