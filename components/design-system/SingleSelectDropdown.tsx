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
} from "./Menu";

export interface SingleSelectDropdownProps<TItem> {
  ariaLabel: string;
  emptyLabel?: ReactNode;
  getItemDisabled?: (item: TItem) => boolean;
  getItemLabel: (item: TItem) => ReactNode;
  getItemValue: (item: TItem) => string;
  items: TItem[];
  label?: ReactNode;
  menuMaxHeight?: number;
  menuMaxWidth?: string | number;
  menuWidth?: string | number;
  minWidth?: string | number;
  onValueChange: (value: string, item: TItem) => void;
  placeholder: ReactNode;
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
  menuMaxHeight = 280,
  menuMaxWidth = "min(320px, 100%)",
  menuWidth = "max-content",
  minWidth = 240,
  onValueChange,
  placeholder,
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
        variant="selection"
        open={open}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        style={{ width: "100%", minWidth, maxWidth: "100%" }}
      >
        <span>{selectedItem ? getItemLabel(selectedItem) : placeholder}</span>
        <MenuChevronIcon open={open} />
      </MenuTrigger>

      {open ? (
        <MenuSurface
          role="menu"
          aria-label={ariaLabel}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 10,
            width: menuWidth,
            maxWidth: menuMaxWidth,
            maxHeight: menuMaxHeight,
            overflowY: "auto",
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
