"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Field } from "./Field";
import {
  MenuChevronIcon,
  MenuDivider,
  MenuItem,
  MenuSurface,
  MenuTrailingCheck,
  MenuTrigger,
  type MenuTriggerVariant,
} from "./Menu";

type SingleSelectDropdownMenuPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";

export interface SingleSelectDropdownProps<TItem> {
  ariaLabel: string;
  emptyLabel?: ReactNode;
  getItemDisabled?: (item: TItem) => boolean;
  getItemIsDivider?: (item: TItem) => boolean;
  getItemLabel: (item: TItem) => ReactNode;
  getItemValue: (item: TItem) => string;
  items: TItem[];
  label?: ReactNode;
  menuClassName?: string;
  menuMaxHeight?: number;
  menuMaxWidth?: string | number;
  menuMatchTriggerWidth?: boolean;
  menuOffset?: number;
  menuOverlapTrigger?: boolean;
  menuPlacement?: SingleSelectDropdownMenuPlacement;
  menuPortalToViewport?: boolean;
  menuShowTrailingCheck?: boolean;
  menuStyle?: CSSProperties;
  menuWidth?: string | number;
  minWidth?: string | number;
  onReachEnd?: () => void;
  onOpenChange?: (open: boolean) => void;
  onValueChange: (value: string, item: TItem) => void;
  placeholder: ReactNode;
  showChevron?: boolean;
  triggerLabel?: ReactNode;
  triggerClassName?: string;
  triggerStyle?: CSSProperties;
  triggerVariant?: MenuTriggerVariant;
  value: string;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  menuFooter?: ReactNode;
  openOnHover?: boolean;
  hoverCloseDelayMs?: number;
}

