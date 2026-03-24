"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Color } from "../../../lib/grid";
import { assetPath } from "../../../lib/assetPath";
import { contrastForHex } from "../utils/colorUtils";
import { organizePaletteByHueAndLightness } from "../utils/paletteSort";

type UsedColorEntry = { color: Color; count: number };
type CustomPalettePickEvent = { paletteId: string; colorId: number; nonce: number };

type CustomPaletteRecord = {
  id: string;
  name: string;
  colorIds: number[];
};

type CustomPalettesSectionProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  embedded?: boolean;
  palette: Color[];
  usedColors: UsedColorEntry[];
  usedColorIds: number[];
  customPaletteEyedropperTargetId: string | null;
  customPalettePickEvent: CustomPalettePickEvent | null;
  startCustomPaletteEyedropper: (paletteId: string) => void;
  cancelCustomPaletteEyedropper: () => void;
};

const CUSTOM_PALETTE_COLUMNS = 9;

const NAME_FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid transparent",
  background: "var(--muted-bg)",
  color: "var(--foreground)",
  fontSize: 12,
};

const INLINE_EDITOR_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 6,
  width: "100%",
  minWidth: 0,
  alignItems: "center",
};

const TOUCHING_ICON_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  flex: "0 0 auto",
};

const PLAIN_ICON_BUTTON_STYLE: React.CSSProperties = {
  width: 22,
  height: 22,
  padding: 0,
  border: "none",
  borderRadius: 6,
  background: "transparent",
  color: "var(--foreground)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  lineHeight: 1,
  transition: "background 140ms ease",
};

function shiftGlyph(dx: number): React.CSSProperties {
  return {
    display: "block",
    transform: `translateX(${dx}px)`,
    pointerEvents: "none",
  };
}

function renderConfirmCancelRow({
  value,
  onChange,
  onConfirm,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={INLINE_EDITOR_STYLE}>
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onConfirm();
          }
        }}
        placeholder="Palette name"
        style={NAME_FIELD_STYLE}
      />
      <div style={TOUCHING_ICON_ROW_STYLE}>
        <button type="button" onClick={onConfirm} aria-label="Confirm" style={PLAIN_ICON_BUTTON_STYLE}>
          <span style={{ ...shiftGlyph(-2), fontSize: 15, fontWeight: 700 }}>✓</span>
        </button>
        <button type="button" onClick={onCancel} aria-label="Cancel" style={PLAIN_ICON_BUTTON_STYLE}>
          <span style={{ ...shiftGlyph(2), fontSize: 15, fontWeight: 700 }}>X</span>
        </button>
      </div>
    </div>
  );
}

