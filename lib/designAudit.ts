import fs from "node:fs";
import path from "node:path";

type FrequencyRow = {
  value: string;
  count: number;
  sourceCount: number;
  sampleSources: string[];
};

type SourceOccurrenceRow = {
  sourceFile: string;
  count: number;
  lineSamples: number[];
};

type CoverageCategory =
  | "Buttons"
  | "Icon Buttons"
  | "Inputs"
  | "Textareas"
  | "Selects / Dropdowns"
  | "Checkboxes / Toggles"
  | "Modals / Dialogs / Popovers"
  | "Cards / Panels / Containers"
  | "Badges / Tags / Chips"
  | "Nav Items / Tabs"
  | "Toolbar Controls"
  | "Typography";

type ComponentTypeCoverageRow = {
  category: CoverageCategory;
  totalMatches: number;
  sourceCount: number;
  sources: SourceOccurrenceRow[];
};

type CompositePatternCoverageRow = {
  pattern: string;
  totalMatches: number;
  sourceCount: number;
  sources: SourceOccurrenceRow[];
};

type DesignAuditStats = {
  analyzedFileCount: number;
  analyzedFiles: string[];
  themeColorTokens: FrequencyRow[];
  literalColorValues: FrequencyRow[];
  tailwindColorClasses: FrequencyRow[];
  borderRadiusValues: FrequencyRow[];
  spacingValues: FrequencyRow[];
  shadowValues: FrequencyRow[];
  fontSizeValues: FrequencyRow[];
  fontWeightValues: FrequencyRow[];
  buttonLikeClassPatterns: FrequencyRow[];
  accentPrimaryButtonTotal: number;
  accentPrimaryButtonSources: SourceOccurrenceRow[];
  componentTypeCoverage: ComponentTypeCoverageRow[];
  compositePatternCoverage: CompositePatternCoverageRow[];
};

type CountMap = Map<string, { count: number; sources: Set<string> }>;

const ROOT = process.cwd();

const INCLUDED_FILES = [
  "app",
  "components",
] as const;

const EXCLUDED_PATH_PREFIXES = [
  "app/api/",
  "app/design-audit/",
] as const;

const MAX_SOURCE_SAMPLES = 5;

const COMPONENT_TYPE_SPECS: Array<{ category: CoverageCategory; regexes: RegExp[] }> = [
  {
    category: "Buttons",
    regexes: [
      /<button\b/g,
      /<SignInButton\b/g,
      /className="(?:menu-item|trace-image-row-action-button)"/g,
    ],
  },
  {
    category: "Icon Buttons",
    regexes: [
      /className="(?:toolbar-button|pattern-menu-button|trace-image-row-action-button|file-menu-trigger|gridline-menu-trigger)"/g,
      /<button[^>]*\baria-label=/g,
    ],
  },
  {
    category: "Inputs",
    regexes: [
      /<input\b/g,
      /type="(?:text|number|range|file|color|search|email|url|password)"/g,
    ],
  },
  { category: "Textareas", regexes: [/<textarea\b/g] },
  {
    category: "Selects / Dropdowns",
    regexes: [
      /<select\b/g,
      /className="(?:file-menu-trigger|gridline-menu-trigger|pattern-menu-button)"/g,
      /aria-haspopup="(?:menu|listbox)"/g,
    ],
  },
  {
    category: "Checkboxes / Toggles",
    regexes: [/type="checkbox"/g, /role="switch"/g, /<Toggle\b/g, /aria-checked=/g],
  },
  {
    category: "Modals / Dialogs / Popovers",
    regexes: [
      /role="dialog"/g,
      /aria-modal="true"/g,
      /createPortal\(/g,
      /aria-haspopup="dialog"/g,
      /<(?:ConfirmDialog|DraftPickerDialog|VersionHistoryDialog)\b/g,
    ],
  },
  {
    category: "Cards / Panels / Containers",
    regexes: [
      /className="app-card"/g,
      /className="pattern-sidebar"/g,
      /className="pattern-canvas-shell"/g,
      /PANEL_STYLE/g,
      /sidebarCardStyle/g,
      /cardStyle/g,
    ],
  },
  {
    category: "Badges / Tags / Chips",
    regexes: [
      /formatDmcLabel/g,
      /borderRadius:\s*999/g,
      /minWidth:\s*14/g,
      /\bbadge\b/gi,
      /\bchip\b/gi,
      /\btag\b/gi,
      /\bpill\b/gi,
    ],
  },
  {
    category: "Nav Items / Tabs",
    regexes: [
      /role="tablist"/g,
      /role="tab"/g,
      /className="menu-tab-button"/g,
      /className="pattern-menu-button"/g,
      /<nav\b/g,
    ],
  },
  {
    category: "Toolbar Controls",
    regexes: [
      /className="canvas-toolbar"/g,
      /className="toolbar-button"/g,
      /className="zoom-action-button"/g,
      /className="gridline-menu-trigger"/g,
      /className="used-colors-toolbar"/g,
      /className="toolbar-icon"/g,
      /className="toolbar-label"/g,
    ],
  },
  {
    category: "Typography",
    regexes: [/fontSize\s*:/g, /fontWeight\s*:/g, /font-size\s*:/g, /font-weight\s*:/g],
  },
];

const COMPOSITE_PATTERN_SPECS: Array<{ pattern: string; regexes: RegExp[] }> = [
  {
    pattern: "Palette Popups / Pickers",
    regexes: [
      /toolbar-palette-scroll/g,
      /customPaletteQuery/g,
      /expandedPalette/g,
      /popoverRef/g,
      /colorMenuOpen/g,
    ],
  },
  {
    pattern: "Confirmation Dialog Flows",
    regexes: [
      /<ConfirmDialog\b/g,
      /setConfirmDialog\(/g,
      /confirmActionRef\.current/g,
      /confirmLabel:/g,
    ],
  },
  {
    pattern: "Workflow Selection Dialogs",
    regexes: [
      /<DraftPickerDialog\b/g,
      /<VersionHistoryDialog\b/g,
      /aria-label="Load saved WIP"/g,
      /aria-label="Version history"/g,
    ],
  },
  {
    pattern: "Status / Informative Banners",
    regexes: [
      /<VersionPreviewToast\b/g,
      /setWipMessage\(/g,
      /wipStatus\b/g,
      /role="status"/g,
      /aria-live="polite"/g,
      /You're signed out!/g,
    ],
  },
  {
    pattern: "Empty-State Panels",
    regexes: [
      /No palettes yet/g,
      /Create your first palette to begin/g,
      /No versions yet\./g,
      /No saved WIP found yet\./g,
    ],
  },
];

function walkFiles(dir: string, output: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, output);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(tsx|ts|css)$/.test(entry.name)) continue;
    output.push(abs);
  }
}

