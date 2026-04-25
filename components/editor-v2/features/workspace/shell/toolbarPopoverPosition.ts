export const TOOLBAR_POPOVER_VIEWPORT_PADDING = 12;

export type ToolbarPopoverHorizontalPosition = {
  left: number | "auto";
  right: number | "auto";
  transform: string;
};

export function getToolbarPopoverMeasuredWidth(element: HTMLDivElement | null): number {
  if (!element) {
    return 0;
  }

  return Math.max(element.offsetWidth, element.scrollWidth);
}

export function getToolbarPopoverHorizontalPosition({
  align = "start",
  anchorRect,
  popoverWidth,
  viewportPadding = TOOLBAR_POPOVER_VIEWPORT_PADDING,
}: {
  align?: "start" | "center" | "end";
  anchorRect: DOMRect;
  popoverWidth: number;
  viewportPadding?: number;
}): ToolbarPopoverHorizontalPosition {
  const centeredLeft = anchorRect.left + anchorRect.width / 2;
  const startLeft = anchorRect.left - 12;
  const endLeft = anchorRect.right - popoverWidth + 12;

  if (popoverWidth <= 0 || typeof window === "undefined") {
    return {
      left: align === "center" ? centeredLeft : align === "end" ? anchorRect.right : startLeft,
      right: "auto",
      transform: align === "center" ? "translateX(-50%)" : "none",
    };
  }

  const desiredLeft =
    align === "center" ? centeredLeft - popoverWidth / 2 : align === "end" ? endLeft : startLeft;
  const desiredRight = window.innerWidth - desiredLeft - popoverWidth;

  if (desiredLeft < viewportPadding) {
    return {
      left: viewportPadding,
      right: "auto",
      transform: "none",
    };
  }

  if (desiredRight < viewportPadding) {
    return {
      left: "auto",
      right: viewportPadding,
      transform: "none",
    };
  }

  return {
    left: align === "center" ? centeredLeft : align === "end" ? endLeft : startLeft,
    right: "auto",
    transform: align === "center" ? "translateX(-50%)" : "none",
  };
}
