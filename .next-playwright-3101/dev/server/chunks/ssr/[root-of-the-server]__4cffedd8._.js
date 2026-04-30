module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/app/design-system/spacing.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "space",
    ()=>space
]);
const space = {
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
    44: "44px"
};
}),
"[project]/app/design-system/typography.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fontWeights",
    ()=>fontWeights,
    "typographyOrder",
    ()=>typographyOrder,
    "typographySpecs",
    ()=>typographySpecs,
    "typographyStyles",
    ()=>typographyStyles
]);
const fontWeights = {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
};
const typographyOrder = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "p1",
    "p2",
    "s"
];
const typographySpecs = {
    h1: {
        label: "h1",
        size: 28,
        lineHeight: 36,
        weight: fontWeights.bold,
        usage: "hero titles, page titles",
        sample: "Header One"
    },
    h2: {
        label: "h2",
        size: 22,
        lineHeight: 30,
        weight: fontWeights.bold,
        usage: "section titles, major dialogs",
        sample: "Header Two"
    },
    h3: {
        label: "h3",
        size: 18,
        lineHeight: 24,
        weight: fontWeights.bold,
        usage: "subsection titles",
        sample: "Header Three"
    },
    h4: {
        label: "h4",
        size: 15,
        lineHeight: 20,
        weight: fontWeights.bold,
        usage: "minor headings, card titles",
        sample: "Header Four"
    },
    h5: {
        label: "h5",
        size: 13,
        lineHeight: 18,
        weight: fontWeights.bold,
        usage: "compact emphasis headings, alert titles",
        sample: "Header Five"
    },
    p1: {
        label: "p1",
        size: 14,
        lineHeight: 20,
        weight: fontWeights.medium,
        usage: "primary body copy",
        sample: "Primary body copy"
    },
    p2: {
        label: "p2",
        size: 12,
        lineHeight: 18,
        weight: fontWeights.medium,
        usage: "secondary UI/body text",
        sample: "Secondary body copy"
    },
    s: {
        label: "s",
        size: 12,
        lineHeight: 14,
        weight: fontWeights.regular,
        usage: "supporting labels, dense UI",
        sample: "Support text"
    }
};
const typographyStyles = Object.fromEntries(Object.keys(typographySpecs).map((token)=>{
    const spec = typographySpecs[token];
    return [
        token,
        {
            fontSize: spec.size,
            lineHeight: `${spec.lineHeight}px`,
            fontWeight: spec.weight
        }
    ];
}));
}),
"[project]/components/design-system/Button.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "button": "Button-module__TDaHcW__button",
  "destructive": "Button-module__TDaHcW__destructive",
  "ghost": "Button-module__TDaHcW__ghost",
  "ghostV2": "Button-module__TDaHcW__ghostV2",
  "glyph": "Button-module__TDaHcW__glyph",
  "icon": "Button-module__TDaHcW__icon",
  "lg": "Button-module__TDaHcW__lg",
  "md": "Button-module__TDaHcW__md",
  "primary": "Button-module__TDaHcW__primary",
  "secondary": "Button-module__TDaHcW__secondary",
  "secondary2": "Button-module__TDaHcW__secondary2",
  "sm": "Button-module__TDaHcW__sm",
  "toolbarX": "Button-module__TDaHcW__toolbarX",
});
}),
"[project]/lib/assetPath.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

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
__turbopack_context__.s([
    "assetPath",
    ()=>assetPath
]);
function assetPath(p) {
    return p.startsWith("/") ? p : `/${p}`;
}
}),
"[project]/components/design-system/Button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "ButtonIcon",
    ()=>ButtonIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$spacing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/spacing.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Button.module.css [app-ssr] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/assetPath.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const sizeStyles = {
    sm: {
        padding: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$spacing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["space"][8]} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$spacing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["space"][12]}`,
        fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].s.size,
        lineHeight: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].s.lineHeight}px`
    },
    md: {
        padding: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$spacing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["space"][8]} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$spacing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["space"][16]}`,
        fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].p2.size,
        lineHeight: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].p2.lineHeight}px`
    },
    lg: {
        padding: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$spacing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["space"][12]} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$spacing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["space"][20]}`,
        fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].p1.size,
        lineHeight: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].p1.lineHeight}px`,
        fontWeight: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].p1.weight
    }
};
function Button({ active = false, children, className, inertWhenActive = false, onClick, size = "md", style, variant = "secondary", ...props }) {
    const isInertActive = active && inertWhenActive;
    const classes = [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].button,
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"][size],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"][variant],
        className
    ].filter(Boolean).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        ...props,
        className: classes,
        "data-active": active ? "true" : undefined,
        "data-inert-active": isInertActive ? "true" : undefined,
        onClick: (event)=>{
            if (isInertActive) {
                event.preventDefault();
                return;
            }
            onClick?.(event);
        },
        style: {
            ...sizeStyles[size],
            ...style
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Button.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
function ButtonIcon({ icon, className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ...props,
        "aria-hidden": props["aria-hidden"] ?? "true",
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].icon,
            className
        ].filter(Boolean).join(" "),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].glyph,
            style: {
                WebkitMaskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(icon)})`,
                maskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(icon)})`
            }
        }, void 0, false, {
            fileName: "[project]/components/design-system/Button.tsx",
            lineNumber: 102,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/Button.tsx",
        lineNumber: 97,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/design-system/Checkbox.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "checkbox": "Checkbox-module__B0ocQa__checkbox",
  "checkboxField": "Checkbox-module__B0ocQa__checkboxField",
  "label": "Checkbox-module__B0ocQa__label",
});
}),
"[project]/components/design-system/Checkbox.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Checkbox",
    ()=>Checkbox,
    "CheckboxField",
    ()=>CheckboxField
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Checkbox$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Checkbox.module.css [app-ssr] (css module)");
"use client";
;
;
;
function Checkbox({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        ...props,
        type: "checkbox",
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Checkbox$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkbox,
            className
        ].filter(Boolean).join(" ")
    }, void 0, false, {
        fileName: "[project]/components/design-system/Checkbox.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
function CheckboxField({ checkboxClassName, children, className, labelClassName, labelStyle, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Checkbox$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkboxField,
            className
        ].filter(Boolean).join(" "),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Checkbox, {
                ...props,
                className: checkboxClassName
            }, void 0, false, {
                fileName: "[project]/components/design-system/Checkbox.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Checkbox$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                    labelClassName
                ].filter(Boolean).join(" "),
                style: {
                    ...__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                    ...labelStyle
                },
                children: children
            }, void 0, false, {
                fileName: "[project]/components/design-system/Checkbox.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/Checkbox.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/design-system/Field.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "checkboxRow": "Field-module__7YIXTG__checkboxRow",
  "control": "Field-module__7YIXTG__control",
  "controlWithSuffix": "Field-module__7YIXTG__controlWithSuffix",
  "field": "Field-module__7YIXTG__field",
  "hint": "Field-module__7YIXTG__hint",
  "inputWithSuffix": "Field-module__7YIXTG__inputWithSuffix",
  "label": "Field-module__7YIXTG__label",
  "suffix": "Field-module__7YIXTG__suffix",
});
}),
"[project]/components/design-system/Field.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Field",
    ()=>Field,
    "FieldCheckboxRow",
    ()=>FieldCheckboxRow,
    "FieldInput",
    ()=>FieldInput,
    "FieldSelect",
    ()=>FieldSelect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Field.module.css [app-ssr] (css module)");
