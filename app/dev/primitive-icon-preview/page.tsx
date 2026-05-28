import { buildPrimitiveIconDataUrl } from "@/lib/editor-v2/editor/icons/primitiveIcon";

const PREVIEW_CASES = [
  { label: "Landscape", width: 420, height: 280 },
  { label: "Square", width: 320, height: 320 },
  { label: "Portrait", width: 260, height: 420 },
] as const;

export default function PrimitiveIconPreviewPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f6f2ea",
        color: "#1f2937",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
          Primitive Icon Preview
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: "15px", lineHeight: 1.5 }}>
          Large preview surface for tuning primitive frame geometry without the icon library
          thumbnail hiding proportion changes.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginTop: "28px",
          }}
        >
          {PREVIEW_CASES.map((preview) => {
            const src = buildPrimitiveIconDataUrl({
              kind: "vintage-label-frame",
              width: preview.width,
              height: preview.height,
              strokeColor: "#121923",
              strokeReferenceSize: Math.min(preview.width, preview.height),
            });

            return (
              <article
                key={preview.label}
                style={{
                  padding: "20px",
                  borderRadius: "20px",
                  background: "#fffdf8",
                  boxShadow: "0 12px 30px rgba(18, 25, 35, 0.08)",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                  {preview.label}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#5b6472" }}>
                  {preview.width} x {preview.height}
                </p>
                <div
                  style={{
                    marginTop: "16px",
                    borderRadius: "16px",
                    background:
                      "linear-gradient(180deg, rgba(89, 120, 202, 0.06), rgba(89, 120, 202, 0.02))",
                    border: "1px solid rgba(89, 120, 202, 0.14)",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    width={preview.width}
                    height={preview.height}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "auto",
                      maxWidth: `${preview.width}px`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
