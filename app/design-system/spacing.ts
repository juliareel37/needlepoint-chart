export const space = {
  0: "0px",
  4: "4px",
  8: "8px",
  12: "12px",
  16: "16px",
  20: "20px",
  24: "24px",
  28: "28px",
  32: "32px",
  40: "40px",
  44: "44px",
} as const;

export type SpaceToken = keyof typeof space;