"use client";
;
;
;
function Field({ children, hint, label }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].field,
        children: [
            label ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                children: label
            }, void 0, false, {
                fileName: "[project]/components/design-system/Field.tsx",
                lineNumber: 24,
                columnNumber: 9
            }, this) : null,
            children,
            hint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].hint,
                style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].s,
                children: hint
            }, void 0, false, {
                fileName: "[project]/components/design-system/Field.tsx",
                lineNumber: 30,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/Field.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
function FieldInput({ className, suffix, style, ...props }) {
    const input = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
            suffix ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].controlWithSuffix : null,
            className
        ].filter(Boolean).join(" "),
        style: {
            ...inputTypographyStyle,
            ...style
        }
    }, void 0, false, {
        fileName: "[project]/components/design-system/Field.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
    if (!suffix) {
        return input;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].inputWithSuffix,
        children: [
            input,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": "true",
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].suffix,
                children: suffix
            }, void 0, false, {
                fileName: "[project]/components/design-system/Field.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/Field.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
function FieldSelect({ children, className, style, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].control,
            className
        ].filter(Boolean).join(" "),
        style: {
            ...inputTypographyStyle,
            ...style
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Field.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, this);
}
function FieldCheckboxRow({ children, className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkboxRow,
            className
        ].filter(Boolean).join(" "),
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Field.tsx",
        lineNumber: 97,
        columnNumber: 5
    }, this);
}
const inputTypographyStyle = {
    fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2.fontSize,
    lineHeight: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2.lineHeight,
    fontWeight: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2.fontWeight
};
}),
"[project]/components/design-system/Menu.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "caretIcon": "Menu-module__ly_pJW__caretIcon",
  "checkboxIcon": "Menu-module__ly_pJW__checkboxIcon",
  "checkmark": "Menu-module__ly_pJW__checkmark",
  "chevronIcon": "Menu-module__ly_pJW__chevronIcon",
  "divider": "Menu-module__ly_pJW__divider",
  "item": "Menu-module__ly_pJW__item",
  "itemContent": "Menu-module__ly_pJW__itemContent",
  "itemLabel": "Menu-module__ly_pJW__itemLabel",
  "itemLeading": "Menu-module__ly_pJW__itemLeading",
  "itemTrailing": "Menu-module__ly_pJW__itemTrailing",
  "leadingIcon": "Menu-module__ly_pJW__leadingIcon",
  "placeholder": "Menu-module__ly_pJW__placeholder",
  "radioDot": "Menu-module__ly_pJW__radioDot",
  "radioIcon": "Menu-module__ly_pJW__radioIcon",
  "selectionIcon": "Menu-module__ly_pJW__selectionIcon",
  "surface": "Menu-module__ly_pJW__surface",
  "trailingCheck": "Menu-module__ly_pJW__trailingCheck",
  "trigger": "Menu-module__ly_pJW__trigger",
  "triggerDefault": "Menu-module__ly_pJW__triggerDefault",
  "triggerGhost": "Menu-module__ly_pJW__triggerGhost",
  "triggerSelection": "Menu-module__ly_pJW__triggerSelection",
  "triggerUpward": "Menu-module__ly_pJW__triggerUpward",
});
}),
"[project]/components/design-system/Menu.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MenuCaretIcon",
    ()=>MenuCaretIcon,
    "MenuCheckboxIcon",
    ()=>MenuCheckboxIcon,
    "MenuChevronIcon",
    ()=>MenuChevronIcon,
    "MenuDivider",
    ()=>MenuDivider,
    "MenuItem",
    ()=>MenuItem,
    "MenuLeadingIcon",
    ()=>MenuLeadingIcon,
    "MenuPlaceholder",
    ()=>MenuPlaceholder,
    "MenuRadioIcon",
    ()=>MenuRadioIcon,
    "MenuSurface",
    ()=>MenuSurface,
    "MenuTrailingCheck",
    ()=>MenuTrailingCheck,
    "MenuTrigger",
    ()=>MenuTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Menu.module.css [app-ssr] (css module)");
"use client";
;
;
;
;
function MenuTrigger({ children, className, open = false, style, variant = "default", ...props }) {
    const classes = [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].trigger,
        variant === "default" ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].triggerDefault : variant === "selection" ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].triggerSelection : variant === "ghost" ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].triggerGhost : __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].triggerUpward,
        className
    ].filter(Boolean).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        ...props,
        className: classes,
        "data-open": open ? "true" : undefined,
        style: {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
            ...style
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
const MenuSurface = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(function MenuSurface({ children, className, style, ...props }, ref) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ...props,
        ref: ref,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].surface,
            className
        ].filter(Boolean).join(" "),
        style: style,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 67,
        columnNumber: 7
    }, this);
});
function MenuItem({ active = false, children, className, leading, layout = "leading", style, trailing, ...props }) {
    const classes = [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].item,
        layout === "trailing" ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemTrailing : __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemLeading,
        className
    ].filter(Boolean).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        ...props,
        className: classes,
        "data-active": active ? "true" : undefined,
        style: {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
            ...style
        },
        children: [
            leading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemContent,
                children: leading
            }, void 0, false, {
                fileName: "[project]/components/design-system/Menu.tsx",
                lineNumber: 113,
                columnNumber: 18
            }, this) : null,
            !leading || layout === "trailing" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemLabel,
                children: children
            }, void 0, false, {
                fileName: "[project]/components/design-system/Menu.tsx",
                lineNumber: 115,
                columnNumber: 9
            }, this) : null,
            leading && layout === "leading" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemLabel,
                children: children
            }, void 0, false, {
                fileName: "[project]/components/design-system/Menu.tsx",
                lineNumber: 118,
                columnNumber: 9
            }, this) : null,
            trailing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemContent,
                children: trailing
            }, void 0, false, {
                fileName: "[project]/components/design-system/Menu.tsx",
                lineNumber: 120,
                columnNumber: 19
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
function MenuDivider({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ...props,
        "aria-hidden": "true",
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].divider,
            className
        ].filter(Boolean).join(" ")
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 130,
        columnNumber: 5
    }, this);
}
function MenuRadioIcon({ checked }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "aria-hidden": "true",
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].selectionIcon,
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].radioIcon
        ].join(" "),
        "data-checked": checked ? "true" : undefined,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].radioDot,
            "data-checked": checked ? "true" : undefined
        }, void 0, false, {
            fileName: "[project]/components/design-system/Menu.tsx",
            lineNumber: 145,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 140,
        columnNumber: 5
    }, this);
}
function MenuCheckboxIcon({ checked }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "aria-hidden": "true",
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].selectionIcon,
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkboxIcon
        ].join(" "),
        "data-checked": checked ? "true" : undefined,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].checkmark,
            "data-checked": checked ? "true" : undefined,
            style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].s,
            children: "✓"
        }, void 0, false, {
            fileName: "[project]/components/design-system/Menu.tsx",
            lineNumber: 160,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 155,
        columnNumber: 5
    }, this);
}
function MenuTrailingCheck({ active }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "aria-hidden": "true",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].trailingCheck,
        "data-active": active ? "true" : undefined,
        style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].s,
        children: "✓"
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 173,
        columnNumber: 5
    }, this);
}
function MenuCaretIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 16 16",
        width: "12",
        height: "12",
        "aria-hidden": "true",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].caretIcon,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M6.25 3.5 10.75 8l-4.5 4.5",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.25",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }, void 0, false, {
            fileName: "[project]/components/design-system/Menu.tsx",
            lineNumber: 193,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 186,
        columnNumber: 5
    }, this);
}
function MenuChevronIcon({ open, direction = "down" }) {
    const pointsDown = direction === "down" ? !open : open;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 16 16",
        width: "12",
        height: "12",
        "aria-hidden": "true",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].chevronIcon,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: pointsDown ? "M3.5 6 8 10.5 12.5 6" : "M3.5 10 8 5.5 12.5 10",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.25",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }, void 0, false, {
            fileName: "[project]/components/design-system/Menu.tsx",
            lineNumber: 222,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 215,
        columnNumber: 5
    }, this);
}
function MenuLeadingIcon({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].leadingIcon,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 235,
        columnNumber: 10
    }, this);
}
function MenuPlaceholder({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].placeholder,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Menu.tsx",
        lineNumber: 243,
        columnNumber: 10
    }, this);
}
}),
"[project]/components/design-system/Modal.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "actions": "Modal-module__Ql2Ema__actions",
  "badge": "Modal-module__Ql2Ema__badge",
  "badgeIcon": "Modal-module__Ql2Ema__badgeIcon",
  "body": "Modal-module__Ql2Ema__body",
  "card": "Modal-module__Ql2Ema__card",
  "closeButton": "Modal-module__Ql2Ema__closeButton",
  "content": "Modal-module__Ql2Ema__content",
  "description": "Modal-module__Ql2Ema__description",
  "header": "Modal-module__Ql2Ema__header",
  "overlay": "Modal-module__Ql2Ema__overlay",
  "title": "Modal-module__Ql2Ema__title",
  "titleWrap": "Modal-module__Ql2Ema__titleWrap",
});
}),
"[project]/components/design-system/Modal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Modal",
    ()=>Modal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/assetPath.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Modal.module.css [app-ssr] (css module)");
