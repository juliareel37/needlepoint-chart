export const SYMBOLS = [
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "?",
  "+",
  "=",
  "~",
  "/",
  "\\",
  "|",
  "<",
  ">",
  "[",
  "]",
  "{",
  "}",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "2",
  "3",
  "4",
  "6",
  "7",
  "8",
  "9",
  "5",
];

export function symbolForColorId(id: number, symbolMap?: Map<number, string>) {
  if (symbolMap && symbolMap.size > 0) {
    const mapped = symbolMap.get(id);
    if (mapped) return mapped;
  }
  if (SYMBOLS.length === 0) return "";
  return SYMBOLS[Math.abs(id) % SYMBOLS.length];
}

export function appendSymbolAssignments(
  existingAssignments: Record<string, string>,
  colorIds: string[],
): Record<string, string> {
  const appendedAssignments: Record<string, string> = {};
  const assignedSymbols = new Set(Object.values(existingAssignments));

  for (const colorId of colorIds) {
    if (existingAssignments[colorId] || appendedAssignments[colorId]) {
      continue;
    }

    const nextSymbol = getNextAvailableSymbol(assignedSymbols);
    appendedAssignments[colorId] = nextSymbol;
    assignedSymbols.add(nextSymbol);
  }

  return appendedAssignments;
}

export function ensureSymbolAssignmentsForCells(
  cells: Array<string | null>,
  existingAssignments: Record<string, string>,
): Record<string, string> {
  const colorIdsInUsageOrder: string[] = [];
  const seenColorIds = new Set<string>();

  for (const cell of cells) {
    if (!cell || seenColorIds.has(cell)) {
      continue;
    }

    seenColorIds.add(cell);
    colorIdsInUsageOrder.push(cell);
  }

  return {
    ...existingAssignments,
    ...appendSymbolAssignments(existingAssignments, colorIdsInUsageOrder),
  };
}

function getNextAvailableSymbol(assignedSymbols: Set<string>): string {
  for (const symbol of SYMBOLS) {
    if (!assignedSymbols.has(symbol)) {
      return symbol;
    }
  }

  if (SYMBOLS.length === 0) {
    return "";
  }

  return SYMBOLS[assignedSymbols.size % SYMBOLS.length];
}
