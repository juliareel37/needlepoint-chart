export type BrandImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  type?: string;
};

export type BrandHeaderLogoPart = BrandImageAsset & {
  displayHeight: number;
};

export type BrandComposedLogoAsset = {
  gap: number;
  parts: readonly [BrandHeaderLogoPart, ...BrandHeaderLogoPart[]];
};

// Swap app-wide logo and favicon files here.
export const brandAssets = {
  header: {
    compact: {
      src: "/logos/spruce/logo-square.png",
      alt: "Wippa",
      width: 344,
      height: 72,
    },
    long: {
      gap: 4,
      parts: [
        {
          src: "/logos/spruce/logo-square.png",
          alt: "Wippa",
          width: 344,
          height: 72,
          displayHeight: 32,
        },
        {
          src: "/logos/wippa-text-parkinsans.png",
          alt: "",
          width: 344,
          height: 72,
          displayHeight: 28,
        },
      ],
    },
  },
  footer: {
    gap: 4,
    parts: [
      {
        src: "/logos/spruce/logo-square.png",
        alt: "Wippa",
        width: 344,
        height: 72,
        displayHeight: 26,
      },
      {
        src: "/logos/wippa-text-parkinsans.png",
        alt: "",
        width: 344,
        height: 72,
        displayHeight: 22,
      },
    ],
  },
  favicon: {
    src: "/logos/spruce/logo-square-pink.png",
    alt: "Wippa",
    width: 300,
    height: 300,
    type: "image/png",
  },
} satisfies {
  header: {
    compact: BrandImageAsset;
    long: BrandComposedLogoAsset;
  };
  footer: BrandComposedLogoAsset;
  favicon: BrandImageAsset;
};
