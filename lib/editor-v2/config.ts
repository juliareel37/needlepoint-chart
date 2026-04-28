export const EDITOR_V2_MIN_GRID_SIZE = 1;

// Temporary implementation guardrail while large-grid support continues to mature.
export const EDITOR_V2_MAX_GRID_SIZE = 300;

export const APP_MODE =
  process.env.NEXT_PUBLIC_APP_MODE === "prod" ? "prod" : "dev";

export const IS_DEV_APP_MODE = APP_MODE === "dev";

export const EDITOR_V2_SAVE_MODE =
  process.env.NEXT_PUBLIC_EDITOR_V2_SAVE_MODE === "manual"
    ? "manual"
    : "autosave";
