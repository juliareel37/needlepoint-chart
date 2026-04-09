"use client";

import Link from "next/link";
import { VerticalTabGroup } from "@/components/design-system";
import type { EditorSidebarSection } from "@/lib/editor-v2/editor/store";
import styles from "./EditorV2Shell.module.css";

interface EditorRailProps {
  activeSection: EditorSidebarSection;
  panelCollapsed: boolean;
  onSelectSection: (section: EditorSidebarSection) => void;
}

const railItems: Array<{ id: EditorSidebarSection; label: string; icon: string }> = [
  { id: "document", label: "Document", icon: "/icons/lucide/file.svg" },
  { id: "color", label: "Color", icon: "/icons/lucide/palette.svg" },
  { id: "trace", label: "Trace", icon: "/icons/lucide/image.svg" },
];

export function EditorRail({
  activeSection,
  panelCollapsed,
  onSelectSection,
}: EditorRailProps) {
  return (
    <aside className={styles.rail} aria-label="Editor sections">
      <div className={styles.railSurface}>
        <Link href="/editor-v2/design-system" className={styles.tempDsLink}>
          V2 DS
        </Link>

        <nav className={styles.railNav}>
          <VerticalTabGroup
            activeId={panelCollapsed ? "" : activeSection}
            ariaLabel="Sidebar navigation"
            className={styles.railTabs}
            iconOnly
            items={railItems}
            onChange={(id) => onSelectSection(id as EditorSidebarSection)}
          />
        </nav>
      </div>
    </aside>
  );
}
