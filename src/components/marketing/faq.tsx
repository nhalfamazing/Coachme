"use client";

// Native details/summary accordion: no JS needed to read the answers
// (good for crawlers and no-JS), client component only so we can count
// opens later without re-architecting.

import { FAQ_ITEMS } from "./faq-data";

export function FaqList() {
  return (
    <div className="mk-faq body">
      {FAQ_ITEMS.map((item) => (
        <details key={item.q}>
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
