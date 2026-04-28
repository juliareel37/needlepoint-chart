export const EDITOR_V2_MIN_GRID_SIZE = 1;

// Temporary implementation guardrail while large-grid support continues to mature.
export const EDITOR_V2_MAX_GRID_SIZE = 300;

export const EDITOR_V2_SAVE_MODE =
  process.env.NEXT_PUBLIC_EDITOR_V2_SAVE_MODE === "manual"
    ? "manual"
    : "autosave";
