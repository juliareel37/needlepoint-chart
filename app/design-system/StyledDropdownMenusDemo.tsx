"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { space } from "./spacing";
import { typographyStyles } from "./typography";

const triggerDropdownStyle: CSSProperties = {
  width: "100%",
  padding: `${space[8]} ${space[12]}`,
  border: "1px solid var(--ui-border-subtle)",
  background: "var(--card-bg)",
  color: "var(--foreground)",
  borderRadius: 8,
  ...typographyStyles.p2,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space[8],
  cursor: "pointer",
  filter: "none",
};

const triggerDropupStyle: CSSProperties = {
  padding: `${space[8]} ${space[12]}`,
  border: "none",
  background: "var(--card-bg)",
  color: "var(--foreground)",
  borderRadius: 8,
  ...typographyStyles.p2,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space[8],
  cursor: "pointer",
  minWidth: 146,
  filter: "none",
};

const triggerSelectionStyle: CSSProperties = {
  width: "fit-content",
  minWidth: 176,
  minHeight: 32,
  padding: `${space[8]} ${space[12]}`,
  border: "1px solid var(--ui-border-subtle)",
  background: "var(--card-bg)",
  boxShadow: "var(--ui-shadow-sm)",
  color: "var(--foreground)",
  borderRadius: 8,
  ...typographyStyles.p2,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space[8],
  cursor: "pointer",
  filter: "none",
};

const menuSurfaceStyle: CSSProperties = {
  width: 172,
  minWidth: 172,
  borderRadius: 16,
  border: "none",
  background: "var(--card-bg)",
  boxShadow: "var(--ui-shadow-lg)",
  backdropFilter: "blur(10px)",
  padding: space[8],
  display: "grid",
  gap: space[4],
};

const menuItemBaseStyle: CSSProperties = {
  padding: `${space[8]} ${space[12]}`,
  borderRadius: 12,
  border: "none",
  textAlign: "left",
  ...typographyStyles.p2,
  cursor: "pointer",
  filter: "none",
};

type DemoProps = {
  labelledBy?: string;
};

function MenuRadioIcon({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 18,
        height: 18,
        borderRadius: 999,
        border: `1px solid ${checked ? "var(--brand-primary)" : "var(--ui-border)"}`,
        background: "var(--surface-card)",
        display: "inline-grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: checked ? "var(--brand-primary)" : "transparent",
        }}
      />
    </span>
  );
}

function MenuCheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        border: `1px solid ${checked ? "var(--brand-primary)" : "var(--ui-border)"}`,
        background: checked ? "var(--brand-primary)" : "var(--surface-card)",
        display: "inline-grid",
        placeItems: "center",
        flex: "0 0 auto",
        color: "var(--neutral-0)",
      }}
    >
      <span className="ds-s" style={{ opacity: checked ? 1 : 0 }}>✓</span>
    </span>
  );
}

