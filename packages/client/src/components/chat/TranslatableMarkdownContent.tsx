import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { WordTranslation } from '../../types/chat.types.js';
import WordPresenter from './WordPresenter';
import MarkdownContent from './MarkdownContent';

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
          // Headings
          h1: ({ ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0" {...props} />,
          h2: ({ ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0" {...props} />,
          h3: ({ ...props }) => <h3 className="text-base font-bold mt-2 mb-1 first:mt-0" {...props} />,
          h4: ({ ...props }) => <h4 className="text-sm font-bold mt-2 mb-1 first:mt-0" {...props} />,
          h5: ({ ...props }) => <h5 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props} />,
          h6: ({ ...props }) => <h6 className="text-xs font-semibold mt-2 mb-1 first:mt-0" {...props} />,
          
          // Paragraphs - process children with WordPresenter
          p: ({ children, ...props }: { children?: React.ReactNode }) => {
            // Process text nodes in children
            const processNode = (node: React.ReactNode): React.ReactNode => {
              if (typeof node === 'string') {
                return <WordPresenter text={node} wordTranslations={wordTranslations} />;
              }
              if (Array.isArray(node)) {
                return node.map((child, idx) => (
                  <span key={idx}>{processNode(child)}</span>
                ));
              }
              if (React.isValidElement(node) && node.props.children) {
                return React.cloneElement(node as React.ReactElement, {
                  ...node.props,
                  children: processNode(node.props.children),
                });
              }
              return node;
            };
            
            return (
              <p className="mb-2 last:mb-0" {...props}>
                {processNode(children)}
              </p>
            );
          },
          
          // Lists
          ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
          li: ({ children, ...props }: { children?: React.ReactNode }) => {
            const processNode = (node: React.ReactNode): React.ReactNode => {
              if (typeof node === 'string') {
                return <WordPresenter text={node} wordTranslations={wordTranslations} />;
              }
              if (Array.isArray(node)) {
                return node.map((child, idx) => (
                  <span key={idx}>{processNode(child)}</span>
                ));
              }
              if (React.isValidElement(node) && node.props.children) {
                return React.cloneElement(node as React.ReactElement, {
                  ...node.props,
                  children: processNode(node.props.children),
                });
              }
              return node;
            };
            
            return (
              <li className="ml-2" {...props}>
                {processNode(children)}
              </li>
            );
          },
          
          // Code blocks
          pre: ({ children, ...props }: { children?: React.ReactNode }) => (
            <pre className="mb-2 p-2 rounded bg-black bg-opacity-10 overflow-x-auto" {...props}>
              {children}
            </pre>
          ),
          code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) => {
            // Don't translate code - render normally
            if (inline) {
              return <code className="px-1 py-0.5 rounded bg-black bg-opacity-10 text-xs font-mono" {...props}>{children}</code>;
            }
            return <code className="block p-2 rounded bg-black bg-opacity-10 text-xs font-mono overflow-x-auto" {...props}>{children}</code>;
          },
          
          // Blockquotes
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-opacity-30 pl-4 italic my-2" {...props} />
          ),
          
          // Links
          a: ({ ...props }) => (
            <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          
          // Images
          img: ({ ...props }) => (
            <img className="max-w-full h-auto rounded my-2" {...props} />
          ),
          
          // Horizontal rule
          hr: ({ ...props }) => <hr className="my-4 border-opacity-20" {...props} />,
          
          // Tables
          table: ({ ...props }) => (
            <table className="border-collapse border border-opacity-20 my-2 w-full" {...props} />
          ),
          thead: ({ ...props }) => <thead className="bg-black bg-opacity-10" {...props} />,
          tbody: ({ ...props }) => <tbody {...props} />,
          tr: ({ ...props }) => <tr className="border-b border-opacity-20" {...props} />,
          th: ({ ...props }) => (
            <th className="border border-opacity-20 px-2 py-1 text-xs font-semibold text-left" {...props} />
          ),
          td: ({ children, ...props }: { children?: React.ReactNode }) => {
            const processNode = (node: React.ReactNode): React.ReactNode => {
              if (typeof node === 'string') {
                return <WordPresenter text={node} wordTranslations={wordTranslations} />;
              }
              if (Array.isArray(node)) {
                return node.map((child, idx) => (
                  <span key={idx}>{processNode(child)}</span>
                ));
              }
              if (React.isValidElement(node) && node.props.children) {
                return React.cloneElement(node as React.ReactElement, {
                  ...node.props,
                  children: processNode(node.props.children),
                });
              }
              return node;
            };
            
            return (
              <td className="border border-opacity-20 px-2 py-1 text-xs" {...props}>
                {processNode(children)}
              </td>
            );
          },
          
          // Strong and emphasis
          strong: ({ children, ...props }: { children?: React.ReactNode }) => {
            const processNode = (node: React.ReactNode): React.ReactNode => {
              if (typeof node === 'string') {
                return <WordPresenter text={node} wordTranslations={wordTranslations} />;
              }
              if (Array.isArray(node)) {
                return node.map((child, idx) => (
                  <span key={idx}>{processNode(child)}</span>
                ));
              }
              if (React.isValidElement(node) && node.props.children) {
                return React.cloneElement(node as React.ReactElement, {
                  ...node.props,
                  children: processNode(node.props.children),
                });
              }
              return node;
            };
            
            return (
              <strong className="font-semibold" {...props}>
                {processNode(children)}
              </strong>
            );
          },
          em: ({ children, ...props }: { children?: React.ReactNode }) => {
            const processNode = (node: React.ReactNode): React.ReactNode => {
              if (typeof node === 'string') {
                return <WordPresenter text={node} wordTranslations={wordTranslations} />;
              }
              if (Array.isArray(node)) {
                return node.map((child, idx) => (
                  <span key={idx}>{processNode(child)}</span>
                ));
              }
              if (React.isValidElement(node) && node.props.children) {
                return React.cloneElement(node as React.ReactElement, {
                  ...node.props,
                  children: processNode(node.props.children),
                });
              }
              return node;
            };
            
            return (
              <em className="italic" {...props}>
                {processNode(children)}
              </em>
            );
          },
          
          // Text nodes - process with WordPresenter for word translations
          text: textComponent,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