function gatherAuditFiles(): string[] {
  const files: string[] = [];
  for (const include of INCLUDED_FILES) {
    const abs = path.join(ROOT, include);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      walkFiles(abs, files);
    } else if (stat.isFile()) {
      files.push(abs);
    }
  }
  return [...new Set(files.map((abs) => path.relative(ROOT, abs).replace(/\\/g, "/")))]
    .filter((file) => !EXCLUDED_PATH_PREFIXES.some((prefix) => file.startsWith(prefix)))
    .sort();
}

function loadFile(relativePath: string): string {
  const abs = path.join(ROOT, relativePath);
  const raw = fs.readFileSync(abs, "utf8");
  if (relativePath === "app/globals.css") {
    const idx = raw.indexOf(":root {");
    return idx >= 0 ? raw.slice(idx) : raw;
  }
  return raw;
}

function normalizeValue(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function addValue(map: CountMap, value: string, source: string) {
  const key = value.trim();
  if (!key) return;
  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
    existing.sources.add(source);
    return;
  }
  map.set(key, { count: 1, sources: new Set([source]) });
}

function toFrequencyRows(map: CountMap, limit = 12): FrequencyRow[] {
  return [...map.entries()]
    .map(([value, entry]) => ({
      value,
      count: entry.count,
      sourceCount: entry.sources.size,
      sampleSources: [...entry.sources].sort().slice(0, MAX_SOURCE_SAMPLES),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.value.localeCompare(b.value);
    })
    .slice(0, limit);
}

function captureMatches(map: CountMap, regex: RegExp, content: string, source: string, normalize = true) {
  for (const match of content.matchAll(regex)) {
    const raw = match[1] ?? match[0];
    const value = normalize ? normalizeValue(raw) : raw.trim();
    addValue(map, value, source);
  }
}

function parseClassNames(content: string): string[] {
  const values: string[] = [];
  const regex = /className\s*=\s*"([^"]+)"/g;
  for (const match of content.matchAll(regex)) {
    const classValue = match[1] ?? "";
    classValue
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => values.push(item));
  }
  return values;
}

function isNoiseValue(value: string): boolean {
  const lowered = value.toLowerCase();
  return [
    "inherit",
    "initial",
    "none",
    "normal",
    "auto",
    "transparent",
    "currentcolor",
  ].includes(lowered);
}

