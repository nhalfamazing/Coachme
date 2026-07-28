"use client";

// Native details/summary accordion: no JS needed to read the answers
// (good for crawlers and no-JS); the client boundary exists to count
// which questions get opened. Each question reports once per page view,
// and the event carries only the question text.

import { useRef } from "react";
import { track } from "@vercel/analytics";
import { FAQ_ITEMS } from "./faq-data";

export function FaqList() {
  const opened = useRef<Set<string>>(new Set());
  const onToggle = (q: string) => (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (e.currentTarget.open && !opened.current.has(q)) {
      opened.current.add(q);
      track("faq_opened", { question: q });
    }
  };
  return (
    <div className="mk-faq body">
      {FAQ_ITEMS.map((item) => (
        <details key={item.q} onToggle={onToggle(item.q)}>
          <summary>{item.q}</summary>
          <div className="mk-faq-a">
            {item.a.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
