import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-2 mb-1 first:mt-0" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-sm font-bold mt-2 mb-1 first:mt-0" {...props} />,
          h5: ({ node, ...props }) => <h5 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props} />,
          h6: ({ node, ...props }) => <h6 className="text-xs font-semibold mt-2 mb-1 first:mt-0" {...props} />,
          
          // Paragraphs
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          
          // Lists
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="ml-2" {...props} />,
          
          // Code blocks - pre wraps code for code blocks
          pre: ({ node, children, ...props }: any) => (
            <pre className="mb-2 p-2 rounded bg-black bg-opacity-10 overflow-x-auto" {...props}>
              {children}
            </pre>
          ),
          // Code - inline code vs code blocks
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            
            if (isInline) {
              return (
                <code className="px-1 py-0.5 rounded bg-black bg-opacity-10 text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            }
            
            // Code block - styled by pre, just need to ensure proper display
            return (
              <code className={`block text-xs font-mono whitespace-pre ${className || ''}`} {...props}>
                {children}
              </code>
            );
          },
          
          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-opacity-30 pl-3 py-1 my-2 italic opacity-80" {...props} />
          ),
          
          // Links
          a: ({ node, ...props }) => (
            <a className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          
          // Horizontal rule
          hr: ({ node, ...props }) => <hr className="my-3 border-opacity-30" {...props} />,
          
          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table className="border-collapse border border-opacity-20 min-w-full" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-black bg-opacity-10" {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr className="border-b border-opacity-20" {...props} />,
          th: ({ node, ...props }) => (
            <th className="border border-opacity-20 px-2 py-1 text-left font-semibold text-xs" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-opacity-20 px-2 py-1 text-xs" {...props} />
          ),
          
          // Strong and emphasis
          strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