"use client";
;
;
;
;
;
;
;
const toneConfig = {
    info: {
        badgeBackground: "var(--brand-200)",
        badgeForeground: "var(--brand-600)",
        icon: "/icons/lucide/info.svg"
    },
    confirmation: {
        badgeBackground: "var(--status-success-soft)",
        badgeForeground: "var(--status-success-strong)",
        icon: "/icons/lucide/check.svg"
    },
    warning: {
        badgeBackground: "var(--status-warning-soft)",
        badgeForeground: "var(--status-warning-strong)",
        icon: "/icons/lucide/alert.svg"
    },
    fail: {
        badgeBackground: "var(--status-destructive-soft)",
        badgeForeground: "var(--status-destructive-strong)",
        icon: "/icons/lucide/alert.svg"
    }
};
function Modal({ isOpen, title, description, dismissLabel, confirmLabel, onDismiss, onConfirm, onClose, confirmVariant = "primary", tone = "none", closeOnBackdropClick = false, closeOnEscape = false, confirmDisabled = false, dismissDisabled = false, showCloseButton = false }) {
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const titleId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    const descriptionId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMounted(true);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isOpen || !closeOnEscape) {
            return;
        }
        const handleKeyDown = (event)=>{
            if (event.key === "Escape") {
                event.preventDefault();
                (onClose ?? onDismiss)();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return ()=>window.removeEventListener("keydown", handleKeyDown);
    }, [
        closeOnEscape,
        isOpen,
        onClose,
        onDismiss
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isOpen) {
            return;
        }
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return ()=>{
            document.body.style.overflow = previousOverflow;
        };
    }, [
        isOpen
    ]);
    if (!mounted || !isOpen) {
        return null;
    }
    const handleClose = onClose ?? onDismiss;
    const toneStyles = tone === "none" ? null : toneConfig[tone];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].overlay,
        onClick: ()=>{
            if (closeOnBackdropClick) {
                handleClose();
            }
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": titleId,
            "aria-describedby": descriptionId,
            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].card,
            onClick: (event)=>event.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].body,
                    children: [
                        toneStyles ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].badge,
                            "aria-hidden": "true",
                            style: {
                                background: toneStyles.badgeBackground,
                                color: toneStyles.badgeForeground
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].badgeIcon,
                                style: {
                                    WebkitMaskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(toneStyles.icon)})`,
                                    maskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(toneStyles.icon)})`
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/design-system/Modal.tsx",
                                lineNumber: 144,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/design-system/Modal.tsx",
                            lineNumber: 136,
                            columnNumber: 13
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].content,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].titleWrap,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                id: titleId,
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].title,
                                                style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].h4,
                                                children: title
                                            }, void 0, false, {
                                                fileName: "[project]/components/design-system/Modal.tsx",
                                                lineNumber: 157,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/design-system/Modal.tsx",
                                            lineNumber: 156,
                                            columnNumber: 15
                                        }, this),
                                        showCloseButton ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                            type: "button",
                                            variant: "ghostV2",
                                            size: "sm",
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].closeButton,
                                            "aria-label": "Close modal",
                                            onClick: handleClose,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: "/icons/lucide/x.svg",
                                                alt: "",
                                                "aria-hidden": "true",
                                                width: "12",
                                                height: "12"
                                            }, void 0, false, {
                                                fileName: "[project]/components/design-system/Modal.tsx",
                                                lineNumber: 170,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/design-system/Modal.tsx",
                                            lineNumber: 162,
                                            columnNumber: 17
                                        }, this) : null
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/design-system/Modal.tsx",
                                    lineNumber: 155,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    id: descriptionId,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].description,
                                    style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/components/design-system/Modal.tsx",
                                    lineNumber: 175,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/design-system/Modal.tsx",
                            lineNumber: 154,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/design-system/Modal.tsx",
                    lineNumber: 134,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].actions,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            type: "button",
                            variant: "secondary",
                            onClick: onDismiss,
                            disabled: dismissDisabled,
                            children: dismissLabel
                        }, void 0, false, {
                            fileName: "[project]/components/design-system/Modal.tsx",
                            lineNumber: 182,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            type: "button",
                            variant: confirmVariant,
                            onClick: onConfirm,
                            disabled: confirmDisabled,
                            children: confirmLabel
                        }, void 0, false, {
                            fileName: "[project]/components/design-system/Modal.tsx",
                            lineNumber: 190,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/design-system/Modal.tsx",
                    lineNumber: 181,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/design-system/Modal.tsx",
            lineNumber: 126,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/Modal.tsx",
        lineNumber: 118,
        columnNumber: 5
    }, this), document.body);
}
}),
"[project]/components/design-system/Notification.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "card": "Notification-module__AVCTBG__card",
  "closeButton": "Notification-module__AVCTBG__closeButton",
  "closeGhost": "Notification-module__AVCTBG__closeGhost",
  "compact": "Notification-module__AVCTBG__compact",
  "content": "Notification-module__AVCTBG__content",
  "controls": "Notification-module__AVCTBG__controls",
  "description": "Notification-module__AVCTBG__description",
  "icon": "Notification-module__AVCTBG__icon",
  "iconBadge": "Notification-module__AVCTBG__iconBadge",
  "title": "Notification-module__AVCTBG__title",
});
}),
"[project]/components/design-system/Notification.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Notification",
    ()=>Notification
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/assetPath.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Notification.module.css [app-ssr] (css module)");
"use client";
;
;
;
;
;
const toneConfig = {
    info: {
        background: "var(--brand-lightest)",
        border: "var(--brand-200)",
        icon: "/icons/lucide/info.svg",
        badge: "var(--brand-200)",
        badgeForeground: "var(--brand-600)"
    },
    success: {
        background: "var(--status-success-soft)",
        border: "var(--status-success-base)",
        icon: "/icons/lucide/check.svg",
        badge: "var(--status-success-base)",
        badgeForeground: "var(--neutral-0)"
    },
    warning: {
        background: "var(--status-warning-soft)",
        border: "var(--status-warning-base)",
        icon: "/icons/lucide/alert.svg",
        badge: "var(--status-warning-base)",
        badgeForeground: "var(--neutral-900)"
    },
    destructive: {
        background: "var(--status-destructive-soft)",
        border: "var(--status-destructive-base)",
        icon: "/icons/lucide/alert.svg",
        badge: "var(--status-destructive-base)",
        badgeForeground: "var(--neutral-0)"
    }
};
function Notification({ tone, title, description, layout = "default", actionLabel, onAction, onDismiss, dismissLabel, neutralSurface = false }) {
    const toneStyles = toneConfig[tone];
    const hasAction = Boolean(actionLabel);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].card,
            layout === "compact" ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].compact : null
        ].filter(Boolean).join(" "),
        style: {
            background: neutralSurface ? "var(--surface-card)" : toneStyles.background,
            borderColor: neutralSurface ? "var(--ui-border-subtle)" : toneStyles.border
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].iconBadge,
                "aria-hidden": "true",
                style: {
                    background: toneStyles.badge,
                    color: toneStyles.badgeForeground
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].icon,
                    style: {
                        WebkitMaskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(toneStyles.icon)})`,
                        maskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(toneStyles.icon)})`
                    }
                }, void 0, false, {
                    fileName: "[project]/components/design-system/Notification.tsx",
                    lineNumber: 87,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/design-system/Notification.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].content,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].title,
                        style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].h5,
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/components/design-system/Notification.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    description ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].description,
                        style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/components/design-system/Notification.tsx",
                        lineNumber: 101,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/components/design-system/Notification.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            hasAction ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].controls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                        type: "button",
                        variant: "secondary",
                        size: "md",
                        onClick: onAction,
                        children: actionLabel
                    }, void 0, false, {
                        fileName: "[project]/components/design-system/Notification.tsx",
                        lineNumber: 109,
                        columnNumber: 11
                    }, this),
                    onDismiss ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DismissButton, {
                        label: dismissLabel ?? `Dismiss ${titleText(title)}`,
                        onClick: onDismiss
                    }, void 0, false, {
                        fileName: "[project]/components/design-system/Notification.tsx",
                        lineNumber: 113,
                        columnNumber: 13
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/components/design-system/Notification.tsx",
                lineNumber: 108,
                columnNumber: 9
            }, this) : onDismiss ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DismissButton, {
                className: !neutralSurface ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].closeGhost : undefined,
                label: dismissLabel ?? `Dismiss ${titleText(title)}`,
                onClick: onDismiss
            }, void 0, false, {
                fileName: "[project]/components/design-system/Notification.tsx",
                lineNumber: 120,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/Notification.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
function DismissButton({ className, label, onClick }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
        type: "button",
        variant: "ghostV2",
        size: "sm",
        "aria-label": label,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].closeButton,
            className
        ].filter(Boolean).join(" "),
        onClick: onClick,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonIcon"], {
            icon: "/icons/lucide/x.svg"
        }, void 0, false, {
            fileName: "[project]/components/design-system/Notification.tsx",
            lineNumber: 148,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/Notification.tsx",
        lineNumber: 140,
        columnNumber: 5
    }, this);
}
function titleText(title) {
    return typeof title === "string" ? title : "notification";
}
}),
"[project]/components/design-system/Panel.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "description": "Panel-module__ZcHFAa__description",
  "header": "Panel-module__ZcHFAa__header",
  "panel": "Panel-module__ZcHFAa__panel",
  "title": "Panel-module__ZcHFAa__title",
});
}),
"[project]/components/design-system/Panel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Panel",
    ()=>Panel,
    "panelMutedTextStyle",
    ()=>panelMutedTextStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Panel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Panel.module.css [app-ssr] (css module)");
