'use client';

import ReactMarkdown from 'react-markdown';

type Props = {
  text: string;
  streaming: boolean;
  fallback: boolean;
};

export function NarrationBlock({ text, streaming, fallback }: Props) {
  return (
    <section className="my-10 sm:my-12">
      {fallback && (
        <p className="mb-4 text-[13px] text-text-tertiary italic">
          AI narration unavailable — showing structured data only.
        </p>
      )}
      <div className="text-text-primary text-[16px] sm:text-[17px] leading-[1.7]">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold text-text-primary">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            h1: ({ children }) => (
              <h2 className="mt-6 mb-3 text-[20px] font-medium text-text-primary">{children}</h2>
            ),
            h2: ({ children }) => (
              <h3 className="mt-5 mb-2 text-[18px] font-medium text-text-primary">{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 className="mt-4 mb-2 text-[16px] font-medium text-text-primary">{children}</h4>
            ),
            ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1">{children}</ol>,
            hr: () => <hr className="my-6 border-border" />,
            a: ({ href, children }) => (
              <a href={href} className="text-accent hover:text-accent-hover underline underline-offset-2">
                {children}
              </a>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
        {streaming && (
          <span
            className="ml-1 inline-block h-[1em] w-[2px] align-text-bottom bg-text-tertiary animate-pulse"
            aria-label="streaming"
          />
        )}
      </div>
    </section>
  );
}
