import React from 'react';
import type { Components } from 'react-markdown';

/**
 * Shared markdown component configurations
 * Used by both MarkdownContent and TranslatableMarkdownContent
 */
export const createMarkdownComponents = (
  processTextNode?: (node: React.ReactNode) => React.ReactNode
): Components => {
  const processNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      return processTextNode ? processTextNode(node) : node;
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

  return {
    // Headings
    h1: ({ ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0" {...props} />,
    h2: ({ ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0" {...props} />,
    h3: ({ ...props }) => <h3 className="text-base font-bold mt-2 mb-1 first:mt-0" {...props} />,
    h4: ({ ...props }) => <h4 className="text-sm font-bold mt-2 mb-1 first:mt-0" {...props} />,
    h5: ({ ...props }) => <h5 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props} />,
    h6: ({ ...props }) => <h6 className="text-xs font-semibold mt-2 mb-1 first:mt-0" {...props} />,
    
    // Paragraphs
    p: ({ children, ...props }: { children?: React.ReactNode }) => {
      if (processTextNode) {
        return (
          <p className="mb-2 last:mb-0" {...props}>
            {processNode(children)}
          </p>
        );
      }
      return <p className="mb-2 last:mb-0" {...props}>{children}</p>;
    },
    
    // Lists
    ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
    li: ({ children, ...props }: { children?: React.ReactNode }) => {
      if (processTextNode) {
        return (
          <li className="ml-2" {...props}>
            {processNode(children)}
          </li>
        );
      }
      return <li className="ml-2" {...props}>{children}</li>;
    },
    
    // Code blocks
    pre: ({ children, ...props }: { children?: React.ReactNode }) => (
      <pre className="mb-2 p-2 rounded bg-black bg-opacity-10 overflow-x-auto" {...props}>
        {children}
      </pre>
    ),
    code: ({ className, children, inline, ...props }: { className?: string; children?: React.ReactNode; inline?: boolean }) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = inline !== undefined ? inline : !match;
      
      if (isInline) {
        return (
          <code className="px-1 py-0.5 rounded bg-black bg-opacity-10 text-xs font-mono" {...(props as React.HTMLAttributes<HTMLElement>)}>
            {children}
          </code>
        );
      }
      
      // Code block
      return (
        <code className={`block text-xs font-mono whitespace-pre ${className || ''}`} {...(props as React.HTMLAttributes<HTMLElement>)}>
          {children}
        </code>
      );
    },
    
    // Blockquotes
    blockquote: ({ ...props }) => (
      <blockquote className="border-l-4 border-opacity-30 pl-3 py-1 my-2 italic opacity-80" {...props} />
    ),
    
    // Links
    a: ({ ...props }) => (
      <a className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />
    ),
    
    // Images
    img: ({ ...props }) => (
      <img className="max-w-full h-auto rounded my-2" {...props} />
    ),
    
    // Horizontal rule
    hr: ({ ...props }) => <hr className="my-3 border-opacity-30" {...props} />,
    
    // Tables
    table: ({ ...props }) => (
      <div className="overflow-x-auto my-2">
        <table className="border-collapse border border-opacity-20 min-w-full" {...props} />
      </div>
    ),
    thead: ({ ...props }) => <thead className="bg-black bg-opacity-10" {...props} />,
    tbody: ({ ...props }) => <tbody {...props} />,
    tr: ({ ...props }) => <tr className="border-b border-opacity-20" {...props} />,
    th: ({ ...props }) => (
      <th className="border border-opacity-20 px-2 py-1 text-left font-semibold text-xs" {...props} />
    ),
    td: ({ children, ...props }: { children?: React.ReactNode }) => {
      if (processTextNode) {
        return (
          <td className="border border-opacity-20 px-2 py-1 text-xs" {...props}>
            {processNode(children)}
          </td>
        );
      }
      return <td className="border border-opacity-20 px-2 py-1 text-xs" {...props}>{children}</td>;
    },
    
    // Strong and emphasis
    strong: ({ children, ...props }: { children?: React.ReactNode }) => {
      if (processTextNode) {
        return (
          <strong className="font-semibold" {...props}>
            {processNode(children)}
          </strong>
        );
      }
      return <strong className="font-semibold" {...props}>{children}</strong>;
    },
    em: ({ children, ...props }: { children?: React.ReactNode }) => {
      if (processTextNode) {
        return (
          <em className="italic" {...props}>
            {processNode(children)}
          </em>
        );
      }
      return <em className="italic" {...props}>{children}</em>;
    },
  };
};
