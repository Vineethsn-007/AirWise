import { Fragment } from 'react';

/** Renders model text as React text nodes only. No HTML is ever interpreted. */
export function PlainText({ text }: { text: string }) {
  return (
    <div className="space-y-3 leading-relaxed text-sky-deep">
      {text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <Fragment key={index}>
            <p>{paragraph.replace(/^(HEADLINE|NARRATIVE|ACTION):\s*/gm, '')}</p>
          </Fragment>
        ))}
    </div>
  );
}