function ConfirmCancelRow(props: {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return renderConfirmCancelRow(props);
}

function preventPointerFocus(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function formatPaletteColorLabel(color: Color) {
  return `DMC-${color.code ?? color.id}`;
}

function formatCompactColorCode(color: Color) {
  return String(color.code ?? color.id);
}

function formatStitchCount(count: number) {
  if (count < 100) return String(count);
  if (count < 1000) return `${Math.round(count / 10) * 10}`;
  if (count < 10000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  return `${(count / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
}

function CustomPalettesSectionComponent({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  collapseStyle,
  embedded = false,
  palette,
  usedColors,
  usedColorIds,
  customPaletteEyedropperTargetId,
  customPalettePickEvent,
  startCustomPaletteEyedropper,
  cancelCustomPaletteEyedropper,
}: CustomPalettesSectionProps) {
  const [open, setOpen] = useState(true);
  const [customPalettes, setCustomPalettes] = useState<CustomPaletteRecord[]>([]);
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [editingPaletteName, setEditingPaletteName] = useState("");
  const [expandedPaletteId, setExpandedPaletteId] = useState<string | null>(null);
  const [customPaletteQuery, setCustomPaletteQuery] = useState("");
  const [customPaletteSource, setCustomPaletteSource] = useState<"all" | "used">("all");
  const [customPaletteView, setCustomPaletteView] = useState<"grid" | "list">("grid");
  const [showGridDmcCode, setShowGridDmcCode] = useState(false);
  const [showGridStitchBadge, setShowGridStitchBadge] = useState(false);
  const paletteSequenceRef = useRef(0);
  const paletteTriggerRefs = useRef<Record<string, HTMLElement | null>>({});
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const usedColorIdSet = useMemo(() => new Set(usedColorIds), [usedColorIds]);
  const usedColorCountById = useMemo(() => new Map(usedColors.map((entry) => [entry.color.id, entry.count])), [usedColors]);
  const expandedPalette = useMemo(
    () => customPalettes.find((paletteItem) => paletteItem.id === expandedPaletteId) ?? null,
    [customPalettes, expandedPaletteId],
  );

  const customPaletteColors = useMemo<Color[]>(() => {
    const query = customPaletteQuery.trim().toLowerCase();
    const filteredColors = palette.filter((color) => {
      if (customPaletteSource === "used" && !usedColorIdSet.has(color.id)) return false;
      if (!query) return true;
      const code = (color.code ?? "").toLowerCase();
      return color.name.toLowerCase().includes(query) || code.includes(query) || `#${code}`.includes(query);
    });

    if (filteredColors.length === 0) return [];
    return organizePaletteByHueAndLightness(filteredColors, CUSTOM_PALETTE_COLUMNS).flat();
  }, [customPaletteQuery, customPaletteSource, palette, usedColorIdSet]);

  const closePicker = () => {
    setExpandedPaletteId(null);
    setPopoverPosition(null);
    setCustomPaletteQuery("");
    setCustomPaletteSource("all");
  };

  const openPalettePicker = (paletteId: string) => {
    setExpandedPaletteId(paletteId);
    setCustomPaletteQuery("");
    setCustomPaletteSource("all");
  };

  useEffect(() => {
    if (!expandedPaletteId) return;

    const updatePosition = () => {
      const trigger = paletteTriggerRefs.current[expandedPaletteId];
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const width = Math.min(360, Math.max(300, rect.width + 272));
      const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);
      const top = rect.bottom + 8;
      setPopoverPosition({ top, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [expandedPaletteId]);

  useEffect(() => {
    if (!expandedPaletteId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      const trigger = paletteTriggerRefs.current[expandedPaletteId];
      if (trigger?.contains(target)) return;
      closePicker();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expandedPaletteId]);

  const createPalette = () => {
    paletteSequenceRef.current += 1;
    const id = `custom-${paletteSequenceRef.current}`;
    setCustomPalettes((prev) => [...prev, { id, name: "My Palette", colorIds: [] }]);
    setEditingPaletteId(id);
    setEditingPaletteName("My Palette");
  };

  const startRenamePalette = (paletteId: string, name: string) => {
    setEditingPaletteId(paletteId);
    setEditingPaletteName(name);
  };

  const commitRenamePalette = () => {
    const trimmed = editingPaletteName.trim();
    if (!editingPaletteId || !trimmed) return;
    setCustomPalettes((prev) => prev.map((item) => (item.id === editingPaletteId ? { ...item, name: trimmed } : item)));
    setEditingPaletteId(null);
    setEditingPaletteName("");
  };

  const cancelRenamePalette = () => {
    setEditingPaletteId(null);
    setEditingPaletteName("");
  };

  const removePalette = (paletteId: string) => {
    setCustomPalettes((prev) => prev.filter((item) => item.id !== paletteId));
    if (expandedPaletteId === paletteId) closePicker();
    if (editingPaletteId === paletteId) cancelRenamePalette();
  };

  const addPaletteColor = (paletteId: string, colorId: number) => {
    setCustomPalettes((prev) =>
      prev.map((item) =>
        item.id !== paletteId
          ? item
          : item.colorIds.includes(colorId)
            ? item
            : { ...item, colorIds: [...item.colorIds, colorId] },
      ),
    );
  };

  const removePaletteColor = (paletteId: string, colorId: number) => {
    setCustomPalettes((prev) =>
      prev.map((item) =>
        item.id !== paletteId ? item : { ...item, colorIds: item.colorIds.filter((id) => id !== colorId) },
      ),
    );
  };

  useEffect(() => {
    if (!customPalettePickEvent) return;
    const frame = window.requestAnimationFrame(() => {
      addPaletteColor(customPalettePickEvent.paletteId, customPalettePickEvent.colorId);
      setExpandedPaletteId(customPalettePickEvent.paletteId);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [customPalettePickEvent]);

  return (
    <div
      className="app-card"
      style={{
        ...(embedded ? {} : cardStyle),
        boxShadow: embedded ? "none" : open ? cardShadow : cardShadowCollapsed,
        minWidth: 0,
        overflow: "visible",
      }}
    >
      {!embedded ? (
        <button
          onClick={() => setOpen((value) => !value)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            border: "none",
            background: "transparent",
            padding: 0,
            marginBottom: open ? 10 : 0,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 15,
          }}
          type="button"
        >
          <span>Custom Palettes</span>
          <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{open ? "▾" : "▸"}</span>
        </button>
      ) : null}
      <div
        style={{
          display: "grid",
          gap: 10,
          minWidth: 0,
          ...collapseStyle(embedded ? true : open, 2000),
        }}
      >
        {customPalettes.length === 0 ? (
          <div
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 6,
              padding: "16px 12px",
              borderRadius: 10,
              background: "var(--ui-surface-faint)",
              color: "var(--foreground)",
              textAlign: "center",
            }}
          >
            <img
              src={assetPath("/icons/palette.svg")}
              alt=""
              aria-hidden="true"
              width={18}
              height={18}
              style={{ display: "block", filter: "var(--icon-on-bg-filter)", opacity: 0.8 }}
            />
            <div style={{ fontSize: 13, fontWeight: 700 }}>No palettes yet</div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>Create your first palette to begin</div>
            <button
              type="button"
              onClick={createPalette}
              style={{
                marginTop: 4,
                width: "100%",
                maxWidth: 180,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--accent)",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              + New Palette
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 10,
              minWidth: 0,
            }}
          >
            {customPalettes.map((customPalette, index) => {
              const isExpanded = expandedPaletteId === customPalette.id;
              const isEditing = editingPaletteId === customPalette.id;
              const selectedColors = customPalette.colorIds
                .map((id) => palette.find((color) => color.id === id) ?? null)
                .filter((color): color is Color => Boolean(color));

              return (
                <div
                  key={customPalette.id}
                  style={{
                    display: "grid",
                    gap: 10,
                    minWidth: 0,
                    overflow: "visible",
                    padding: "12px",
                    borderRadius: 10,
                    background: "var(--ui-surface-faint)",
                    position: "relative",
                  }}
                >
                  {isEditing ? (
                    <ConfirmCancelRow
                      value={editingPaletteName}
                      onChange={setEditingPaletteName}
                      onConfirm={commitRenamePalette}
                      onCancel={cancelRenamePalette}
                    />
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto auto",
                        gap: 8,
                        alignItems: "center",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {customPalette.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => startRenamePalette(customPalette.id, customPalette.name)}
                        aria-label={`Rename ${customPalette.name}`}
                        style={PLAIN_ICON_BUTTON_STYLE}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background = "var(--ui-hover-soft)";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            transform: "translateX(-1px) scaleX(-1)",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          ✎
                        </span>
                      </button>
                      <div style={TOUCHING_ICON_ROW_STYLE}>
                        <button
                          type="button"
                          onClick={() => removePalette(customPalette.id)}
                          aria-label={`Delete ${customPalette.name}`}
                          style={PLAIN_ICON_BUTTON_STYLE}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.background = "var(--ui-hover-soft)";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.background = "transparent";
                          }}
                        >
                          <img
                            src={assetPath("/icons/trash.svg")}
                            alt=""
                            aria-hidden="true"
                            width={14}
                            height={14}
                            style={{ ...shiftGlyph(2), filter: "var(--icon-on-bg-filter)" }}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedColors.length > 0 ? (
                    <div
                      ref={(node) => {
                        paletteTriggerRefs.current[customPalette.id] = node;
                      }}
                      style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0, overflowAnchor: "none" }}
                    >
                      {selectedColors.map((color) => {
                        return (
                          <div
                            key={color.id}
                            className="custom-palette-swatch"
                            style={{ position: "relative" }}
                          >
                            <div
                              title={`${color.name} (${color.code ?? color.hex})`}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: color.hex,
                                boxShadow:
                                  contrastForHex(color.hex) === "#000000"
                                    ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                    : undefined,
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removePaletteColor(customPalette.id, color.id)}
                              aria-label={`Remove ${color.name}`}
                              className="custom-palette-swatch-remove"
                              style={{
                                position: "absolute",
                                top: -4,
                                right: -4,
                                width: 16,
                                height: 16,
                                padding: 0,
                                border: "none",
                                borderRadius: 999,
                                background: "#ffffff",
                                color: "#171717",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 700,
                                lineHeight: 1,
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              X
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          if (isExpanded) {
                            closePicker();
                            return;
                          }
                          openPalettePicker(customPalette.id);
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.7)",
                          background:
                            "linear-gradient(135deg, #ff6b6b 0%, #f59e0b 22%, #facc15 40%, #22c55e 58%, #3b82f6 78%, #a855f7 100%)",
                          color: "#ffffff",
                          boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)",
                          display: "grid",
                          placeItems: "center",
                          padding: 0,
                          cursor: "pointer",
                          fontSize: 16,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                        aria-label={`${isExpanded ? "Close" : "Add colors to"} ${customPalette.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      ref={(node) => {
                        paletteTriggerRefs.current[customPalette.id] = node;
                      }}
                      onClick={() => {
                        if (isExpanded) {
                          closePicker();
                          return;
                        }
                        openPalettePicker(customPalette.id);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.7)",
                        background:
                          "linear-gradient(135deg, #ff6b6b 0%, #f59e0b 22%, #facc15 40%, #22c55e 58%, #3b82f6 78%, #a855f7 100%)",
                        color: "#ffffff",
                        boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)",
                        display: "grid",
                        placeItems: "center",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                      aria-label={`Add colors to ${customPalette.name}`}
                    >
                      +
                    </button>
                  )}

                </div>
              );
            })}
            <button
              type="button"
              onClick={createPalette}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--accent)",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              + New Palette
            </button>
          </div>
        )}
      </div>
      {expandedPalette && popoverPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popoverRef}
              style={{
                position: "fixed",
                top: popoverPosition.top,
                left: popoverPosition.left,
                width: popoverPosition.width,
                maxWidth: "calc(100vw - 24px)",
                zIndex: 200,
                overflow: "hidden",
                display: "grid",
                gap: 10,
                minWidth: 0,
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--card-bg)",
                boxShadow: "0 14px 32px rgba(15,23,42,0.16)",
              }}
            >
              <div
                role="tablist"
                aria-label="Color source"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 2,
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--ui-surface-soft)",
                  }}
                >
                  {[
                    { id: "all" as const, label: "All" },
                    { id: "used" as const, label: "Used" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="tab"
                      onClick={() => setCustomPaletteSource(option.id)}
                      aria-selected={customPaletteSource === option.id}
                      data-active={customPaletteSource === option.id ? "true" : undefined}
                      className="menu-tab-button"
                      style={{
                        padding: "6px 10px",
                        flex: "1 1 0",
                        borderRadius: 8,
                        border: "none",
                        color: "var(--foreground)",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 8,
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                <input
                  value={customPaletteQuery}
                  onChange={(event) => setCustomPaletteQuery(event.target.value)}
                  placeholder="Search name or #DMC"
                  style={{
                    ...NAME_FIELD_STYLE,
                    border: "1px solid transparent",
                    background: "var(--muted-bg)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customPaletteEyedropperTargetId === expandedPalette.id) {
                      cancelCustomPaletteEyedropper();
                      return;
                    }
                    startCustomPaletteEyedropper(expandedPalette.id);
                  }}
                  aria-pressed={customPaletteEyedropperTargetId === expandedPalette.id}
                  aria-label="Pick color from canvas"
                  title="Pick color from canvas"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border:
                      customPaletteEyedropperTargetId === expandedPalette.id
                        ? "1px solid var(--accent-strong)"
                        : "none",
                    background:
                      customPaletteEyedropperTargetId === expandedPalette.id
                        ? "var(--accent-soft)"
                        : "transparent",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    flexShrink: 0,
                    transition: "background 140ms ease",
                  }}
                  onMouseEnter={(event) => {
                    if (customPaletteEyedropperTargetId !== expandedPalette.id) {
                      event.currentTarget.style.background = "var(--ui-hover-soft)";
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (customPaletteEyedropperTargetId !== expandedPalette.id) {
                      event.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <img
                    src={assetPath("/icons/dropper.svg")}
                    alt=""
                    aria-hidden="true"
                    width={14}
                    height={14}
                    style={{
                      display: "block",
                      filter:
                        customPaletteEyedropperTargetId === expandedPalette.id
                          ? "var(--icon-on-accent-soft-filter, var(--icon-on-bg-filter))"
                          : "var(--icon-on-bg-filter)",
                      opacity: customPaletteEyedropperTargetId === expandedPalette.id ? 1 : 0.82,
                    }}
                  />
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap", minWidth: 0 }}>
                {[
                  {
                    label: "Used Stitch Counts",
                    checked: showGridStitchBadge,
                    onChange: () => setShowGridStitchBadge((prev) => !prev),
                  },
                  {
                    label: "DMC Codes",
                    checked: showGridDmcCode,
                    onChange: () => setShowGridDmcCode((prev) => !prev),
                  },
                ].map((option) => (
                  <label
                    key={option.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      cursor: "pointer",
                      userSelect: "none",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: "var(--foreground)",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {option.label}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={option.checked}
                      onClick={option.onChange}
                      style={{
                        width: 28,
                        height: 16,
                        borderRadius: 999,
                        border: "none",
                        background: option.checked ? "var(--accent)" : "var(--ui-border-subtle)",
                        cursor: "pointer",
                        padding: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: option.checked ? "flex-end" : "flex-start",
                        transition: "background 140ms ease",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: "#ffffff",
                          boxShadow: "0 1px 2px rgba(15,23,42,0.2)",
                        }}
                      />
                    </button>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomPaletteView((prev) => (prev === "grid" ? "list" : "grid"))}
                  aria-label={customPaletteView === "grid" ? "Switch to list view" : "Switch to grid view"}
                  title={customPaletteView === "grid" ? "Switch to list view" : "Switch to grid view"}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    flexShrink: 0,
                    marginLeft: "auto",
                    transition: "background 140ms ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "var(--ui-hover-soft)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <img
                    src={assetPath(customPaletteView === "grid" ? "/icons/list.svg" : "/icons/grid_view.svg")}
                    alt=""
                    aria-hidden="true"
                    width={14}
                    height={14}
                    style={{ display: "block", opacity: 0.82 }}
                  />
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 6,
                  width: "100%",
                  minWidth: 0,
                  maxHeight: 220,
                  overflowY: "auto",
                  overflowX: "hidden",
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch",
                  scrollbarGutter: "stable",
                  overflowAnchor: "none",
                  paddingTop: 4,
                  paddingRight: 2,
                }}
              >
                {customPaletteView === "grid" ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      columnGap: 6,
                      rowGap: 10,
                      width: "100%",
                      minWidth: 0,
                      paddingLeft: 6,
                    }}
                  >
                    {customPaletteColors.map((color) => {
                      const isSelected = expandedPalette.colorIds.includes(color.id);
                      const stitchCount = usedColorCountById.get(color.id);
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onMouseDown={preventPointerFocus}
                          onClick={() =>
                            isSelected
                              ? removePaletteColor(expandedPalette.id, color.id)
                              : addPaletteColor(expandedPalette.id, color.id)
                          }
                          aria-label={`${isSelected ? "Remove" : "Add"} ${color.name}`}
                          title={`${color.name} (${color.code ?? color.hex})`}
                          style={{
                            width: 28,
                            flex: "0 0 auto",
                            cursor: "pointer",
                            display: "grid",
                            gap: showGridDmcCode ? 3 : 0,
                            justifyItems: "center",
                            padding: 0,
                            border: "none",
                            background: "transparent",
                          }}
                        >
                          <span
                            style={{
                              position: "relative",
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: color.hex,
                              boxShadow: isSelected
                                ? "0 0 0 2px var(--accent-soft)"
                                : contrastForHex(color.hex) === "#000000"
                                  ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                  : "none",
                            }}
                          >
                            {showGridStitchBadge && stitchCount ? (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  minWidth: 14,
                                  height: 14,
                                  padding: "0 3px",
                                  borderRadius: 999,
                                  background: "#ffffff",
                                  color: "rgba(15,23,42,0.9)",
                                  fontSize: 7,
                                  fontWeight: 700,
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                  pointerEvents: "none",
                                  transform: "translate(-35%, -35%)",
                                  zIndex: 2,
                                }}
                                aria-hidden="true"
                              >
                                {formatStitchCount(stitchCount)}
                              </span>
                            ) : null}
                            {isSelected ? (
                              <span
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: 14,
                                  fontWeight: 800,
                                  color: contrastForHex(color.hex),
                                  textShadow:
                                    contrastForHex(color.hex) === "#ffffff"
                                      ? "0 1px 2px rgba(15,23,42,0.35)"
                                      : "0 1px 2px rgba(255,255,255,0.45)",
                                  pointerEvents: "none",
                                }}
                                aria-hidden="true"
                              >
                                ✓
                              </span>
                            ) : null}
                            {isSelected ? (
                              <span
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  borderRadius: 8,
                                  boxShadow: "inset 0 0 0 2px var(--accent-strong)",
                                  pointerEvents: "none",
                                }}
                              />
                            ) : null}
                          </span>
                          {showGridDmcCode ? (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                color: "var(--foreground)",
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatCompactColorCode(color)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 4, width: "100%", minWidth: 0 }}>
                    {customPaletteColors.map((color) => {
                      const isSelected = expandedPalette.colorIds.includes(color.id);
                      const stitchCount = usedColorCountById.get(color.id);
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onMouseDown={preventPointerFocus}
                          onClick={() =>
                            isSelected
                              ? removePaletteColor(expandedPalette.id, color.id)
                              : addPaletteColor(expandedPalette.id, color.id)
                          }
                          aria-label={`${isSelected ? "Remove" : "Add"} ${color.name}`}
                          title={`${color.name} (${color.code ?? color.hex})`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            minWidth: 0,
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: "none",
                            background: isSelected ? "rgba(124, 58, 237, 0.10)" : "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 140ms ease",
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.background = isSelected
                              ? "rgba(124, 58, 237, 0.14)"
                              : "var(--ui-hover-soft)";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.background = isSelected ? "rgba(124, 58, 237, 0.10)" : "transparent";
                          }}
                        >
                          <span
                            style={{
                              position: "relative",
                              width: 24,
                              height: 24,
                              borderRadius: 8,
                              background: color.hex,
                              flexShrink: 0,
                              boxShadow:
                                contrastForHex(color.hex) === "#000000"
                                  ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                  : undefined,
                            }}
                          >
                            {showGridStitchBadge && stitchCount ? (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  minWidth: 14,
                                  height: 14,
                                  padding: "0 3px",
                                  borderRadius: 999,
                                  background: "#ffffff",
                                  color: "rgba(15,23,42,0.9)",
                                  fontSize: 7,
                                  fontWeight: 700,
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                  pointerEvents: "none",
                                  transform: "translate(-35%, -35%)",
                                  zIndex: 2,
                                }}
                                aria-hidden="true"
                              >
                                {formatStitchCount(stitchCount)}
                              </span>
                            ) : null}
                            {isSelected ? (
                              <span
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: 14,
                                  fontWeight: 800,
                                  color: contrastForHex(color.hex),
                                  textShadow:
                                    contrastForHex(color.hex) === "#ffffff"
                                      ? "0 1px 2px rgba(15,23,42,0.35)"
                                      : "0 1px 2px rgba(255,255,255,0.45)",
                                  pointerEvents: "none",
                                }}
                                aria-hidden="true"
                              >
                                ✓
                              </span>
                            ) : null}
                          </span>
                          <span
                            style={{
                              display: "grid",
                              gap: 0,
                              minWidth: 0,
                              flex: "1 1 auto",
                              lineHeight: 1.1,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {color.name}
                            </span>
                          </span>
                          {showGridDmcCode ? (
                            <span
                              style={{
                                marginLeft: "auto",
                                flexShrink: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "1px 5px",
                                borderRadius: 999,
                                background: "rgba(148, 163, 184, 0.18)",
                                boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)",
                                fontSize: 9,
                                fontWeight: 600,
                                color: "var(--foreground)",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                                letterSpacing: 0.02,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatPaletteColorLabel(color)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={closePicker}
                style={{
                  position: "absolute",
                  right: 10,
                  bottom: 10,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--ui-border-subtle)",
                  background: "var(--card-bg)",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  zIndex: 2,
                  boxShadow: "0 4px 12px rgba(15,23,42,0.14)",
                }}
              >
                Done
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function areCustomPalettesSectionPropsEqual(prev: CustomPalettesSectionProps, next: CustomPalettesSectionProps) {
  return (
    prev.cardShadow === next.cardShadow &&
    prev.cardShadowCollapsed === next.cardShadowCollapsed &&
    prev.embedded === next.embedded &&
    prev.palette === next.palette &&
    prev.usedColors === next.usedColors &&
    prev.usedColorIds === next.usedColorIds &&
    prev.customPaletteEyedropperTargetId === next.customPaletteEyedropperTargetId &&
    prev.customPalettePickEvent === next.customPalettePickEvent
  );
}

export const CustomPalettesSection = React.memo(CustomPalettesSectionComponent, areCustomPalettesSectionPropsEqual);