"use client";
;
;
;
function Panel({ children, className, description, style, title, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Panel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].panel,
            className
        ].filter(Boolean).join(" "),
        style: style,
        children: [
            title || description ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Panel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header,
                children: [
                    title ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Panel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].title,
                        style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].h4,
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/components/design-system/Panel.tsx",
                        lineNumber: 30,
                        columnNumber: 13
                    }, this) : null,
                    description ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Panel$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].description,
                        style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/components/design-system/Panel.tsx",
                        lineNumber: 35,
                        columnNumber: 13
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/components/design-system/Panel.tsx",
                lineNumber: 28,
                columnNumber: 9
            }, this) : null,
            children
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/Panel.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
const panelMutedTextStyle = {
    ...__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
    color: "var(--text-secondary)"
};
}),
"[project]/components/design-system/SegmentedControl.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "item": "SegmentedControl-module__TnKl4a__item",
  "root": "SegmentedControl-module__TnKl4a__root",
});
}),
"[project]/components/design-system/SegmentedControl.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SegmentedControl",
    ()=>SegmentedControl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/SegmentedControl.module.css [app-ssr] (css module)");
"use client";
;
;
function SegmentedControl({ ariaLabel, className, disabled = false, itemClassName, onActiveClick, onChange, options, stackOnSmallScreens = false, value }) {
    const selectedIndex = options.findIndex((option)=>option.value === value && !option.disabled);
    const fallbackIndex = options.findIndex((option)=>!option.disabled);
    const tabbableIndex = selectedIndex >= 0 ? selectedIndex : fallbackIndex;
    const handleArrowNavigation = (event, startIndex, direction)=>{
        event.preventDefault();
        const optionCount = options.length;
        for(let step = 1; step <= optionCount; step += 1){
            const nextIndex = (startIndex + step * direction + optionCount) % optionCount;
            const nextOption = options[nextIndex];
            if (disabled || nextOption?.disabled) {
                continue;
            }
            onChange(nextOption.value);
            return;
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].root,
            stackOnSmallScreens ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stackOnSmallScreens : null,
            className
        ].filter(Boolean).join(" "),
        role: "radiogroup",
        "aria-label": ariaLabel,
        "aria-disabled": disabled || undefined,
        children: options.map((option, index)=>{
            const active = option.value === value;
            const optionDisabled = disabled || option.disabled;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                role: "radio",
                "aria-checked": active,
                tabIndex: index === tabbableIndex ? 0 : -1,
                className: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].item,
                    itemClassName
                ].filter(Boolean).join(" "),
                "data-active": active ? "true" : "false",
                disabled: optionDisabled,
                onClick: ()=>{
                    if (optionDisabled) {
                        return;
                    }
                    if (active) {
                        onActiveClick?.(option.value);
                        return;
                    }
                    onChange(option.value);
                },
                onKeyDown: (event)=>{
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                        handleArrowNavigation(event, index, 1);
                    }
                    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                        handleArrowNavigation(event, index, -1);
                    }
                    if (event.key === "Home") {
                        event.preventDefault();
                        const firstEnabledOption = options.find((candidate)=>!candidate.disabled);
                        if (!disabled && firstEnabledOption && firstEnabledOption.value !== value) {
                            onChange(firstEnabledOption.value);
                        }
                    }
                    if (event.key === "End") {
                        event.preventDefault();
                        const lastEnabledOption = [
                            ...options
                        ].reverse().find((candidate)=>!candidate.disabled);
                        if (!disabled && lastEnabledOption && lastEnabledOption.value !== value) {
                            onChange(lastEnabledOption.value);
                        }
                    }
                },
                children: option.label
            }, option.value, false, {
                fileName: "[project]/components/design-system/SegmentedControl.tsx",
                lineNumber: 80,
                columnNumber: 11
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/components/design-system/SegmentedControl.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/design-system/Slider.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "fill": "Slider-module__WbE2Fa__fill",
  "input": "Slider-module__WbE2Fa__input",
  "slider": "Slider-module__WbE2Fa__slider",
  "thumb": "Slider-module__WbE2Fa__thumb",
  "track": "Slider-module__WbE2Fa__track",
  "wrap": "Slider-module__WbE2Fa__wrap",
});
}),
"[project]/components/design-system/Slider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Slider",
    ()=>Slider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Slider$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Slider.module.css [app-ssr] (css module)");
