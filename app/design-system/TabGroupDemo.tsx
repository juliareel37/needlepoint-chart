"use client";

import { useState } from "react";

const tabs = ["Dashboard", "Workout", "Message", "Analytics", "Profile"] as const;

export function TabGroupDemo() {
  const [active, setActive] = useState<(typeof tabs)[number]>("Message");

  return (
    <div className="ds-tab-card">
      <div className="ds-tab-group" role="tablist" aria-label="Primary sections">
        {tabs.map((tab) => {
          const selected = tab === active;

          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              className="ds-tab-group-item"
              data-active={selected ? "true" : undefined}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