export function SingleSelectDropdown<TItem>({
  ariaLabel,
  emptyLabel = "No options",
  getItemDisabled,
  getItemIsDivider,
  getItemLabel,
  getItemValue,
  items,
  label,
  menuClassName,
  menuMaxHeight = 300,
  menuMaxWidth = "min(320px, calc(100vw - 32px))",
  menuMatchTriggerWidth = false,
  menuOffset = 4,
  menuOverlapTrigger = false,
  menuPlacement = "bottom-start",
  menuPortalToViewport = false,
  menuShowTrailingCheck = true,
  menuStyle,
  menuWidth = "max-content",
  minWidth = 200,
  onReachEnd,
  onOpenChange,
  onValueChange,
  placeholder,
  openOnHover = false,
  hoverCloseDelayMs = 120,
  showChevron = true,
  triggerLabel,
  triggerClassName,
  triggerStyle,
  triggerVariant = "selection",
  value,
  wrapperClassName,
  wrapperStyle,
  menuFooter,
}: SingleSelectDropdownProps<TItem>) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const hoverCloseTimeoutRef = useRef<number | null>(null);
  const preserveScrollAnchorRef = useRef<{
    itemCount: number;
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(
    () => () => {
      if (hoverCloseTimeoutRef.current !== null) {
        window.clearTimeout(hoverCloseTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      const clickedTrigger = Boolean(target && rootRef.current?.contains(target));
      const clickedMenu = Boolean(target && menuRef.current?.contains(target));

      if (!target || (!clickedTrigger && !clickedMenu)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const clearHoverCloseTimeout = useCallback(() => {
    if (hoverCloseTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(hoverCloseTimeoutRef.current);
    hoverCloseTimeoutRef.current = null;
  }, []);

  const scheduleHoverClose = useCallback(() => {
    if (!openOnHover) {
      return;
    }

    clearHoverCloseTimeout();
    hoverCloseTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      hoverCloseTimeoutRef.current = null;
    }, hoverCloseDelayMs);
  }, [clearHoverCloseTimeout, hoverCloseDelayMs, openOnHover]);

  const handleHoverEnter = useCallback(() => {
    if (!openOnHover) {
      return;
    }

    clearHoverCloseTimeout();
    setOpen(true);
  }, [clearHoverCloseTimeout, openOnHover]);

  const selectedItem =
    items.find((item) => getItemValue(item) === value) ?? null;
  const isTopPlacement =
    menuPlacement === "top-start" || menuPlacement === "top-end";
  const isEndPlacement =
    menuPlacement === "top-end" || menuPlacement === "bottom-end";
  const orderedItems = isTopPlacement ? [...items].reverse() : items;

  const chevronDirection =
    isTopPlacement ? "up" : "down";
  const triggerZIndex = menuOverlapTrigger ? 1 : undefined;
  const portalReady = !menuPortalToViewport || portalStyle !== null;
  const hiddenPortalMeasureStyle: CSSProperties = menuPortalToViewport
    ? {
        position: "fixed",
        top: 0,
        left: 0,
      }
    : {};
  const menuPositionStyle: CSSProperties = menuPortalToViewport
    ? {}
    : isTopPlacement
      ? {
          position: "absolute",
          bottom: menuOverlapTrigger
            ? 0
            : `calc(100% + ${menuOffset}px)`,
          left: menuPlacement === "top-start" ? 0 : "auto",
          right: menuPlacement === "top-end" ? 0 : "auto",
        }
      : {
          position: "absolute",
          top: menuOverlapTrigger ? 0 : `calc(100% + ${menuOffset}px)`,
          left: menuPlacement === "bottom-start" ? 0 : "auto",
          right: menuPlacement === "bottom-end" ? 0 : "auto",
        };

  const updatePortalStyle = useCallback(() => {
    if (!menuPortalToViewport || !rootRef.current || !menuRef.current) {
      return;
    }

    const viewportPadding = 8;
    const triggerRect = rootRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const measuredMenuWidth = menuRect.width || triggerRect.width;
    const measuredMenuHeight = menuRect.height || 0;
    const desiredLeft = triggerRect.left;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - measuredMenuWidth - viewportPadding,
    );
    const left = Math.min(Math.max(desiredLeft, viewportPadding), maxLeft);
    const right = Math.max(viewportPadding, window.innerWidth - triggerRect.right);
    const top =
      isTopPlacement
        ? Math.max(
            viewportPadding,
            triggerRect.top -
              (menuOverlapTrigger ? triggerRect.height : menuOffset) -
              measuredMenuHeight,
          )
        : Math.min(
            triggerRect.bottom + (menuOverlapTrigger ? -triggerRect.height : menuOffset),
            window.innerHeight - measuredMenuHeight - viewportPadding,
          );
    const maxHeight =
      isTopPlacement
        ? Math.max(triggerRect.top - menuOffset - viewportPadding, 120)
        : Math.max(window.innerHeight - triggerRect.bottom - menuOffset - viewportPadding, 120);

    setPortalStyle({
      position: "fixed",
      top,
      left: isEndPlacement ? "auto" : left,
      right: isEndPlacement ? right : "auto",
      zIndex: "var(--z-editor-popover)",
      width: menuMatchTriggerWidth ? triggerRect.width : menuWidth,
      minWidth: Math.max(triggerRect.width, Number(minWidth) || 0),
      maxWidth: menuMaxWidth,
      maxHeight: Math.min(menuMaxHeight, maxHeight),
      overflowY: "auto",
    });
  }, [
    menuMaxHeight,
    menuMaxWidth,
    menuMatchTriggerWidth,
    menuOffset,
    menuOverlapTrigger,
    isEndPlacement,
    menuPlacement,
    menuPortalToViewport,
    menuWidth,
    minWidth,
  ]);

  useLayoutEffect(() => {
    if (!open || !menuPortalToViewport) {
      return;
    }

    updatePortalStyle();

    const rafId = window.requestAnimationFrame(() => {
      updatePortalStyle();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [open, menuPortalToViewport, updatePortalStyle]);

  useEffect(() => {
    if (!menuPortalToViewport) {
      return;
    }

    if (!open) {
      setPortalStyle(null);
    }
  }, [menuPortalToViewport, open]);

  useLayoutEffect(() => {
    if (!open || !isTopPlacement || !menuRef.current) {
      return;
    }

    menuRef.current.scrollTop = menuRef.current.scrollHeight;
  }, [isTopPlacement, open]);

  useLayoutEffect(() => {
    if (!open || !isTopPlacement) {
      preserveScrollAnchorRef.current = null;
      return;
    }

    const anchor = preserveScrollAnchorRef.current;
    const menuElement = menuRef.current;

    if (
      !anchor ||
      !menuElement ||
      items.length <= anchor.itemCount
    ) {
      return;
    }

    const scrollHeightDelta = menuElement.scrollHeight - anchor.scrollHeight;
    menuElement.scrollTop = anchor.scrollTop + scrollHeightDelta;
    preserveScrollAnchorRef.current = null;
  }, [isTopPlacement, items.length, open]);

  useEffect(() => {
    if (!open || !menuPortalToViewport) {
      return;
    }

    const syncPosition = () => updatePortalStyle();
    const menuElement = menuRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && menuElement
        ? new ResizeObserver(() => {
            syncPosition();
          })
        : null;

    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    if (resizeObserver && menuElement) {
      resizeObserver.observe(menuElement);
    }

    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
      resizeObserver?.disconnect();
    };
  }, [open, menuPortalToViewport, updatePortalStyle]);

  const maybeLoadMore = useCallback(() => {
    const menuElement = menuRef.current;

    if (!menuElement || !onReachEnd) {
      return;
    }

    const hasOverflow = menuElement.scrollHeight > menuElement.clientHeight;
    const remainingScrollDistance =
      menuElement.scrollHeight - menuElement.scrollTop - menuElement.clientHeight;
    const reachedLoadThreshold = isTopPlacement
      ? !hasOverflow || menuElement.scrollTop <= 48
      : remainingScrollDistance <= 48;

    if (reachedLoadThreshold) {
      if (isTopPlacement) {
        preserveScrollAnchorRef.current = {
          itemCount: items.length,
          scrollHeight: menuElement.scrollHeight,
          scrollTop: menuElement.scrollTop,
        };
      }
      onReachEnd();
    }
  }, [isTopPlacement, items.length, onReachEnd]);

  useEffect(() => {
    if (!open) {
      return;
    }

    maybeLoadMore();
  }, [items.length, maybeLoadMore, open]);

  const menuContent = open ? (
    <MenuSurface
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      className={menuClassName}
      style={{
        zIndex: 10,
        width: menuMatchTriggerWidth ? "100%" : menuWidth,
        maxWidth: menuMaxWidth,
        maxHeight: menuMaxHeight,
        overflowY: "auto",
        visibility: portalReady ? "visible" : "hidden",
        pointerEvents: portalReady ? "auto" : "none",
        ...hiddenPortalMeasureStyle,
        ...menuPositionStyle,
        ...portalStyle,
        ...menuStyle,
      }}
      onScroll={maybeLoadMore}
      onPointerEnter={handleHoverEnter}
      onPointerLeave={scheduleHoverClose}
    >
      {orderedItems.length ? (
        <>
          {orderedItems.map((item) => {
            const itemValue = getItemValue(item);

            if (getItemIsDivider?.(item)) {
              return <MenuDivider key={itemValue} />;
            }

            const active = itemValue === value;
            return (
              <MenuItem
                key={itemValue}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                active={active}
                disabled={getItemDisabled?.(item)}
                layout={menuShowTrailingCheck ? "trailing" : "leading"}
                trailing={
                  menuShowTrailingCheck
                    ? <MenuTrailingCheck active={active} />
                    : undefined
                }
                onClick={() => {
                  onValueChange(itemValue, item);
                  setOpen(false);
                }}
              >
                {getItemLabel(item)}
              </MenuItem>
            );
          })}
          {menuFooter}
        </>
      ) : (
        <MenuItem type="button" disabled>
          {emptyLabel}
        </MenuItem>
      )}
    </MenuSurface>
  ) : null;

  const control = (
    <div
      ref={rootRef}
      className={wrapperClassName}
      style={{
        position: "relative",
        width: "fit-content",
        maxWidth: "100%",
        ...wrapperStyle,
      }}
      onPointerEnter={handleHoverEnter}
      onPointerLeave={scheduleHoverClose}
    >
      <MenuTrigger
        type="button"
        variant={triggerVariant}
        open={open}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={() => {
          clearHoverCloseTimeout();
          setOpen((currentOpen) => {
            if (!currentOpen && menuPortalToViewport) {
              setPortalStyle(null);
            }

            return !currentOpen;
          });
        }}
        className={triggerClassName}
        style={{
          position: "relative",
          zIndex: triggerZIndex,
          width: "100%",
          minWidth,
          maxWidth: "100%",
          ...triggerStyle,
        }}
      >
        <span>
          {triggerLabel ?? (selectedItem ? getItemLabel(selectedItem) : placeholder)}
        </span>
        {showChevron ? (
          <MenuChevronIcon open={open} direction={chevronDirection} />
        ) : null}
      </MenuTrigger>

      {!menuPortalToViewport ? menuContent : null}
    </div>
  );

  if (menuPortalToViewport && mounted && menuContent) {
    return (
      <>
        {label ? <Field label={label}>{control}</Field> : control}
        {createPortal(menuContent, document.body)}
      </>
    );
  }

  if (!label) {
    return control;
  }

  return <Field label={label}>{control}</Field>;
}