"use client";
;
;
function Slider({ className, max = 100, min = 0, style, title, value = 0, ...props }) {
    const numericMin = typeof min === "number" ? min : Number(min);
    const numericMax = typeof max === "number" ? max : Number(max);
    const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
    const range = numericMax - numericMin;
    const percent = range <= 0 ? 0 : (numericValue - numericMin) / range * 100;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const percentStyle = `${clampedPercent}%`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Slider$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].wrap,
            className
        ].filter(Boolean).join(" "),
        style: style,
        title: title,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Slider$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].slider,
                "aria-hidden": "true",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Slider$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].track,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Slider$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].fill,
                            style: {
                                width: percentStyle
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/design-system/Slider.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Slider$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].thumb,
                            style: {
                                left: percentStyle
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/design-system/Slider.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/design-system/Slider.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/design-system/Slider.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ...props,
                type: "range",
                min: min,
                max: max,
                value: value,
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Slider$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].input,
                title: title
            }, void 0, false, {
                fileName: "[project]/components/design-system/Slider.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/Slider.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/design-system/SingleSelectDropdown.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SingleSelectDropdown",
    ()=>SingleSelectDropdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Field.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Menu.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function SingleSelectDropdown({ ariaLabel, emptyLabel = "No options", getItemDisabled, getItemIsDivider, getItemLabel, getItemValue, items, label, menuClassName, menuMaxHeight = 300, menuMaxWidth = "min(320px, calc(100vw - 32px))", menuMatchTriggerWidth = false, menuOffset = 4, menuOverlapTrigger = false, menuPlacement = "bottom-start", menuPortalToViewport = false, menuShowTrailingCheck = true, menuStyle, menuWidth = "max-content", minWidth = 200, onReachEnd, onOpenChange, onValueChange, placeholder, openOnHover = false, hoverCloseDelayMs = 120, showChevron = true, triggerLabel, triggerClassName, triggerStyle, triggerVariant = "selection", value, wrapperClassName, wrapperStyle, menuFooter }) {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [portalStyle, setPortalStyle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const rootRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hoverCloseTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const preserveScrollAnchorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMounted(true);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        onOpenChange?.(open);
    }, [
        onOpenChange,
        open
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>()=>{
            if (hoverCloseTimeoutRef.current !== null) {
                window.clearTimeout(hoverCloseTimeoutRef.current);
            }
        }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        function onPointerDown(event) {
            const target = event.target;
            const clickedTrigger = Boolean(target && rootRef.current?.contains(target));
            const clickedMenu = Boolean(target && menuRef.current?.contains(target));
            if (!target || !clickedTrigger && !clickedMenu) {
                setOpen(false);
            }
        }
        document.addEventListener("pointerdown", onPointerDown);
        return ()=>document.removeEventListener("pointerdown", onPointerDown);
    }, []);
    const clearHoverCloseTimeout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (hoverCloseTimeoutRef.current === null) {
            return;
        }
        window.clearTimeout(hoverCloseTimeoutRef.current);
        hoverCloseTimeoutRef.current = null;
    }, []);
    const scheduleHoverClose = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!openOnHover) {
            return;
        }
        clearHoverCloseTimeout();
        hoverCloseTimeoutRef.current = window.setTimeout(()=>{
            setOpen(false);
            hoverCloseTimeoutRef.current = null;
        }, hoverCloseDelayMs);
    }, [
        clearHoverCloseTimeout,
        hoverCloseDelayMs,
        openOnHover
    ]);
    const handleHoverEnter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!openOnHover) {
            return;
        }
        clearHoverCloseTimeout();
        setOpen(true);
    }, [
        clearHoverCloseTimeout,
        openOnHover
    ]);
    const selectedItem = items.find((item)=>getItemValue(item) === value) ?? null;
    const isTopPlacement = menuPlacement === "top-start" || menuPlacement === "top-end";
    const orderedItems = isTopPlacement ? [
        ...items
    ].reverse() : items;
    const chevronDirection = isTopPlacement ? "up" : "down";
    const triggerZIndex = menuOverlapTrigger ? 1 : undefined;
    const menuPositionStyle = menuPortalToViewport ? {} : isTopPlacement ? {
        position: "absolute",
        bottom: menuOverlapTrigger ? 0 : `calc(100% + ${menuOffset}px)`,
        left: menuPlacement === "top-start" ? 0 : "auto",
        right: menuPlacement === "top-end" ? 0 : "auto"
    } : {
        position: "absolute",
        top: menuOverlapTrigger ? 0 : `calc(100% + ${menuOffset}px)`,
        left: menuPlacement === "bottom-start" ? 0 : "auto",
        right: menuPlacement === "bottom-end" ? 0 : "auto"
    };
    const updatePortalStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!menuPortalToViewport || !rootRef.current || !menuRef.current) {
            return;
        }
        const viewportPadding = 8;
        const triggerRect = rootRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const measuredMenuWidth = menuRect.width || triggerRect.width;
        const measuredMenuHeight = menuRect.height || 0;
        const desiredLeft = menuPlacement === "top-end" || menuPlacement === "bottom-end" ? triggerRect.right - measuredMenuWidth : triggerRect.left;
        const maxLeft = Math.max(viewportPadding, window.innerWidth - measuredMenuWidth - viewportPadding);
        const left = Math.min(Math.max(desiredLeft, viewportPadding), maxLeft);
        const top = isTopPlacement ? Math.max(viewportPadding, triggerRect.top - (menuOverlapTrigger ? triggerRect.height : menuOffset) - measuredMenuHeight) : Math.min(triggerRect.bottom + (menuOverlapTrigger ? -triggerRect.height : menuOffset), window.innerHeight - measuredMenuHeight - viewportPadding);
        const maxHeight = isTopPlacement ? Math.max(triggerRect.top - menuOffset - viewportPadding, 120) : Math.max(window.innerHeight - triggerRect.bottom - menuOffset - viewportPadding, 120);
        setPortalStyle({
            position: "fixed",
            top,
            left,
            zIndex: "var(--z-editor-popover)",
            width: menuMatchTriggerWidth ? triggerRect.width : menuWidth,
            minWidth: Math.max(triggerRect.width, Number(minWidth) || 0),
            maxWidth: menuMaxWidth,
            maxHeight: Math.min(menuMaxHeight, maxHeight),
            overflowY: "auto"
        });
    }, [
        menuMaxHeight,
        menuMaxWidth,
        menuMatchTriggerWidth,
        menuOffset,
        menuOverlapTrigger,
        menuPlacement,
        menuPortalToViewport,
        menuWidth,
        minWidth
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if (!open || !menuPortalToViewport) {
            return;
        }
        updatePortalStyle();
    }, [
        open,
        menuPortalToViewport,
        updatePortalStyle
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if (!open || !isTopPlacement || !menuRef.current) {
            return;
        }
        menuRef.current.scrollTop = menuRef.current.scrollHeight;
    }, [
        isTopPlacement,
        open
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if (!open || !isTopPlacement) {
            preserveScrollAnchorRef.current = null;
            return;
        }
        const anchor = preserveScrollAnchorRef.current;
        const menuElement = menuRef.current;
        if (!anchor || !menuElement || items.length <= anchor.itemCount) {
            return;
        }
        const scrollHeightDelta = menuElement.scrollHeight - anchor.scrollHeight;
        menuElement.scrollTop = anchor.scrollTop + scrollHeightDelta;
        preserveScrollAnchorRef.current = null;
    }, [
        isTopPlacement,
        items.length,
        open
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open || !menuPortalToViewport) {
            return;
        }
        const syncPosition = ()=>updatePortalStyle();
        window.addEventListener("resize", syncPosition);
        window.addEventListener("scroll", syncPosition, true);
        return ()=>{
            window.removeEventListener("resize", syncPosition);
            window.removeEventListener("scroll", syncPosition, true);
        };
    }, [
        open,
        menuPortalToViewport,
        updatePortalStyle
    ]);
    const maybeLoadMore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const menuElement = menuRef.current;
        if (!menuElement || !onReachEnd) {
            return;
        }
        const hasOverflow = menuElement.scrollHeight > menuElement.clientHeight;
        const remainingScrollDistance = menuElement.scrollHeight - menuElement.scrollTop - menuElement.clientHeight;
        const reachedLoadThreshold = isTopPlacement ? !hasOverflow || menuElement.scrollTop <= 48 : remainingScrollDistance <= 48;
        if (reachedLoadThreshold) {
            if (isTopPlacement) {
                preserveScrollAnchorRef.current = {
                    itemCount: items.length,
                    scrollHeight: menuElement.scrollHeight,
                    scrollTop: menuElement.scrollTop
                };
            }
            onReachEnd();
        }
    }, [
        isTopPlacement,
        items.length,
        onReachEnd
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open) {
            return;
        }
        maybeLoadMore();
    }, [
        items.length,
        maybeLoadMore,
        open
    ]);
    const menuContent = open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuSurface"], {
        ref: menuRef,
        role: "menu",
        "aria-label": ariaLabel,
        className: menuClassName,
        style: {
            zIndex: 10,
            width: menuMatchTriggerWidth ? "100%" : menuWidth,
            maxWidth: menuMaxWidth,
            maxHeight: menuMaxHeight,
            overflowY: "auto",
            ...menuPositionStyle,
            ...portalStyle,
            ...menuStyle
        },
        onScroll: maybeLoadMore,
        onPointerEnter: handleHoverEnter,
        onPointerLeave: scheduleHoverClose,
        children: orderedItems.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                orderedItems.map((item)=>{
                    const itemValue = getItemValue(item);
                    if (getItemIsDivider?.(item)) {
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuDivider"], {}, itemValue, false, {
                            fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
                            lineNumber: 379,
                            columnNumber: 22
                        }, this);
                    }
                    const active = itemValue === value;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuItem"], {
                        type: "button",
                        role: "menuitemradio",
                        "aria-checked": active,
                        active: active,
                        disabled: getItemDisabled?.(item),
                        layout: menuShowTrailingCheck ? "trailing" : "leading",
                        trailing: menuShowTrailingCheck ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuTrailingCheck"], {
                            active: active
                        }, void 0, false, {
                            fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
                            lineNumber: 394,
                            columnNumber: 23
                        }, void 0) : undefined,
                        onClick: ()=>{
                            onValueChange(itemValue, item);
                            setOpen(false);
                        },
                        children: getItemLabel(item)
                    }, itemValue, false, {
                        fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
                        lineNumber: 384,
                        columnNumber: 15
                    }, this);
                }),
                menuFooter
            ]
        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuItem"], {
            type: "button",
            disabled: true,
            children: emptyLabel
        }, void 0, false, {
            fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
            lineNumber: 409,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
        lineNumber: 354,
        columnNumber: 5
    }, this) : null;
    const control = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: rootRef,
        className: wrapperClassName,
        style: {
            position: "relative",
            width: "fit-content",
            maxWidth: "100%",
            ...wrapperStyle
        },
        onPointerEnter: handleHoverEnter,
        onPointerLeave: scheduleHoverClose,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuTrigger"], {
                type: "button",
                variant: triggerVariant,
                open: open,
                "aria-expanded": open,
                "aria-haspopup": "menu",
                "aria-label": ariaLabel,
                onClick: ()=>{
                    clearHoverCloseTimeout();
                    setOpen((currentOpen)=>!currentOpen);
                },
                className: triggerClassName,
                style: {
                    position: "relative",
                    zIndex: triggerZIndex,
                    width: "100%",
                    minWidth,
                    maxWidth: "100%",
                    ...triggerStyle
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: triggerLabel ?? (selectedItem ? getItemLabel(selectedItem) : placeholder)
                    }, void 0, false, {
                        fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
                        lineNumber: 450,
                        columnNumber: 9
                    }, this),
                    showChevron ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuChevronIcon"], {
                        open: open,
                        direction: chevronDirection
                    }, void 0, false, {
                        fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
                        lineNumber: 454,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
                lineNumber: 429,
                columnNumber: 7
            }, this),
            !menuPortalToViewport ? menuContent : null
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
        lineNumber: 417,
        columnNumber: 5
    }, this);
    if (menuPortalToViewport && mounted && menuContent) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                label ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                    label: label,
                    children: control
                }, void 0, false, {
                    fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
                    lineNumber: 465,
                    columnNumber: 18
                }, this) : control,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(menuContent, document.body)
            ]
        }, void 0, true);
    }
    if (!label) {
        return control;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
        label: label,
        children: control
    }, void 0, false, {
        fileName: "[project]/components/design-system/SingleSelectDropdown.tsx",
        lineNumber: 475,
        columnNumber: 10
    }, this);
}
}),
"[project]/components/design-system/Toggle.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "knob": "Toggle-module__yLB_wW__knob",
  "label": "Toggle-module__yLB_wW__label",
  "row": "Toggle-module__yLB_wW__row",
  "toggle": "Toggle-module__yLB_wW__toggle",
});
}),
"[project]/components/design-system/Toggle.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toggle",
    ()=>Toggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toggle$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Toggle.module.css [app-ssr] (css module)");
