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
  menuStyle?: CSSProperties;
  menuWidth?: string | number;
  minWidth?: string | number;
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
}

export function SingleSelectDropdown<TItem>({
  ariaLabel,
  emptyLabel = "No options",
  getItemDisabled,
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
  menuStyle,
  menuWidth = "max-content",
  minWidth = 200,
  onValueChange,
  placeholder,
  showChevron = true,
  triggerLabel,
  triggerClassName,
  triggerStyle,
  triggerVariant = "selection",
  value,
  wrapperClassName,
  wrapperStyle,
}: SingleSelectDropdownProps<TItem>) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const selectedItem =
    items.find((item) => getItemValue(item) === value) ?? null;

  const chevronDirection =
    menuPlacement === "top-start" || menuPlacement === "top-end" ? "up" : "down";
  const triggerZIndex = menuOverlapTrigger ? 1 : undefined;
  const menuPositionStyle: CSSProperties = menuPortalToViewport
    ? {}
    : menuPlacement === "top-start" || menuPlacement === "top-end"
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
    const desiredLeft =
      menuPlacement === "top-end" || menuPlacement === "bottom-end"
        ? triggerRect.right - measuredMenuWidth
        : triggerRect.left;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - measuredMenuWidth - viewportPadding,
    );
    const left = Math.min(Math.max(desiredLeft, viewportPadding), maxLeft);
    const top =
      menuPlacement === "top-start"
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
      menuPlacement === "top-start"
        ? Math.max(triggerRect.top - menuOffset - viewportPadding, 120)
        : Math.max(window.innerHeight - triggerRect.bottom - menuOffset - viewportPadding, 120);

    setPortalStyle({
      position: "fixed",
      top,
      left,
      zIndex: 200,
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
  }, [open, menuPortalToViewport, updatePortalStyle]);

  useEffect(() => {
    if (!open || !menuPortalToViewport) {
      return;
    }

    const syncPosition = () => updatePortalStyle();

    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);

    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [open, menuPortalToViewport, updatePortalStyle]);

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
        ...menuPositionStyle,
        ...portalStyle,
        ...menuStyle,
      }}
    >
      {items.length ? (
        items.map((item) => {
          const itemValue = getItemValue(item);
          const active = itemValue === value;
          return (
            <MenuItem
              key={itemValue}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              active={active}
              disabled={getItemDisabled?.(item)}
              layout="trailing"
              trailing={<MenuTrailingCheck active={active} />}
              onClick={() => {
                onValueChange(itemValue, item);
                setOpen(false);
              }}
            >
              {getItemLabel(item)}
            </MenuItem>
          );
        })
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
    >
      <MenuTrigger
        type="button"
        variant={triggerVariant}
        open={open}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
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
