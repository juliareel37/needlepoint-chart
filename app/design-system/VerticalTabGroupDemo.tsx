"use client";

import { useState } from "react";
import { assetPath } from "../../lib/assetPath";

const tabs = [
  { label: "Overview", icon: "icons/grid_view.svg" },
  { label: "Projects", icon: "icons/file.svg" },
  { label: "Messages", icon: "icons/thread.svg" },
  { label: "Analytics", icon: "icons/ruler.svg" },
  { label: "Settings", icon: "icons/settings.svg" },
] as const;

export function VerticalTabGroupDemo() {
  const [active, setActive] = useState<(typeof tabs)[number]["label"]>("Messages");

  return (
    <div className="ds-vertical-tab-card">
      <div className="ds-vertical-tab-group" role="tablist" aria-label="Sidebar navigation">
        {tabs.map((tab) => {
          const selected = tab.label === active;

          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={selected}
              className="ds-vertical-tab-group-item"
              data-active={selected ? "true" : undefined}
              onClick={() => setActive(tab.label)}
            >
              <span
                className="ds-vertical-tab-icon"
                aria-hidden="true"
                style={{
                  WebkitMaskImage: `url(${assetPath(tab.icon)})`,
                  maskImage: `url(${assetPath(tab.icon)})`,
                }}
              />
              <span className="ds-vertical-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
