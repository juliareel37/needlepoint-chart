"use client";

import { VerticalTabGroup } from "@/components/design-system";
import type { EditorSidebarSection } from "@/lib/editor-v2/editor/store";
import styles from "./EditorV2Shell.module.css";

interface EditorRailProps {
  activeSection: EditorSidebarSection;
  hideDocumentItem?: boolean;
  panelCollapsed: boolean;
  onSelectSection: (section: EditorSidebarSection) => void;
}

const railItems: Array<{ id: EditorSidebarSection; label: string; icon: string }> = [
  { id: "document", label: "Document", icon: "/icons/lucide/file.svg" },
  { id: "color", label: "Color", icon: "/icons/lucide/palette.svg" },
  { id: "trace", label: "Trace", icon: "/icons/lucide/image.svg" },
  { id: "text", label: "Text", icon: "/icons/lucide/type-outline.svg" },
  { id: "icons", label: "Icons", icon: "/icons/lucide/shapes-icon.svg" },
  { id: "settings", label: "Settings", icon: "/icons/lucide/settings.svg" },
];

const railItemsWithoutDocument: Array<{ id: EditorSidebarSection; label: string; icon: string }> = [
  // { id: "document", label: "Document", icon: "/icons/lucide/file.svg" },
  { id: "color", label: "Color", icon: "/icons/lucide/palette.svg" },
  { id: "trace", label: "Trace", icon: "/icons/lucide/image.svg" },
  { id: "text", label: "Text", icon: "/icons/lucide/type-outline.svg" },
  { id: "icons", label: "Icons", icon: "/icons/lucide/shapes-icon.svg" },
  { id: "settings", label: "Settings", icon: "/icons/lucide/settings.svg" },
];

export function EditorRail({
  activeSection,
  hideDocumentItem = false,
  panelCollapsed,
  onSelectSection,
}: EditorRailProps) {
  const visibleRailItems = hideDocumentItem ? railItemsWithoutDocument : railItems;

  return (
    <aside className={styles.rail} aria-label="Editor sections">
      <div className={styles.railSurface}>
        <nav className={styles.railNav}>
          <VerticalTabGroup
            activeId={panelCollapsed ? "" : activeSection}
            ariaLabel="Sidebar navigation"
            className={styles.railTabs}
            iconOnly
            items={visibleRailItems}
            onChange={(id) => onSelectSection(id as EditorSidebarSection)}
          />
        </nav>
      </div>
    </aside>
  );
}
