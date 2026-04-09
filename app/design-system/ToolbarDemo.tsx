"use client";

import { Fragment, useEffect, useState } from "react";
import { assetPath } from "../../lib/assetPath";

const brushSizes = [2, 4, 8, 12] as const;

const primaryTools = [
  { id: "pan", label: "Pan", icon: "icons/lucide/pan.svg" },
] as const;

const utilityTools = [
  { id: "pick", label: "Pick color", icon: "icons/lucide/dropper.svg" },
] as const;

const paintSubtools = [
  { id: "brush", label: "Brush", icon: "icons/lucide/brush_thin.svg" },
  { id: "erase", label: "Erase", icon: "icons/lucide/eraser.svg" },
  { id: "fill", label: "Fill", icon: "icons/lucide/paint_bucket.svg" },
  { id: "lasso", label: "Lasso", icon: "icons/lucide/lasso.svg" },
  { id: "mirror", label: "Mirror", icon: "icons/lucide/flip-horizontal.svg" },
] as const;

function ToolbarGlyph({ icon }: { icon: string }) {
  return (
    <span className="ds-toolbar-icon" aria-hidden="true">
      <span
        className="ds-toolbar-glyph"
        style={{
          WebkitMaskImage: `url(${assetPath(icon)})`,
          maskImage: `url(${assetPath(icon)})`,
        }}
      />
    </span>
  );
}

