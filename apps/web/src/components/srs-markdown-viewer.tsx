'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SrsMarkdownViewerProps {
  content: string;
  className?: string;
}

export function SrsMarkdownViewer({
  content,
  className,
}: SrsMarkdownViewerProps) {
  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1 prose-li:my-0 ${className ?? ''}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
