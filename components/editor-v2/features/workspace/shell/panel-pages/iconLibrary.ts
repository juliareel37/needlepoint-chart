export interface ShapeIconLibraryItem {
  id: string;
  name: string;
  category: "Shapes" | "Frames";
  src: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
}

export const SHAPE_ICON_LIBRARY: ShapeIconLibraryItem[] = [
  {
    id: "heart",
    name: "Heart",
    category: "Shapes",
    src: "/icons/shapes/heart.svg",
    intrinsicWidth: 110,
    intrinsicHeight: 135,
  },
  {
    id: "flower",
    name: "Flower",
    category: "Shapes",
    src: "/icons/shapes/flower.svg",
    intrinsicWidth: 100,
    intrinsicHeight: 125,
  },
  {
    id: "hydrangea",
    name: "Hydrangea",
    category: "Shapes",
    src: "/icons/shapes/hydrangea.svg",
    intrinsicWidth: 512,
    intrinsicHeight: 640,
  },
  {
    id: "star",
    name: "Star",
    category: "Shapes",
    src: "/icons/shapes/noun-star-4960592.svg",
    intrinsicWidth: 100,
    intrinsicHeight: 125,
  },
  {
    id: "teddy-bear",
    name: "Teddy Bear",
    category: "Shapes",
    src: "/icons/shapes/teddy-bear.svg",
    intrinsicWidth: 110,
    intrinsicHeight: 135,
  },
  {
    id: "frame-1",
    name: "Frame 1",
    category: "Frames",
    src: "/icons/shapes/frames/frame-1.svg",
    intrinsicWidth: 110,
    intrinsicHeight: 135,
  },
  {
    id: "frame-2",
    name: "Frame 2",
    category: "Frames",
    src: "/icons/shapes/frames/frame-2.svg",
    intrinsicWidth: 110,
    intrinsicHeight: 135,
  },
  {
    id: "frame-3",
    name: "Frame 3",
    category: "Frames",
    src: "/icons/shapes/frames/frame-3.svg",
    intrinsicWidth: 100,
    intrinsicHeight: 125,
  },
  {
    id: "ornate-frame",
    name: "Ornate Frame",
    category: "Frames",
    src: "/icons/shapes/frames/noun-frame-7769731.svg",
    intrinsicWidth: 110,
    intrinsicHeight: 135,
  },
  {
    id: "squiggle-frame",
    name: "Squiggle Frame",
    category: "Frames",
    src: "/icons/shapes/frames/squiggle_frame_outline.svg",
    intrinsicWidth: 2000,
    intrinsicHeight: 1500,
  },
];