function ImagePositionToolbar({
  onCancel,
  onDone,
}: {
  onCancel?: () => void;
  onDone?: () => void;
}) {
  const [opacity, setOpacity] = useState(72);
  const [showOpacityTooltip, setShowOpacityTooltip] = useState(false);
  const [imageOpacityOpen, setImageOpacityOpen] = useState(false);

  useEffect(() => {
    if (!showOpacityTooltip) return;

    function handlePointerUp() {
      setShowOpacityTooltip(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [showOpacityTooltip]);

  return (
    <div className="ds-toolbar ds-toolbar-image-state">
      <div className="ds-toolbar-group">
        <div className="ds-toolbar-anchor">
          <button
            type="button"
            className="ds-toolbar-button"
            data-active={imageOpacityOpen ? "true" : undefined}
            aria-pressed={imageOpacityOpen}
            onClick={() => setImageOpacityOpen((current) => !current)}
          >
            <ToolbarGlyph icon="icons/lucide/blend.svg" />
            <span className="ds-toolbar-label">Opacity</span>
          </button>

          {imageOpacityOpen ? (
            <div className="ds-toolbar-popover ds-toolbar-popover-opacity" role="dialog" aria-label="Image opacity">
              <div className="ds-slider-inline-row ds-toolbar-slider-row">
                <div className="ds-toolbar-slider-label">
                  <ToolbarGlyph icon="icons/lucide/blend.svg" />
                  <span className="ds-toolbar-label">Opacity</span>
                </div>
                <div className="ds-slider-wrap ds-toolbar-slider-wrap">
                  <div
                    className={`ds-slider-thumb-tooltip${showOpacityTooltip ? " ds-slider-thumb-tooltip-visible" : ""}`}
                    aria-hidden="true"
                    style={{ left: `${opacity}%` }}
                  >
                    {opacity}
                  </div>
                  <div className="ds-slider" aria-hidden="true">
                    <div className="ds-slider-track">
                      <div className="ds-slider-fill" style={{ width: `${opacity}%` }} />
                      <div className="ds-slider-thumb" style={{ left: `${opacity}%` }} />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={opacity}
                    onChange={(event) => setOpacity(Number(event.target.value))}
                    onPointerDown={() => setShowOpacityTooltip(true)}
                    onBlur={() => setShowOpacityTooltip(false)}
                    className="ds-slider-input"
                    aria-label="Image opacity value"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <span className="ds-toolbar-divider" aria-hidden="true" />

        <button type="button" className="ds-toolbar-button" aria-label="Crop image">
          <ToolbarGlyph icon="icons/lucide/crop.svg" />
          <span className="ds-toolbar-label">Crop</span>
        </button>

        <button type="button" className="ds-toolbar-button" aria-label="Rotate image">
          <ToolbarGlyph icon="icons/lucide/rotate-cw.svg" />
          <span className="ds-toolbar-label">Rotate</span>
        </button>

        <button type="button" className="ds-toolbar-button" aria-label="Flip image">
          <ToolbarGlyph icon="icons/lucide/flip-horizontal.svg" />
          <span className="ds-toolbar-label">Flip</span>
        </button>
      </div>

      <span className="ds-toolbar-divider" aria-hidden="true" />

      <div className="ds-toolbar-group ds-toolbar-group-actions">
        <button type="button" className="ds-toolbar-button ds-toolbar-button-wide" aria-label="Cancel positioning" onClick={onCancel}>
          <span className="ds-toolbar-label">Cancel</span>
        </button>

        <button type="button" className="ds-toolbar-button ds-toolbar-button-primary ds-toolbar-button-wide" aria-label="Done positioning" onClick={onDone}>
          <span className="ds-toolbar-label">Done</span>
        </button>
      </div>
    </div>
  );
}

export function ToolbarDemo() {
  const [activeTool, setActiveTool] = useState<
    | (typeof primaryTools)[number]["id"]
    | (typeof utilityTools)[number]["id"]
    | (typeof paintSubtools)[number]["id"]
  >("brush");
  const [imageVisible, setImageVisible] = useState(true);
  const [imageToolsOpen, setImageToolsOpen] = useState(false);
  const [imageRepositionMode, setImageRepositionMode] = useState(false);
  const [paintOpen, setPaintOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [brushSize, setBrushSize] = useState<(typeof brushSizes)[number]>(8);
  const [opacity, setOpacity] = useState(72);
  const [showOpacityTooltip, setShowOpacityTooltip] = useState(false);

  useEffect(() => {
    if (!showOpacityTooltip) return;

    function handlePointerUp() {
      setShowOpacityTooltip(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [showOpacityTooltip]);

  if (imageRepositionMode) {
    return (
      <ImagePositionToolbar
        onCancel={() => setImageRepositionMode(false)}
        onDone={() => setImageRepositionMode(false)}
      />
    );
  }

  return (
    <div className="ds-toolbar">
      <div className="ds-toolbar-group">
        <button type="button" className="ds-toolbar-button ds-toolbar-button-swatch" data-active="true" aria-pressed="true" aria-label="Select color">
          <span className="ds-toolbar-swatch" aria-hidden="true" />
        </button>
      </div>

      <span className="ds-toolbar-divider" aria-hidden="true" />

      <div className="ds-toolbar-group">
        {utilityTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="ds-toolbar-button"
            data-active={activeTool === tool.id ? "true" : undefined}
            aria-pressed={activeTool === tool.id}
            aria-label={tool.label}
            onClick={() => setActiveTool(tool.id)}
          >
            <ToolbarGlyph icon={tool.icon} />
          </button>
        ))}

        {primaryTools.map((tool) => {
          const selected = tool.id === activeTool;

          return (
            <Fragment key={tool.id}>
              <button
                type="button"
                className="ds-toolbar-button"
                data-active={selected ? "true" : undefined}
                aria-pressed={selected}
                onClick={() => setActiveTool(tool.id)}
              >
                <ToolbarGlyph icon={tool.icon} />
                {tool.id === "pan" ? null : <span className="ds-toolbar-label">{tool.label}</span>}
              </button>
            </Fragment>
          );
        })}

        <span className="ds-toolbar-divider" aria-hidden="true" />

        <div className="ds-toolbar-anchor">
          <button
            type="button"
            className="ds-toolbar-button"
            data-active={paintOpen ? "true" : undefined}
            aria-pressed={paintOpen}
            onClick={() => setPaintOpen((current) => !current)}
          >
            <ToolbarGlyph icon="icons/lucide/brush_thick.svg" />
            <span className="ds-toolbar-label">Draw</span>
          </button>

          {paintOpen ? (
            <div className="ds-toolbar-popover ds-toolbar-popover-paint" role="dialog" aria-label="Draw tools">
              <div className="ds-toolbar-subtool-group">
                <div className="ds-toolbar-anchor">
                  <button
                    type="button"
                    className="ds-toolbar-button"
                    data-active={sizeOpen ? "true" : undefined}
                    aria-pressed={sizeOpen}
                    onClick={() => setSizeOpen((current) => !current)}
                  >
                    <ToolbarGlyph icon="icons/lucide/ruler.svg" />
                    <span className="ds-toolbar-label">Size</span>
                  </button>

                  {sizeOpen ? (
                    <div className="ds-toolbar-popover ds-toolbar-popover-size" role="dialog" aria-label="Brush size">
                      <div className="ds-toolbar-size-grid">
                        {brushSizes.map((size) => {
                          const active = size === brushSize;
                          const squareSize = size === 2 ? 6 : size === 4 ? 8 : size === 8 ? 10 : 12;

                          return (
                            <button
                              key={size}
                              type="button"
                              className="ds-toolbar-size-option"
                              data-active={active ? "true" : undefined}
                              aria-pressed={active}
                              aria-label={`Brush size ${size}`}
                              onClick={() => setBrushSize(size)}
                            >
                              <span
                                className="ds-toolbar-size-dot"
                                style={{ width: squareSize, height: squareSize }}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <span className="ds-toolbar-divider" aria-hidden="true" />

                {paintSubtools.map((tool, index) => {
                  const selected = tool.id === activeTool;

                  return (
                    <Fragment key={tool.id}>
                      {index > 0 ? <span className="ds-toolbar-divider" aria-hidden="true" /> : null}
                      <div>
                        <button
                          type="button"
                          className="ds-toolbar-button"
                          data-active={selected ? "true" : undefined}
                          aria-pressed={selected}
                          onClick={() => setActiveTool(tool.id)}
                        >
                          <ToolbarGlyph icon={tool.icon} />
                          <span className="ds-toolbar-label">{tool.label}</span>
                        </button>
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <span className="ds-toolbar-divider" aria-hidden="true" />

      <div className="ds-toolbar-group">
        <div className="ds-toolbar-anchor">
          <button
            type="button"
            className="ds-toolbar-button"
            data-active={imageToolsOpen ? "true" : undefined}
            aria-pressed={imageToolsOpen}
            onClick={() => {
              setImageToolsOpen((current) => !current);
            }}
          >
            <ToolbarGlyph icon="icons/lucide/image.svg" />
            <span className="ds-toolbar-label">Image</span>
          </button>

          {imageToolsOpen ? (
            <div className="ds-toolbar-popover ds-toolbar-popover-subtoolbar" role="dialog" aria-label="Image tools">
              <button
                type="button"
                className="ds-toolbar-button"
                aria-pressed={imageVisible}
                onClick={() => setImageVisible((current) => !current)}
              >
                <ToolbarGlyph icon={imageVisible ? "icons/lucide/eye.svg" : "icons/lucide/eye_off.svg"} />
                <span className="ds-toolbar-label">{imageVisible ? "Visible" : "Hidden"}</span>
              </button>

              <span className="ds-toolbar-divider" aria-hidden="true" />

              <div className="ds-slider-inline-row ds-toolbar-slider-row">
                <div className="ds-toolbar-slider-label">
                  <ToolbarGlyph icon="icons/lucide/blend.svg" />
                  <span className="ds-toolbar-label">Opacity</span>
                </div>
                <div className="ds-slider-wrap ds-toolbar-slider-wrap">
                  <div
                    className={`ds-slider-thumb-tooltip${showOpacityTooltip ? " ds-slider-thumb-tooltip-visible" : ""}`}
                    aria-hidden="true"
                    style={{ left: `${opacity}%` }}
                  >
                    {opacity}
                  </div>
                  <div className="ds-slider" aria-hidden="true">
                    <div className="ds-slider-track">
                      <div className="ds-slider-fill" style={{ width: `${opacity}%` }} />
                      <div className="ds-slider-thumb" style={{ left: `${opacity}%` }} />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={opacity}
                    onChange={(event) => setOpacity(Number(event.target.value))}
                    onPointerDown={() => setShowOpacityTooltip(true)}
                    onBlur={() => setShowOpacityTooltip(false)}
                    className="ds-slider-input"
                    aria-label="Opacity value"
                  />
                </div>
              </div>

              <span className="ds-toolbar-divider" aria-hidden="true" />

              <button
                type="button"
                className="ds-toolbar-button"
                aria-label="Reposition image"
                onClick={() => {
                  setImageToolsOpen(false);
                  setImageRepositionMode(true);
                }}
              >
                <ToolbarGlyph icon="icons/lucide/vector_square.svg" />
                <span className="ds-toolbar-label">Reposition</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <span className="ds-toolbar-divider" aria-hidden="true" />

      <div className="ds-toolbar-group">
        <button type="button" className="ds-toolbar-button" aria-label="Clear">
          <ToolbarGlyph icon="icons/lucide/trash.svg" />
          <span className="ds-toolbar-label">Clear</span>
        </button>
      </div>
    </div>
  );
}

export function ImagePositionToolbarDemo() {
  return <ImagePositionToolbar />;
}