"use client";
;
;
;
function Toggle({ checked, className, label, onChange, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toggle$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].row,
            className
        ].filter(Boolean).join(" "),
        children: [
            label ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toggle$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                children: label
            }, void 0, false, {
                fileName: "[project]/components/design-system/Toggle.tsx",
                lineNumber: 21,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                ...props,
                type: props.type ?? "button",
                role: "switch",
                "aria-checked": checked,
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toggle$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].toggle,
                "data-checked": checked ? "true" : "false",
                onClick: (event)=>{
                    props.onClick?.(event);
                    if (!event.defaultPrevented) {
                        onChange(!checked);
                    }
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toggle$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].knob,
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/components/design-system/Toggle.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/design-system/Toggle.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/Toggle.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/design-system/Toolbar.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "anchor": "Toolbar-module__vy3_-G__anchor",
  "button": "Toolbar-module__vy3_-G__button",
  "buttonIconOnly": "Toolbar-module__vy3_-G__buttonIconOnly",
  "buttonLabelled": "Toolbar-module__vy3_-G__buttonLabelled",
  "buttonSwatch": "Toolbar-module__vy3_-G__buttonSwatch",
  "buttonVariantDestructive": "Toolbar-module__vy3_-G__buttonVariantDestructive",
  "buttonVariantGhost": "Toolbar-module__vy3_-G__buttonVariantGhost",
  "buttonVariantGhostNeutral": "Toolbar-module__vy3_-G__buttonVariantGhostNeutral",
  "buttonVariantPrimary": "Toolbar-module__vy3_-G__buttonVariantPrimary",
  "buttonVariantSecondary": "Toolbar-module__vy3_-G__buttonVariantSecondary",
  "buttonVariantToolbar": "Toolbar-module__vy3_-G__buttonVariantToolbar",
  "buttonWide": "Toolbar-module__vy3_-G__buttonWide",
  "divider": "Toolbar-module__vy3_-G__divider",
  "glyph": "Toolbar-module__vy3_-G__glyph",
  "group": "Toolbar-module__vy3_-G__group",
  "groupActions": "Toolbar-module__vy3_-G__groupActions",
  "icon": "Toolbar-module__vy3_-G__icon",
  "label": "Toolbar-module__vy3_-G__label",
  "meta": "Toolbar-module__vy3_-G__meta",
  "popover": "Toolbar-module__vy3_-G__popover",
  "popoverSubtoolbar": "Toolbar-module__vy3_-G__popoverSubtoolbar",
  "subtoolGroup": "Toolbar-module__vy3_-G__subtoolGroup",
  "swatch": "Toolbar-module__vy3_-G__swatch",
  "toolbar": "Toolbar-module__vy3_-G__toolbar",
});
}),
"[project]/components/design-system/Toolbar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toolbar",
    ()=>Toolbar,
    "ToolbarAnchor",
    ()=>ToolbarAnchor,
    "ToolbarButton",
    ()=>ToolbarButton,
    "ToolbarDivider",
    ()=>ToolbarDivider,
    "ToolbarGroup",
    ()=>ToolbarGroup,
    "ToolbarIcon",
    ()=>ToolbarIcon,
    "ToolbarLabel",
    ()=>ToolbarLabel,
    "ToolbarMeta",
    ()=>ToolbarMeta,
    "ToolbarPopover",
    ()=>ToolbarPopover,
    "ToolbarSubtoolGroup",
    ()=>ToolbarSubtoolGroup,
    "ToolbarSwatch",
    ()=>ToolbarSwatch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/assetPath.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/Toolbar.module.css [app-ssr] (css module)");
