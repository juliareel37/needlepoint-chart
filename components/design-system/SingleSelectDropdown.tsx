"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Field } from "./Field";
import {
  MenuChevronIcon,
  MenuItem,
  MenuSurface,
  MenuTrailingCheck,
  MenuTrigger,
  type MenuTriggerVariant,
} from "./Menu";

type SingleSelectDropdownMenuPlacement = "bottom-start" | "top-start";

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
  menuOffset?: number;
  menuOverlapTrigger?: boolean;
  menuPlacement?: SingleSelectDropdownMenuPlacement;
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
  menuOffset = 4,
  menuOverlapTrigger = false,
  menuPlacement = "bottom-start",
  menuStyle,
  menuWidth = "max-content",
  minWidth = 240,
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
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectedItem =
    items.find((item) => getItemValue(item) === value) ?? null;

  const chevronDirection = menuPlacement === "top-start" ? "up" : "down";
  const triggerZIndex = menuOverlapTrigger ? 1 : undefined;
  const menuPositionStyle: CSSProperties =
    menuPlacement === "top-start"
      ? {
          bottom: menuOverlapTrigger
            ? 0
            : `calc(100% + ${menuOffset}px)`,
          left: 0,
        }
      : {
          top: menuOverlapTrigger ? 0 : `calc(100% + ${menuOffset}px)`,
          left: 0,
        };

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

      {open ? (
        <MenuSurface
          role="menu"
          aria-label={ariaLabel}
          className={menuClassName}
          style={{
            position: "absolute",
            zIndex: 10,
            width: menuWidth,
            maxWidth: menuMaxWidth,
            maxHeight: menuMaxHeight,
            overflowY: "auto",
            ...menuPositionStyle,
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
      ) : null}
    </div>
  );

  if (!label) {
    return control;
  }

  return <Field label={label}>{control}</Field>;
}
