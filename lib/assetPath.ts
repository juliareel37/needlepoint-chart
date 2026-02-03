// const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// export function assetPath(path: string) {
//   if (!path.startsWith("/")) {
//     return `${BASE_PATH}/${path}`;
//   }
//   return `${BASE_PATH}${path}`;
// }
// src/lib/assetPath.ts



// const REPO = "needlepoint-chart";
// const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? `/${REPO}`;

// export function assetPath(p: string) {
//   const path = p.startsWith("/") ? p : `/${p}`;
//   return `${BASE.replace(/\/$/, "")}${path}`;
// }


// src/lib/assetPath.ts

export function assetPath(p: string) {
  return p.startsWith("/") ? p : `/${p}`;
}