"use client";
;
;
;
;
;
function Toolbar({ children, className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].toolbar,
            className
        ].filter(Boolean).join(" "),
        style: {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
            ...props.style
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
function ToolbarGroup({ children, className, actions = false, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].group,
            actions ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].groupActions : null,
            className
        ].filter(Boolean).join(" "),
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
function ToolbarMeta({ children, className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].meta,
            className
        ].filter(Boolean).join(" "),
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
function ToolbarDivider({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ...props,
        "aria-hidden": props["aria-hidden"] ?? "true",
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].divider,
            className
        ].filter(Boolean).join(" ")
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
function ToolbarButton({ active = false, children, className, iconOnly = false, inertWhenActive = false, labelled = false, onClick, primary = false, style, swatch = false, variant, wide = false, ...props }) {
    const isInertActive = active && inertWhenActive;
    const resolvedVariant = variant ?? (primary ? "primary" : "toolbar");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].button,
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"][`buttonVariant${resolvedVariant[0].toUpperCase()}${resolvedVariant.slice(1)}`],
            iconOnly ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].buttonIconOnly : null,
            labelled ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].buttonLabelled : null,
            swatch ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].buttonSwatch : null,
            wide ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].buttonWide : null,
            className
        ].filter(Boolean).join(" "),
        "data-active": active ? "true" : undefined,
        "data-inert-active": isInertActive ? "true" : undefined,
        onClick: (event)=>{
            if (isInertActive) {
                event.preventDefault();
                return;
            }
            onClick?.(event);
        },
        style: {
            fontWeight: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].p2.weight,
            ...style
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 113,
        columnNumber: 5
    }, this);
}
const ToolbarAnchor = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(function ToolbarAnchor({ children, className, ...props }, ref) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ...props,
        ref: ref,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].anchor,
            className
        ].filter(Boolean).join(" "),
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 151,
        columnNumber: 5
    }, this);
});
const ToolbarPopover = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(function ToolbarPopover({ children, className, subtoolbar = false, style, ...props }, ref) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ...props,
        ref: ref,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].popover,
            subtoolbar ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].popoverSubtoolbar : null,
            className
        ].filter(Boolean).join(" "),
        style: {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
            ...style
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 175,
        columnNumber: 5
    }, this);
});
function ToolbarSubtoolGroup({ children, className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].subtoolGroup,
            className
        ].filter(Boolean).join(" "),
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 198,
        columnNumber: 5
    }, this);
}
function ToolbarIcon({ icon, className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ...props,
        "aria-hidden": props["aria-hidden"] ?? "true",
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].icon,
            className
        ].filter(Boolean).join(" "),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].glyph,
            style: {
                WebkitMaskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(icon)})`,
                maskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(icon)})`
            }
        }, void 0, false, {
            fileName: "[project]/components/design-system/Toolbar.tsx",
            lineNumber: 218,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 213,
        columnNumber: 5
    }, this);
}
function ToolbarLabel({ children, className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ...props,
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
            className
        ].filter(Boolean).join(" "),
        children: children
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 235,
        columnNumber: 5
    }, this);
}
function ToolbarSwatch({ color, className, ...props }) {
    const isTransparent = color.trim().toLowerCase() === "transparent" || color.trim().toLowerCase() === "none";
    const transparentBackgroundImage = "linear-gradient(45deg, rgba(15, 23, 42, 0.1) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.1) 75%), linear-gradient(45deg, rgba(15, 23, 42, 0.1) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.1) 75%)";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ...props,
        "aria-hidden": props["aria-hidden"] ?? "true",
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].swatch,
            className
        ].filter(Boolean).join(" "),
        style: {
            ...props.style,
            backgroundColor: isTransparent ? "#ffffff" : color,
            backgroundImage: isTransparent ? transparentBackgroundImage : props.style?.backgroundImage,
            backgroundPosition: isTransparent ? "0 0, 4px 4px" : props.style?.backgroundPosition,
            backgroundSize: isTransparent ? "8px 8px, 8px 8px" : props.style?.backgroundSize,
            backgroundRepeat: isTransparent ? "repeat, repeat" : props.style?.backgroundRepeat
        }
    }, void 0, false, {
        fileName: "[project]/components/design-system/Toolbar.tsx",
        lineNumber: 255,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/design-system/VerticalTabGroup.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "group": "VerticalTabGroup-module__FpJfwW__group",
  "icon": "VerticalTabGroup-module__FpJfwW__icon",
  "item": "VerticalTabGroup-module__FpJfwW__item",
  "label": "VerticalTabGroup-module__FpJfwW__label",
});
}),
"[project]/components/design-system/VerticalTabGroup.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VerticalTabGroup",
    ()=>VerticalTabGroup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/assetPath.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$VerticalTabGroup$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/design-system/VerticalTabGroup.module.css [app-ssr] (css module)");
