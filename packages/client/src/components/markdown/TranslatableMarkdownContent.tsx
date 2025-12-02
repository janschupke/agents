import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { WordTranslation } from '../../types/chat.types.js';
import WordPresenter from '../translation/WordPresenter';
import MarkdownContent from './MarkdownContent';
import { createMarkdownComponents } from './markdown-components';

interface TranslatableMarkdownContentProps {
  content: string;
  wordTranslations?: WordTranslation[];
  className?: string;
}

/**
 * Markdown content component that supports word-level translations
 * Renders markdown while wrapping translatable words with tooltips
 */
export default function TranslatableMarkdownContent({
  content,
  wordTranslations = [],
  className = '',
}: TranslatableMarkdownContentProps) {

  // If no translations, use regular markdown
  if (wordTranslations.length === 0) {
    return <MarkdownContent content={content} className={className} />;
  }

  // Custom text processor that wraps text with WordPresenter
  const processTextNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string' && node.trim().length > 0) {
      return <WordPresenter text={node} wordTranslations={wordTranslations} />;
    }
    return node;
  };

  // Custom text component that processes text nodes
  // ReactMarkdown v8+ uses 'value' prop for text nodes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textComponent = (props: any) => {
    const value = props.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      return <WordPresenter text={value} wordTranslations={wordTranslations} />;
    }
    return <>{value}</>;
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          ...createMarkdownComponents(processTextNode),
          // Text nodes - process with WordPresenter for word translations
          text: textComponent,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
