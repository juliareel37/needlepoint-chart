import { Button, ButtonIcon, FieldInput } from "@/components/design-system";
import styles from "./page.module.css";

const previewPalette = [
  "transparent",
  "#f1b9da",
  "#e5439f",
  "#b4a3ef",
  "#7d55e6",
  "#52239a",
] as const;

const basePreviewCells = [
  [4, 0, 3, 1, 1, 0, 2, 1, 0, 0, 5, 0],
  [3, 0, 3, 5, 5, 0, 0, 0, 2, 1, 0, 1],
  [0, 0, 0, 2, 0, 2, 0, 3, 0, 4, 0, 0],
  [4, 0, 0, 4, 2, 0, 0, 3, 0, 0, 4, 1],
  [0, 2, 4, 5, 0, 2, 0, 5, 0, 0, 2, 0],
  [4, 3, 2, 0, 2, 4, 0, 0, 0, 4, 0, 3],
  [0, 3, 0, 0, 5, 4, 0, 4, 0, 4, 1, 0],
  [0, 5, 0, 5, 4, 0, 0, 5, 0, 5, 0, 5],
  [2, 5, 0, 5, 2, 5, 1, 2, 3, 5, 5, 0],
  [0, 5, 0, 3, 1, 5, 1, 3, 1, 0, 5, 3],
  [0, 4, 5, 2, 0, 4, 0, 5, 2, 3, 0, 0],
  [1, 1, 0, 0, 0, 0, 3, 4, 1, 4, 3, 2],
] as const;

function getPreviewCells(offset: number) {
  return basePreviewCells.map((row, rowIndex) =>
    row.map((_, columnIndex) => {
      const sourceColumn = (columnIndex + offset + rowIndex) % row.length;
      return row[sourceColumn];
    }),
  );
}

const sampleDesigns = [
  {
    id: "coastal-bloom",
    title: "Floral Cushion Cover",
    details: "300 × 300 cells • 24 colors",
    updatedLabel: "Edited 5h ago",
  },
  {
    id: "wildflower-trellis",
    title: "Garden Trellis",
    details: "180 × 240 cells • 18 colors",
    updatedLabel: "Edited yesterday",
  },
  {
    id: "berry-stripe",
    title: "Berry Stripe",
    details: "144 × 196 cells • 12 colors",
    updatedLabel: "Edited 3 days ago",
  },
  {
    id: "golden-vines",
    title: "Golden Vines",
    details: "220 × 220 cells • 20 colors",
    updatedLabel: "Edited last week",
  },
  {
    id: "meadow-check",
    title: "Meadow Check",
    details: "160 × 200 cells • 14 colors",
    updatedLabel: "Edited 9 days ago",
  },
  {
    id: "peony-arch",
    title: "Peony Arch",
    details: "256 × 256 cells • 22 colors",
    updatedLabel: "Edited 2 weeks ago",
  },
] as const;

export default function LibraryPage() {
  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <h1 className={styles.title}>My Designs</h1>
          </div>

          <div className={styles.actions}>
            <label className={styles.searchField}>
              <span className={styles.searchIcon} aria-hidden="true" />
              <FieldInput
                type="search"
                name="search"
                placeholder="Search designs"
                aria-label="Search designs"
                className={styles.searchInput}
              />
            </label>

            <Button type="button" variant="secondary" size="md">
              <ButtonIcon icon="/icons/lucide/folder-plus.svg" />
              New folder
            </Button>
            <Button type="button" variant="primary" size="md">
              <ButtonIcon icon="/icons/lucide/plus.svg" />
              New design
            </Button>
          </div>
        </header>

        <section className={styles.grid} aria-label="Saved designs">
          {sampleDesigns.map((design, index) => (
            <article key={design.id} className={styles.card}>
              <div className={styles.thumbnail}>
                <div className={styles.thumbnailFrame}>
                  <div className={styles.previewGrid} aria-hidden="true">
                    {getPreviewCells(index).flatMap((row, rowIndex) =>
                      row.map((cell, columnIndex) => (
                        <span
                          key={`${design.id}-${rowIndex}-${columnIndex}`}
                          className={styles.previewCell}
                          style={{
                            backgroundColor: previewPalette[cell],
                          }}
                        />
                      )),
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTopRow}>
                  <h2 className={styles.cardTitle}>{design.title}</h2>
                  <button
                    type="button"
                    className={styles.cardMenuButton}
                    aria-label={`Open actions for ${design.title}`}
                  >
                    <span className={styles.cardMenuDots} aria-hidden="true" />
                  </button>
                </div>
                <p className={styles.cardMeta}>{design.details}</p>
                <p className={styles.cardTimestamp}>{design.updatedLabel}</p>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