"use client";
;
;
;
;
function VerticalTabGroup({ activeId, ariaLabel, className, iconOnly = false, items, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$VerticalTabGroup$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].group,
            className
        ].filter(Boolean).join(" "),
        role: "tablist",
        "aria-label": ariaLabel,
        children: items.map((item)=>{
            const selected = item.id === activeId;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(VerticalTabGroupItem, {
                active: selected,
                icon: item.icon,
                iconOnly: iconOnly,
                label: item.label,
                onClick: ()=>onChange(item.id)
            }, item.id, false, {
                fileName: "[project]/components/design-system/VerticalTabGroup.tsx",
                lineNumber: 37,
                columnNumber: 11
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/components/design-system/VerticalTabGroup.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
function VerticalTabGroupItem({ active, icon, iconOnly = false, label, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        ...props,
        type: props.type ?? "button",
        role: "tab",
        "aria-label": label,
        "aria-selected": active,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$VerticalTabGroup$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].item,
        "data-active": active ? "true" : undefined,
        style: {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
            fontWeight: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typographySpecs"].p2.weight
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$VerticalTabGroup$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].icon,
                "aria-hidden": "true",
                style: {
                    WebkitMaskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(icon)})`,
                    maskImage: `url(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assetPath$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetPath"])(icon)})`
                }
            }, void 0, false, {
                fileName: "[project]/components/design-system/VerticalTabGroup.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            !iconOnly ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$VerticalTabGroup$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].label,
                children: label
            }, void 0, false, {
                fileName: "[project]/components/design-system/VerticalTabGroup.tsx",
                lineNumber: 85,
                columnNumber: 20
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/components/design-system/VerticalTabGroup.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/design-system/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Checkbox$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Checkbox.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Field.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Menu.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Modal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Notification.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Panel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Panel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/SegmentedControl.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Slider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Slider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SingleSelectDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/SingleSelectDropdown.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Toggle.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Toolbar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Toolbar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$VerticalTabGroup$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/VerticalTabGroup.tsx [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
}),
"[project]/components/editor-v2/app/editorV2AuthHandoff.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "consumeEditorV2AuthHandoffFromUrl",
    ()=>consumeEditorV2AuthHandoffFromUrl,
    "createEditorV2AuthHandoffRedirectUrl",
    ()=>createEditorV2AuthHandoffRedirectUrl
]);
"use client";
const AUTH_HANDOFF_QUERY_PARAM = "authHandoff";
const AUTH_HANDOFF_STORAGE_PREFIX = "editor-v2-auth-handoff:";
const AUTH_HANDOFF_PENDING_STORAGE_KEY = "editor-v2-auth-handoff:pending";
const AUTH_HANDOFF_MAX_AGE_MS = 1000 * 60 * 60 * 4;
function createEditorV2AuthHandoffRedirectUrl(document, currentUrl) {
    if ("TURBOPACK compile-time truthy", 1) {
        return currentUrl;
    }
    //TURBOPACK unreachable
    ;
    const token = undefined;
    const redirectUrl = undefined;
}
function consumeEditorV2AuthHandoffFromUrl() {
    if ("TURBOPACK compile-time truthy", 1) {
        return null;
    }
    //TURBOPACK unreachable
    ;
    const currentUrl = undefined;
    const tokenFromUrl = undefined;
    const token = undefined;
    const storageKey = undefined;
    const rawPayload = undefined;
}
function parseEditorDocumentState(rawPayload) {
    try {
        const candidate = JSON.parse(rawPayload);
        if (!candidate || typeof candidate !== "object") {
            return null;
        }
        if (!candidate.project || !candidate.grid || !candidate.palette || !candidate.text || typeof candidate.project.title !== "string" || typeof candidate.grid.width !== "number" || typeof candidate.grid.height !== "number" || !Array.isArray(candidate.grid.cells)) {
            return null;
        }
        return candidate;
    } catch  {
        return null;
    }
}
function getPendingAuthHandoffToken() {
    if ("TURBOPACK compile-time truthy", 1) {
        return null;
    }
    //TURBOPACK unreachable
    ;
    const rawPending = undefined;
}
}),
"[project]/components/auth/useOpenSignIn.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useOpenSignIn",
    ()=>useOpenSignIn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$runtime$2f$react$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/shared/dist/runtime/react/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
;
const MOBILE_SIGN_IN_BREAKPOINT_PX = 768;
function useOpenSignIn() {
    const clerk = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$runtime$2f$react$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useClerk"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((options)=>{
        const currentUrl = options?.redirectUrl ?? (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : "/");
        const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`;
        const usePageNavigation = ("TURBOPACK compile-time value", "undefined") !== "undefined" && window.matchMedia(`(max-width: ${MOBILE_SIGN_IN_BREAKPOINT_PX}px)`).matches;
        const navigateToSignInPage = ()=>{
            router.push(signInUrl);
        };
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        if (!clerk.loaded || clerk.status !== "ready") {
            console.warn("Sign-in modal unavailable before Clerk finished loading", {
                clerkLoaded: clerk.loaded,
                clerkStatus: clerk.status
            });
            navigateToSignInPage();
            return;
        }
        try {
            clerk.openSignIn({
                fallbackRedirectUrl: currentUrl,
                forceRedirectUrl: currentUrl
            });
        } catch (error) {
            console.warn("Sign-in modal failed to open, falling back to sign-in page", {
                error,
                clerkLoaded: clerk.loaded,
                clerkStatus: clerk.status
            });
            navigateToSignInPage();
        }
    }, [
        clerk,
        router
    ]);
}
}),
"[project]/components/auth/AuthButtons.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AuthButtons
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$clerk$2d$react$2f$dist$2f$chunk$2d$36EXAXVP$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/clerk-react/dist/chunk-36EXAXVP.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/components/design-system/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$editorV2AuthHandoff$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor-v2/app/editorV2AuthHandoff.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$useOpenSignIn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/useOpenSignIn.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function AuthButtons() {
    const openSignIn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$useOpenSignIn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOpenSignIn"])();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMounted(true);
    }, []);
    if (!mounted) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["SignedIn"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$clerk$2d$react$2f$dist$2f$chunk$2d$36EXAXVP$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserButton"], {
                    afterSignOutUrl: "/editor"
                }, void 0, false, {
                    fileName: "[project]/components/auth/AuthButtons.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/auth/AuthButtons.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["SignedOut"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                    type: "button",
                    variant: "ghostV2",
                    size: "md",
                    className: "app-header-sign-in-button",
                    onClick: ()=>{
                        if ("TURBOPACK compile-time truthy", 1) {
                            openSignIn();
                            return;
                        }
                        //TURBOPACK unreachable
                        ;
                        const currentUrl = undefined;
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                            icon: "/icons/lucide/user.svg"
                        }, void 0, false, {
                            fileName: "[project]/components/auth/AuthButtons.tsx",
                            lineNumber: 72,
                            columnNumber: 11
                        }, this),
                        "Sign in"
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/auth/AuthButtons.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/auth/AuthButtons.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/components/auth/HeaderAuth.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HeaderAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$AuthButtons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/AuthButtons.tsx [app-ssr] (ecmascript)");
"use client";
;
;
function HeaderAuth() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "app-header-auth",
        style: {
            display: "flex",
            justifyContent: "flex-end"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$AuthButtons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
            fileName: "[project]/components/auth/HeaderAuth.tsx",
            lineNumber: 8,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/auth/HeaderAuth.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4cffedd8._.js.map