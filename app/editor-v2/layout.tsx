import type { ReactNode } from "react";
import "./editor-v2.css";

export default function EditorV2Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="editor-v2-route-shell">{children}</div>;
}