function MenuLeadingIcon({ kind }: { kind: "layers" | "search" | "spark" }) {
  if (kind === "layers") {
    return (
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        style={{ color: "var(--text-secondary)", flex: "0 0 auto" }}
      >
        <path
          d="M8 3 12.5 5.5 8 8 3.5 5.5 8 3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 8 8 10.5 12.5 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 10.5 8 13l4.5-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "search") {
    return (
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        style={{ color: "var(--text-secondary)", flex: "0 0 auto" }}
      >
        <circle cx="7" cy="7" r="3.75" fill="none" stroke="currentColor" strokeWidth="1.25" />
        <path d="m10 10 2.75 2.75" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      style={{ color: "var(--text-secondary)", flex: "0 0 auto" }}
    >
      <path
        d="m8 2.75 1.45 2.95 3.25.48-2.35 2.29.55 3.23L8 10.18 5.1 11.7l.55-3.23L3.3 6.18l3.25-.48Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuCaretIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      style={{ color: "var(--text-secondary)", flex: "0 0 auto" }}
    >
      <path
        d="M6.25 3.5 10.75 8l-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      style={{ color: "var(--text-secondary)", flex: "0 0 auto" }}
    >
      <path
        d={open ? "M3.5 10 8 5.5 12.5 10" : "M3.5 6 8 10.5 12.5 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuPanelVariantsDemo() {
  return (
    <div style={{ display: "grid", gap: space[44], width: "max-content", maxWidth: "100%" }}>
      <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "max-content", gap: space[44], width: "max-content" }}>
      <div role="menu" aria-label="Plain action menu panel" style={{ ...menuSurfaceStyle, width: "max-content", alignSelf: "start", boxShadow: "var(--ui-shadow-md)" }}>
        {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => {
          const selected = index === 0;
          return (
            <div
              key={`${option}-${index}`}
              style={{
                display: "grid",
                gap: index === 1 ? space[4] : "0px",
              }}
            >
              <button
                type="button"
                role="menuitem"
                aria-current={selected ? "true" : undefined}
                className="ds-menu-item-demo"
                onMouseEnter={(event) => {
                  if (!selected) event.currentTarget.style.background = "var(--surface-app)";
                }}
                onMouseLeave={(event) => {
                  if (!selected) event.currentTarget.style.background = "transparent";
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: selected ? "var(--surface-app)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <span>{option}</span>
              </button>
              {index === 1 ? (
                <div
                  aria-hidden="true"
                  style={{
                    height: 1,
                    margin: `0 ${space[4]}`,
                    background: "var(--ui-border-subtle)",
                    opacity: 0.6,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div role="menu" aria-label="Icon leading menu panel" style={{ ...menuSurfaceStyle, width: "max-content", alignSelf: "start", boxShadow: "var(--ui-shadow-md)" }}>
        {[
          { label: "Menu Item", icon: "layers" as const },
          { label: "Menu Item With Longer Content", icon: "search" as const },
          { label: "Menu Item", icon: "spark" as const },
        ].map((option, index) => {
          const selected = index === 1;
          return (
            <button
              key={`${option.label}-${index}`}
              type="button"
              role="menuitem"
              aria-current={selected ? "true" : undefined}
              className="ds-menu-item-demo"
              onMouseEnter={(event) => {
                if (!selected) event.currentTarget.style.background = "var(--surface-app)";
              }}
              onMouseLeave={(event) => {
                if (!selected) event.currentTarget.style.background = "transparent";
              }}
              style={{
                ...menuItemBaseStyle,
                background: selected ? "var(--surface-app)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: space[8],
              }}
            >
              <MenuLeadingIcon kind={option.icon} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ position: "relative", width: "max-content", alignSelf: "start" }}>
        <div role="menu" aria-label="Submenu trigger panel" style={{ ...menuSurfaceStyle, width: "max-content", boxShadow: "var(--ui-shadow-md)" }}>
          {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => {
            const selected = index === 1;
            return (
              <button
                key={`${option}-${index}`}
                type="button"
                role="menuitem"
                aria-current={selected ? "true" : undefined}
                className="ds-menu-item-demo"
                onMouseEnter={(event) => {
                  if (!selected) event.currentTarget.style.background = "var(--surface-app)";
                }}
                onMouseLeave={(event) => {
                  if (!selected) event.currentTarget.style.background = "transparent";
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: selected ? "var(--surface-app)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: space[24],
                }}
              >
                <span>{option}</span>
                <MenuCaretIcon />
              </button>
            );
          })}
        </div>

        <div
          role="menu"
          aria-label="Submenu panel"
          style={{
            ...menuSurfaceStyle,
            position: "absolute",
            top: `calc(${space[8]} + ${space[32]} + ${space[4]})`,
            left: `calc(100% + ${space[8]})`,
            width: "max-content",
            boxShadow: "var(--ui-shadow-md)",
            zIndex: 1,
          }}
        >
          {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => {
            const selected = index === 1;
            return (
              <button
                key={`submenu-${option}-${index}`}
                type="button"
                role="menuitem"
                aria-current={selected ? "true" : undefined}
                className="ds-menu-item-demo"
                onMouseEnter={(event) => {
                  if (!selected) event.currentTarget.style.background = "var(--surface-app)";
                }}
                onMouseLeave={(event) => {
                  if (!selected) event.currentTarget.style.background = "transparent";
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: selected ? "var(--surface-app)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "max-content", gap: space[44], width: "max-content" }}>
      <div role="listbox" aria-label="Selection menu panel" style={{ ...menuSurfaceStyle, width: "max-content", alignSelf: "start", boxShadow: "var(--ui-shadow-md)" }}>
        {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => {
          const active = index === 1;
          return (
            <button
              key={`${option}-${index}`}
              type="button"
              role="option"
              aria-selected={active}
              className="ds-menu-item-demo"
              onMouseEnter={(event) => {
                if (!active) event.currentTarget.style.background = "var(--surface-app)";
              }}
              onMouseLeave={(event) => {
                if (!active) event.currentTarget.style.background = "transparent";
              }}
              style={{
                ...menuItemBaseStyle,
                background: active ? "var(--surface-app)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: space[24],
              }}
            >
              <span>{option}</span>
              <span aria-hidden="true" className="ds-s" style={{ opacity: active ? 0.9 : 0 }}>✓</span>
            </button>
          );
        })}
      </div>

      <div role="menu" aria-label="Radio selection menu panel" style={{ ...menuSurfaceStyle, width: "max-content", alignSelf: "start", boxShadow: "var(--ui-shadow-md)" }}>
        {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => {
          const selected = index === 1;
          return (
            <button
              key={`${option}-${index}`}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              className="ds-menu-item-demo"
              onMouseEnter={(event) => {
                if (!selected) event.currentTarget.style.background = "var(--surface-app)";
              }}
              onMouseLeave={(event) => {
                if (!selected) event.currentTarget.style.background = "transparent";
              }}
              style={{
                ...menuItemBaseStyle,
                background: selected ? "var(--surface-app)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: space[8],
              }}
            >
              <MenuRadioIcon checked={selected} />
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      <div role="menu" aria-label="Checkbox selection menu panel" style={{ ...menuSurfaceStyle, width: "max-content", alignSelf: "start", boxShadow: "var(--ui-shadow-md)" }}>
        {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => {
          const selected = index !== 1;
          return (
            <button
              key={`${option}-${index}`}
              type="button"
              role="menuitemcheckbox"
              aria-checked={selected}
              className="ds-menu-item-demo"
              onMouseEnter={(event) => {
                if (!selected) event.currentTarget.style.background = "var(--surface-app)";
              }}
              onMouseLeave={(event) => {
                if (!selected) event.currentTarget.style.background = "transparent";
              }}
              style={{
                ...menuItemBaseStyle,
                background: selected ? "var(--surface-app)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: space[8],
              }}
            >
              <MenuCheckboxIcon checked={selected} />
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}

export function FinalComposedMenuDemo({ labelledBy }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [activeParentIndex, setActiveParentIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const parentItems = [
    { label: "Menu Item", icon: "layers" as const },
    { label: "Menu Item", icon: "search" as const },
    { label: "Menu Item", icon: "spark" as const },
  ];

  const submenuTopOffset = activeParentIndex === null ? null : 4 + 8 + activeParentIndex * (32 + 4) - 4;

  return (
    <div ref={rootRef} style={{ position: "relative", width: "max-content", alignSelf: "start", paddingBottom: space[4] }}>
      <button
        type="button"
        className="ds-btn ds-btn-ghost ds-btn-md ds-menu-trigger-demo"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-labelledby={labelledBy}
        data-active={open ? "true" : undefined}
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (!next) {
              setActiveParentIndex(null);
            }
            return next;
          });
        }}
        style={{
          ...typographyStyles.p2,
          width: "fit-content",
          minHeight: 32,
          padding: `${space[8]} ${space[12]}`,
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space[8],
          cursor: "pointer",
          filter: "none",
        }}
      >
        <span>Trigger button</span>
      </button>

      {open ? (
        <div
          style={{
            position: "absolute",
            top: `calc(100% + ${space[4]})`,
            left: 0,
            width: "max-content",
            zIndex: 2,
          }}
          onMouseLeave={() => setActiveParentIndex(null)}
        >
          <div
            role="menu"
            aria-label="Composed menu"
            style={{
              ...menuSurfaceStyle,
              position: "relative",
              width: "max-content",
              boxShadow: "var(--ui-shadow-md)",
            }}
          >
            {parentItems.map((option, index) => {
              const expanded = index === activeParentIndex;
              return (
                <div
                  key={`composed-${option.label}-${index}`}
                  style={{
                    display: "grid",
                    gap: index === 1 ? space[4] : "0px",
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    aria-haspopup="menu"
                    aria-expanded={expanded}
                    className="ds-menu-item-demo"
                    onMouseEnter={(event) => {
                      setActiveParentIndex(index);
                      if (!expanded) event.currentTarget.style.background = "var(--surface-app)";
                    }}
                    onMouseLeave={(event) => {
                      if (!expanded) event.currentTarget.style.background = "transparent";
                    }}
                    style={{
                      ...menuItemBaseStyle,
                      background: expanded ? "var(--surface-app)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: space[24],
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: space[8] }}>
                      <MenuLeadingIcon kind={option.icon} />
                      <span>{option.label}</span>
                    </span>
                    <MenuCaretIcon />
                  </button>
                  {index === 1 ? (
                    <div
                      aria-hidden="true"
                      style={{
                        height: 1,
                        margin: `0 ${space[4]}`,
                        background: "var(--ui-border-subtle)",
                        opacity: 0.6,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}

            {submenuTopOffset !== null ? (
              <>
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: `${submenuTopOffset}px`,
                    left: "100%",
                    width: space[8],
                    height: `calc(${space[8]} + (${space[32]} * 3) + (${space[4]} * 2))`,
                    zIndex: 2,
                  }}
                />
                <div
                  role="menu"
                  aria-label="Composed submenu"
                  style={{
                    ...menuSurfaceStyle,
                    position: "absolute",
                    top: `${submenuTopOffset}px`,
                    left: `calc(100% + ${space[8]})`,
                    width: "max-content",
                    boxShadow: "var(--ui-shadow-md)",
                    zIndex: 3,
                  }}
                >
                  {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => (
                    <button
                      key={`composed-submenu-${option}-${index}`}
                      type="button"
                      role="menuitem"
                      className="ds-menu-item-demo"
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = "var(--surface-app)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = "transparent";
                      }}
                      onClick={() => {
                        setOpen(false);
                        setActiveParentIndex(null);
                      }}
                      style={{
                        ...menuItemBaseStyle,
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SelectionDropdownDemo({ labelledBy }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", width: "fit-content", alignSelf: "start" }}>
      <button
        type="button"
        className="ds-menu-trigger-demo"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-labelledby={labelledBy}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        style={{
          ...triggerSelectionStyle,
          borderColor: open || triggerHovered ? "var(--brand-primary)" : "var(--ui-border-subtle)",
          boxShadow: open ? "var(--ui-shadow-sm), 0 0 0 2px var(--surface-brand-subtle)" : "var(--ui-shadow-sm)",
        }}
      >
        <span style={selectedIndex === null ? { color: "var(--text-secondary)", opacity: 0.72 } : undefined}>
          {selectedIndex === null ? "Select an option" : "Menu Item"}
        </span>
        <MenuChevronIcon open={open} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Selection dropdown"
          style={{
            ...menuSurfaceStyle,
            position: "absolute",
            top: `calc(100% + ${space[4]})`,
            left: 0,
            width: "max-content",
            boxShadow: "var(--ui-shadow-md)",
            zIndex: 6,
          }}
        >
          {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => {
            const selectedOption = index === selectedIndex;
            return (
              <button
                key={`selection-${option}-${index}`}
                type="button"
                role="menuitemradio"
                aria-checked={selectedOption}
                className="ds-menu-item-demo"
                onMouseEnter={(event) => {
                  if (!selectedOption) event.currentTarget.style.background = "var(--surface-app)";
                }}
                onMouseLeave={(event) => {
                  if (!selectedOption) event.currentTarget.style.background = "transparent";
                }}
                onClick={() => {
                  setSelectedIndex(index);
                  setOpen(false);
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: selectedOption ? "var(--surface-app)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: space[8],
                }}
              >
                <MenuRadioIcon checked={selectedOption} />
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function GhostSelectionMenuDemo({ labelledBy }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", width: "fit-content", alignSelf: "start" }}>
      <button
        type="button"
        className="ds-btn ds-btn-ghost ds-btn-md ds-menu-trigger-demo"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-labelledby={labelledBy}
        data-active={open ? "true" : undefined}
        onClick={() => setOpen((value) => !value)}
        style={{
          ...typographyStyles.p2,
          width: "fit-content",
          minHeight: 32,
          padding: `${space[8]} ${space[12]}`,
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space[8],
          cursor: "pointer",
          filter: "none",
        }}
      >
        <span>Menu Item</span>
        <MenuChevronIcon open={!open} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Ghost trigger single select menu"
          style={{
            ...menuSurfaceStyle,
            position: "absolute",
            bottom: `calc(100% + ${space[4]})`,
            left: 0,
            width: 172,
            boxShadow: "var(--ui-shadow-md)",
            zIndex: 6,
          }}
        >
          {["Menu Item", "Menu Item", "Menu Item"].map((option, index) => {
            const selectedOption = index === selectedIndex;
            return (
              <button
                key={`ghost-selection-${option}-${index}`}
                type="button"
                role="menuitem"
                className="ds-menu-item-demo"
                onMouseEnter={(event) => {
                  if (!selectedOption) event.currentTarget.style.background = "var(--surface-app)";
                }}
                onMouseLeave={(event) => {
                  if (!selectedOption) event.currentTarget.style.background = "transparent";
                }}
                onClick={() => {
                  setSelectedIndex(index);
                  setOpen(false);
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: selectedOption ? "var(--surface-app)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: space[24],
                }}
              >
                <span>{option}</span>
                <span aria-hidden="true" className="ds-s" style={{ opacity: selectedOption ? 0.9 : 0 }}>✓</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function StyledDropdownDemo({ labelledBy }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Medium");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", width: 160, alignSelf: "start" }}>
      <button
        type="button"
        className="ds-menu-trigger-demo"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelledBy}
        onClick={() => setOpen((value) => !value)}
        style={triggerDropdownStyle}
      >
        <span>{selected}</span>
        <span aria-hidden="true" className="ds-s" style={{ opacity: 0.55 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Gridline density"
          style={{ ...menuSurfaceStyle, position: "absolute", top: `calc(100% + ${space[4]})`, left: 0, zIndex: 6, width: "100%" }}
        >
          {["Subtle", "Medium", "Strong"].map((option) => {
            const active = option === selected;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={active}
                className="ds-menu-item-demo"
                onMouseEnter={(event) => {
                  if (!active) event.currentTarget.style.background = "var(--surface-app)";
                }}
                onMouseLeave={(event) => {
                  if (!active) event.currentTarget.style.background = "transparent";
                }}
                onClick={() => {
                  setSelected(option);
                  setOpen(false);
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: active ? "var(--surface-app)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: space[24],
                }}
              >
                <span>{option}</span>
                <span aria-hidden="true" className="ds-s" style={{ opacity: active ? 0.9 : 0 }}>✓</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StyledUpwardDropdownDemo({ labelledBy }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [zoomPreset, setZoomPreset] = useState(100);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", width: "fit-content", alignSelf: "start" }}>
      <button
        type="button"
        className="ds-menu-trigger-demo"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-labelledby={labelledBy}
        onClick={() => setOpen((value) => !value)}
        style={triggerDropupStyle}
      >
        Zoom {zoomPreset}%
        <span aria-hidden="true" className="ds-s" style={{ opacity: 0.55 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Zoom presets"
          style={{ ...menuSurfaceStyle, position: "absolute", bottom: `calc(100% + ${space[8]})`, left: 0, zIndex: 6, width: 160 }}
        >
          {[50, 75, 100, 125, 150].map((preset) => {
            const selected = preset === zoomPreset;
            return (
              <button
                key={preset}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className="ds-menu-item-demo"
                onMouseEnter={(event) => {
                  if (!selected) event.currentTarget.style.background = "var(--surface-app)";
                }}
                onMouseLeave={(event) => {
                  if (!selected) event.currentTarget.style.background = "transparent";
                }}
                onClick={() => {
                  setZoomPreset(preset);
                  setOpen(false);
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: selected ? "var(--surface-app)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: space[24],
                }}
              >
                <span>{preset}%</span>
                <span aria-hidden="true" className="ds-s" style={{ opacity: selected ? 0.9 : 0 }}>✓</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