function indexToLine(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

export function getDesignAuditStats(): DesignAuditStats {
  const files = gatherAuditFiles();

  const themeColorTokenMap: CountMap = new Map();
  const literalColorMap: CountMap = new Map();
  const tailwindColorClassMap: CountMap = new Map();
  const borderRadiusMap: CountMap = new Map();
  const spacingMap: CountMap = new Map();
  const shadowMap: CountMap = new Map();
  const fontSizeMap: CountMap = new Map();
  const fontWeightMap: CountMap = new Map();
  const buttonClassMap: CountMap = new Map();
  const accentPrimaryButtonSourceMap = new Map<string, { count: number; lineSamples: number[] }>();
  let accentPrimaryButtonTotal = 0;
  const coverageMap = new Map<CoverageCategory, Map<string, { count: number; lineSamples: number[] }>>();
  for (const spec of COMPONENT_TYPE_SPECS) {
    coverageMap.set(spec.category, new Map());
  }
  const compositeCoverageMap = new Map<string, Map<string, { count: number; lineSamples: number[] }>>();
  for (const spec of COMPOSITE_PATTERN_SPECS) {
    compositeCoverageMap.set(spec.pattern, new Map());
  }

  for (const file of files) {
    const content = loadFile(file);

    captureMatches(themeColorTokenMap, /var\(--([a-zA-Z0-9-_]+)\)/g, content, file, false);
    captureMatches(literalColorMap, /(#[0-9a-fA-F]{3,8}\b|rgba?\([^\)]+\)|color-mix\([^\)]+\))/g, content, file, false);

    captureMatches(borderRadiusMap, /borderRadius\s*:\s*("[^"]+"|'[^']+'|`[^`]+`|[0-9.]+)/g, content, file);
    captureMatches(borderRadiusMap, /border-radius\s*:\s*([^;\n]+)/g, content, file);

    captureMatches(
      spacingMap,
      /(?:padding(?:Top|Right|Bottom|Left|Inline|InlineStart|InlineEnd|Block|BlockStart|BlockEnd|X|Y)?|margin(?:Top|Right|Bottom|Left|Inline|InlineStart|InlineEnd|Block|BlockStart|BlockEnd|X|Y)?|gap|rowGap|columnGap)\s*:\s*("[^"]+"|'[^']+'|`[^`]+`|[0-9.]+)/g,
      content,
      file,
    );
    captureMatches(
      spacingMap,
      /(?:padding(?:-top|-right|-bottom|-left|-inline|-block)?|margin(?:-top|-right|-bottom|-left|-inline|-block)?|gap|row-gap|column-gap)\s*:\s*([^;\n]+)/g,
      content,
      file,
    );

    captureMatches(shadowMap, /boxShadow\s*:\s*("[^"]+"|'[^']+'|`[^`]+`|[a-zA-Z0-9_.-]+)/g, content, file);
    captureMatches(shadowMap, /box-shadow\s*:\s*([^;\n]+)/g, content, file);

    captureMatches(fontSizeMap, /fontSize\s*:\s*("[^"]+"|'[^']+'|`[^`]+`|[0-9.]+)/g, content, file);
    captureMatches(fontSizeMap, /font-size\s*:\s*([^;\n]+)/g, content, file);

    captureMatches(fontWeightMap, /fontWeight\s*:\s*("[^"]+"|'[^']+'|`[^`]+`|[0-9.]+)/g, content, file);
    captureMatches(fontWeightMap, /font-weight\s*:\s*([^;\n]+)/g, content, file);

    const accentMatches =
      file.endsWith(".css")
        ? []
        : [
            ...content.matchAll(/background(?:Color)?\s*:\s*(?:"|'|`)?var\(--accent(?:-strong)?\)(?:"|'|`)?/g),
          ];
    if (accentMatches.length > 0) {
      const lineSamples = accentMatches
        .map((match) => indexToLine(content, match.index ?? 0))
        .filter((line, idx, all) => all.indexOf(line) === idx)
        .slice(0, 8);
      const existing = accentPrimaryButtonSourceMap.get(file);
      if (existing) {
        existing.count += accentMatches.length;
        for (const line of lineSamples) {
          if (!existing.lineSamples.includes(line)) {
            existing.lineSamples.push(line);
          }
        }
      } else {
        accentPrimaryButtonSourceMap.set(file, { count: accentMatches.length, lineSamples });
      }
      accentPrimaryButtonTotal += accentMatches.length;
    }

    for (const spec of COMPONENT_TYPE_SPECS) {
      const categorySources = coverageMap.get(spec.category);
      if (!categorySources) continue;
      let categoryMatchCount = 0;
      const lineSampleSet = new Set<number>();

      for (const regex of spec.regexes) {
        regex.lastIndex = 0;
        const matches = [...content.matchAll(regex)];
        categoryMatchCount += matches.length;
        for (const match of matches) {
          lineSampleSet.add(indexToLine(content, match.index ?? 0));
        }
      }

      if (categoryMatchCount === 0) continue;
      const lineSamples = [...lineSampleSet].sort((a, b) => a - b).slice(0, 10);
      const existing = categorySources.get(file);
      if (existing) {
        existing.count += categoryMatchCount;
        for (const line of lineSamples) {
          if (!existing.lineSamples.includes(line)) {
            existing.lineSamples.push(line);
          }
        }
      } else {
        categorySources.set(file, { count: categoryMatchCount, lineSamples });
      }
    }

    for (const spec of COMPOSITE_PATTERN_SPECS) {
      const compositeSources = compositeCoverageMap.get(spec.pattern);
      if (!compositeSources) continue;
      let compositeMatchCount = 0;
      const lineSampleSet = new Set<number>();

      for (const regex of spec.regexes) {
        regex.lastIndex = 0;
        const matches = [...content.matchAll(regex)];
        compositeMatchCount += matches.length;
        for (const match of matches) {
          lineSampleSet.add(indexToLine(content, match.index ?? 0));
        }
      }

      if (compositeMatchCount === 0) continue;
      const lineSamples = [...lineSampleSet].sort((a, b) => a - b).slice(0, 10);
      const existing = compositeSources.get(file);
      if (existing) {
        existing.count += compositeMatchCount;
        for (const line of lineSamples) {
          if (!existing.lineSamples.includes(line)) {
            existing.lineSamples.push(line);
          }
        }
      } else {
        compositeSources.set(file, { count: compositeMatchCount, lineSamples });
      }
    }

    const classes = parseClassNames(content);
    for (const className of classes) {
      if (/(?:^|-)button(?:-|$)|menu-item|file-menu-trigger|gridline-menu-trigger|toolbar-icon|toolbar-label/.test(className)) {
        addValue(buttonClassMap, className, file);
      }
      if (/^(?:bg|text|border)-[a-z]+(?:-[0-9]{2,3})?$/.test(className)) {
        addValue(tailwindColorClassMap, className, file);
      }
    }
  }

  function filteredRows(map: CountMap, limit = 12) {
    const filtered: CountMap = new Map();
    for (const [value, entry] of map.entries()) {
      if (isNoiseValue(value)) continue;
      filtered.set(value, entry);
    }
    return toFrequencyRows(filtered, limit);
  }

  const componentTypeCoverage: ComponentTypeCoverageRow[] = COMPONENT_TYPE_SPECS.map((spec) => {
    const categorySources = coverageMap.get(spec.category) ?? new Map<string, { count: number; lineSamples: number[] }>();
    const rows: SourceOccurrenceRow[] = [...categorySources.entries()]
      .map(([sourceFile, value]) => ({
        sourceFile,
        count: value.count,
        lineSamples: [...value.lineSamples].sort((a, b) => a - b).slice(0, 8),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.sourceFile.localeCompare(b.sourceFile);
      });
    return {
      category: spec.category,
      totalMatches: rows.reduce((acc, row) => acc + row.count, 0),
      sourceCount: rows.length,
      sources: rows,
    };
  });

  const compositePatternCoverage: CompositePatternCoverageRow[] = COMPOSITE_PATTERN_SPECS.map((spec) => {
    const patternSources = compositeCoverageMap.get(spec.pattern) ?? new Map<string, { count: number; lineSamples: number[] }>();
    const rows: SourceOccurrenceRow[] = [...patternSources.entries()]
      .map(([sourceFile, value]) => ({
        sourceFile,
        count: value.count,
        lineSamples: [...value.lineSamples].sort((a, b) => a - b).slice(0, 8),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.sourceFile.localeCompare(b.sourceFile);
      });
    return {
      pattern: spec.pattern,
      totalMatches: rows.reduce((acc, row) => acc + row.count, 0),
      sourceCount: rows.length,
      sources: rows,
    };
  });

  return {
    analyzedFileCount: files.length,
    analyzedFiles: files,
    themeColorTokens: filteredRows(themeColorTokenMap, 16),
    literalColorValues: filteredRows(literalColorMap, 16),
    tailwindColorClasses: filteredRows(tailwindColorClassMap, 12),
    borderRadiusValues: filteredRows(borderRadiusMap, 16),
    spacingValues: filteredRows(spacingMap, 16),
    shadowValues: filteredRows(shadowMap, 16),
    fontSizeValues: filteredRows(fontSizeMap, 16),
    fontWeightValues: filteredRows(fontWeightMap, 16),
    buttonLikeClassPatterns: filteredRows(buttonClassMap, 16),
    accentPrimaryButtonTotal,
    accentPrimaryButtonSources: [...accentPrimaryButtonSourceMap.entries()]
      .map(([sourceFile, value]) => ({
        sourceFile,
        count: value.count,
        lineSamples: value.lineSamples.sort((a, b) => a - b).slice(0, 8),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.sourceFile.localeCompare(b.sourceFile);
      }),
    componentTypeCoverage,
    compositePatternCoverage,
  };
}

export type {
  DesignAuditStats,
  FrequencyRow,
  SourceOccurrenceRow,
  ComponentTypeCoverageRow,
  CompositePatternCoverageRow,
  CoverageCategory,
};
