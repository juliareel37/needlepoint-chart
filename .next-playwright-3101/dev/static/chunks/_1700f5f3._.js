(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/editor-v2/config.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "APP_MODE",
    ()=>APP_MODE,
    "EDITOR_V2_MAX_GRID_SIZE",
    ()=>EDITOR_V2_MAX_GRID_SIZE,
    "EDITOR_V2_MIN_GRID_SIZE",
    ()=>EDITOR_V2_MIN_GRID_SIZE,
    "EDITOR_V2_SAVE_MODE",
    ()=>EDITOR_V2_SAVE_MODE,
    "IS_DEV_APP_MODE",
    ()=>IS_DEV_APP_MODE
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const EDITOR_V2_MIN_GRID_SIZE = 1;
const EDITOR_V2_MAX_GRID_SIZE = 300;
const APP_MODE = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_APP_MODE === "prod" ? "prod" : "dev";
const IS_DEV_APP_MODE = APP_MODE === "dev";
const EDITOR_V2_SAVE_MODE = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_EDITOR_V2_SAVE_MODE === "manual" ? "manual" : "autosave";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/editor-v2/editor/store/state.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createInitialEditorStoreState",
    ()=>createInitialEditorStoreState
]);
function createInitialEditorStoreState() {
    return {
        document: {
            project: {
                id: null,
                title: "Untitled Pattern",
                createdAt: null,
                updatedAt: null,
                sourceVersion: 1
            },
            grid: {
                width: 0,
                height: 0,
                meshCount: null,
                sizingMode: "stitches",
                widthInches: null,
                heightInches: null,
                cells: []
            },
            palette: {
                colorsById: {},
                customPalettesById: {},
                extractedPaletteIds: [],
                symbolAssignments: {}
            },
            trace: null,
            text: {
                mode: "destructive-grid",
                entities: []
            },
            metadata: {
                legacyDraftId: null,
                persistedVersionId: null,
                schemaVersion: 1
            }
        },
        session: {
            activeTool: {
                tool: "paint",
                brushSize: 1,
                paintBrushSize: 1,
                eraseBrushSize: 1,
                colorId: null
            },
            eyedropperReturnTool: null,
            viewport: {
                zoom: 1,
                offsetX: 0,
                offsetY: 0
            },
            selection: {
                mode: "none",
                shape: "rect",
                rect: null,
                lassoPoints: [],
                mirrorAxis: null,
                preview: null
            },
            mirrorInteraction: {
                session: null
            },
            history: {
                past: [],
                future: [],
                lastAppliedCommandId: null,
                transaction: null
            },
            persistence: {
                currentDraftId: null,
                dirty: false,
                saving: false,
                loading: false,
                lastSavedAt: null,
                lastLoadedAt: null,
                restoreSource: "none",
                versionPreview: null
            },
            traceInteraction: {
                uploadStatus: "idle",
                placementMode: "idle",
                repositionOrigin: null,
                replacedTrace: null,
                repositionSnapshot: null,
                runtimeImageRefId: null
            },
            textInteraction: {
                draftText: "",
                draftColorId: null,
                draftFontFamily: "Arial",
                draftFontSize: 6,
                draftFontStyle: "normal",
                draftFontWeight: 400,
                previewPosition: null,
                placement: null
            },
            iconInteraction: {
                placement: null
            },
            inFlightCommand: null
        },
        ui: {
            shell: {
                sidebarCollapsed: false,
                activeSidebarSection: "document",
                mobileToolbarVisible: true,
                mobileToolbarCollapsed: false,
                isCompact: false,
                isNarrow: false
            },
            panels: {
                gridOpen: true,
                wipOpen: false,
                traceOpen: false,
                usedColorsOpen: true,
                customPalettesOpen: false,
                imageToPatternOpen: false,
                textOpen: false,
                settingsOpen: false
            },
            dialogs: {
                confirmDialog: null,
                draftPickerOpen: false,
                versionHistoryOpen: false
            },
            menus: {
                fileMenuOpen: false,
                mobileSettingsOpen: false,
                activePopoverId: null
            },
            preferences: {
                darkMode: false,
                showGridlines: true,
                showMajorGridlines: true,
                showRuler: true,
                showSymbols: true,
                previewMode: false,
                threadView: false,
                darkCanvas: false,
                gridMajorInterval: 10
            }
        }
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/dmcColors.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DMC_COLORS",
    ()=>DMC_COLORS,
    "DMC_MATRIX_COLUMNS",
    ()=>DMC_MATRIX_COLUMNS,
    "DMC_MATRIX_ROWS",
    ()=>DMC_MATRIX_ROWS
]);
const DMC_MATRIX_COLUMNS = [
    "red",
    "orange",
    "yellow",
    "green",
    "teal",
    "blue",
    "purple",
    "neutral"
];
const DMC_MATRIX_ROWS = [
    "veryDark",
    "dark",
    "medium",
    "light",
    "veryLight",
    "ultraLight"
];
const DMC_COLORS = [
    {
        id: 150,
        name: "Dusty Rose Ult Vy Dk",
        hex: "#ab0249",
        code: "150",
        family: "violet"
    },
    {
        id: 151,
        name: "Dusty Rose Vry Lt",
        hex: "#f0ced4",
        code: "151",
        family: "red"
    },
    {
        id: 152,
        name: "Shell Pink Med Light",
        hex: "#e2a099",
        code: "152",
        family: "red"
    },
    {
        id: 153,
        name: "Violet Very Light",
        hex: "#e6ccd9",
        code: "153",
        family: "violet"
    },
    {
        id: 154,
        name: "Grape Very Dark",
        hex: "#572433",
        code: "154",
        family: "red"
    },
    {
        id: 155,
        name: "Blue Violet Med Dark",
        hex: "#9891b6",
        code: "155",
        family: "violet"
    },
    {
        id: 156,
        name: "Blue Violet Med Lt",
        hex: "#a3aed1",
        code: "156",
        family: "violet"
    },
    {
        id: 157,
        name: "Cornflower Blue Vy Lt",
        hex: "#bbc3d9",
        code: "157",
        family: "violet"
    },
    {
        id: 158,
        name: "Cornflower Blu M V D",
        hex: "#4c526e",
        code: "158",
        family: "violet"
    },
    {
        id: 159,
        name: "Blue Gray Light",
        hex: "#c7cad7",
        code: "159",
        family: "violet"
    },
    {
        id: 160,
        name: "Blue Gray Medium",
        hex: "#999fb7",
        code: "160",
        family: "violet"
    },
    {
        id: 161,
        name: "Blue Gray",
        hex: "#7880a4",
        code: "161",
        family: "violet"
    },
    {
        id: 162,
        name: "Blue Ultra Very Light",
        hex: "#dbecf5",
        code: "162",
        family: "blue"
    },
    {
        id: 163,
        name: "Celadon Green Md",
        hex: "#4d8361",
        code: "163",
        family: "green"
    },
    {
        id: 164,
        name: "Forest Green Lt",
        hex: "#c8d8b8",
        code: "164",
        family: "green"
    },
    {
        id: 165,
        name: "Moss Green Vy Lt",
        hex: "#eff4a4",
        code: "165",
        family: "green"
    },
    {
        id: 166,
        name: "Moss Green Md Lt",
        hex: "#c0c840",
        code: "166",
        family: "green"
    },
    {
        id: 167,
        name: "Yellow Beige V Dk",
        hex: "#a77c49",
        code: "167",
        family: "neutrals"
    },
    {
        id: 168,
        name: "Pewter Very Light",
        hex: "#d1d1d1",
        code: "168",
        family: "neutrals"
    },
    {
        id: 169,
        name: "Pewter Light",
        hex: "#848484",
        code: "169",
        family: "neutrals"
    },
    {
        id: 208,
        name: "Lavender Very Dark",
        hex: "#835b8b",
        code: "208",
        family: "violet"
    },
    {
        id: 209,
        name: "Lavender Dark",
        hex: "#a37ba7",
        code: "209",
        family: "violet"
    },
    {
        id: 210,
        name: "Lavender Medium",
        hex: "#c39fc3",
        code: "210",
        family: "violet"
    },
    {
        id: 211,
        name: "Lavender Light",
        hex: "#e3cbe3",
        code: "211",
        family: "violet"
    },
    {
        id: 221,
        name: "Shell Pink Vy Dk",
        hex: "#883e43",
        code: "221",
        family: "red"
    },
    {
        id: 223,
        name: "Shell Pink Light",
        hex: "#cc847c",
        code: "223",
        family: "red"
    },
    {
        id: 224,
        name: "Shell Pink Very Light",
        hex: "#ebb7af",
        code: "224",
        family: "red"
    },
    {
        id: 225,
        name: "Shell Pink Ult Vy Lt",
        hex: "#ffdfd5",
        code: "225",
        family: "red"
    },
    {
        id: 300,
        name: "Mahogany Vy Dk",
        hex: "#6f2f00",
        code: "300",
        family: "orange"
    },
    {
        id: 301,
        name: "Mahogany Med",
        hex: "#b35f2b",
        code: "301",
        family: "orange"
    },
    {
        id: 304,
        name: "Red Medium",
        hex: "#b71f33",
        code: "304",
        family: "red"
    },
    {
        id: 307,
        name: "Lemon",
        hex: "#fded54",
        code: "307",
        family: "yellow"
    },
    {
        id: 309,
        name: "Rose Dark",
        hex: "#d62b5b",
        code: "309",
        family: "red"
    },
    {
        id: 310,
        name: "Black",
        hex: "#000000",
        code: "310",
        family: "neutrals"
    },
    {
        id: 311,
        name: "Wedgewood Ult VyDk",
        hex: "#1c5066",
        code: "311",
        family: "blue"
    },
    {
        id: 312,
        name: "Baby Blue Very Dark",
        hex: "#35668b",
        code: "312",
        family: "blue"
    },
    {
        id: 315,
        name: "Antique Mauve Md Dk",
        hex: "#814952",
        code: "315",
        family: "red"
    },
    {
        id: 316,
        name: "Antique Mauve Med",
        hex: "#b7737f",
        code: "316",
        family: "red"
    },
    {
        id: 317,
        name: "Pewter Gray",
        hex: "#6c6c6c",
        code: "317",
        family: "neutrals"
    },
    {
        id: 318,
        name: "Steel Gray Lt",
        hex: "#ababab",
        code: "318",
        family: "neutrals"
    },
    {
        id: 319,
        name: "Pistachio Grn Vy Dk",
        hex: "#205f2e",
        code: "319",
        family: "green"
    },
    {
        id: 320,
        name: "Pistachio Green Med",
        hex: "#69885a",
        code: "320",
        family: "green"
    },
    {
        id: 321,
        name: "Red",
        hex: "#c72b3b",
        code: "321",
        family: "red"
    },
    {
        id: 322,
        name: "Baby Blue Dark",
        hex: "#5a8fb8",
        code: "322",
        family: "blue"
    },
    {
        id: 326,
        name: "Rose Very Dark",
        hex: "#b33b4b",
        code: "326",
        family: "red"
    },
    {
        id: 327,
        name: "Violet Dark",
        hex: "#633666",
        code: "327",
        family: "violet"
    },
    {
        id: 333,
        name: "Blue Violet Very Dark",
        hex: "#5c5478",
        code: "333",
        family: "violet"
    },
    {
        id: 334,
        name: "Baby Blue Medium",
        hex: "#739fc1",
        code: "334",
        family: "blue"
    },
    {
        id: 335,
        name: "Rose",
        hex: "#ee546e",
        code: "335",
        family: "red"
    },
    {
        id: 336,
        name: "Navy Blue",
        hex: "#253b73",
        code: "336",
        family: "blue"
    },
    {
        id: 340,
        name: "Blue Violet Medium",
        hex: "#ada7c7",
        code: "340",
        family: "violet"
    },
    {
        id: 341,
        name: "Blue Violet Light",
        hex: "#b7bfdd",
        code: "341",
        family: "violet"
    },
    {
        id: 347,
        name: "Salmon Very Dark",
        hex: "#bf2d2d",
        code: "347",
        family: "red"
    },
    {
        id: 349,
        name: "Coral Dark",
        hex: "#d21035",
        code: "349",
        family: "red"
    },
    {
        id: 350,
        name: "Coral Medium",
        hex: "#e04848",
        code: "350",
        family: "red"
    },
    {
        id: 351,
        name: "Coral",
        hex: "#e96a67",
        code: "351",
        family: "red"
    },
    {
        id: 352,
        name: "Coral Light",
        hex: "#fd9c97",
        code: "352",
        family: "red"
    },
    {
        id: 353,
        name: "Peach",
        hex: "#fed7cc",
        code: "353",
        family: "red"
    },
    {
        id: 355,
        name: "Terra Cotta Dark",
        hex: "#984436",
        code: "355",
        family: "red"
    },
    {
        id: 356,
        name: "Terra Cotta Med",
        hex: "#c56a5b",
        code: "356",
        family: "red"
    },
    {
        id: 367,
        name: "Pistachio Green Dk",
        hex: "#617a52",
        code: "367",
        family: "green"
    },
    {
        id: 368,
        name: "Pistachio Green Lt",
        hex: "#a6c298",
        code: "368",
        family: "green"
    },
    {
        id: 369,
        name: "Pistachio Green Vy Lt",
        hex: "#d7edcc",
        code: "369",
        family: "green"
    },
    {
        id: 370,
        name: "Mustard Medium",
        hex: "#b89d64",
        code: "370",
        family: "yellow"
    },
    {
        id: 371,
        name: "Mustard",
        hex: "#bfa671",
        code: "371",
        family: "yellow"
    },
    {
        id: 372,
        name: "Mustard Lt",
        hex: "#ccb784",
        code: "372",
        family: "yellow"
    },
    {
        id: 400,
        name: "Mahogany Dark",
        hex: "#8f430f",
        code: "400",
        family: "orange"
    },
    {
        id: 402,
        name: "Mahogany Vy Lt",
        hex: "#f7a777",
        code: "402",
        family: "orange"
    },
    {
        id: 407,
        name: "Desert Sand Med",
        hex: "#bb8161",
        code: "407",
        family: "neutrals"
    },
    {
        id: 413,
        name: "Pewter Gray Dark",
        hex: "#565656",
        code: "413",
        family: "neutrals"
    },
    {
        id: 414,
        name: "Steel Gray Dk",
        hex: "#8c8c8c",
        code: "414",
        family: "neutrals"
    },
    {
        id: 415,
        name: "Pearl Gray",
        hex: "#d3d3d6",
        code: "415",
        family: "neutrals"
    },
    {
        id: 420,
        name: "Hazelnut Brown Dk",
        hex: "#a07042",
        code: "420",
        family: "neutrals"
    },
    {
        id: 422,
        name: "Hazelnut Brown Lt",
        hex: "#c69f7b",
        code: "422",
        family: "neutrals"
    },
    {
        id: 433,
        name: "Brown Med",
        hex: "#7a451f",
        code: "433",
        family: "neutrals"
    },
    {
        id: 434,
        name: "Brown Light",
        hex: "#985e33",
        code: "434",
        family: "neutrals"
    },
    {
        id: 435,
        name: "Brown Very Light",
        hex: "#b87748",
        code: "435",
        family: "neutrals"
    },
    {
        id: 436,
        name: "Tan",
        hex: "#cb9051",
        code: "436",
        family: "neutrals"
    },
    {
        id: 437,
        name: "Tan Light",
        hex: "#e4bb8e",
        code: "437",
        family: "neutrals"
    },
    {
        id: 444,
        name: "Lemon Dark",
        hex: "#ffd600",
        code: "444",
        family: "yellow"
    },
    {
        id: 445,
        name: "Lemon Light",
        hex: "#fffb8b",
        code: "445",
        family: "yellow"
    },
    {
        id: 451,
        name: "Shell Gray Dark",
        hex: "#917b73",
        code: "451",
        family: "neutrals"
    },
    {
        id: 452,
        name: "Shell Gray Med",
        hex: "#c0b3ae",
        code: "452",
        family: "neutrals"
    },
    {
        id: 453,
        name: "Shell Gray Light",
        hex: "#d7cecb",
        code: "453",
        family: "neutrals"
    },
    {
        id: 469,
        name: "Avocado Green",
        hex: "#72843c",
        code: "469",
        family: "green"
    },
    {
        id: 470,
        name: "Avocado Grn Lt",
        hex: "#94ab4f",
        code: "470",
        family: "green"
    },
    {
        id: 471,
        name: "Avocado Grn V Lt",
        hex: "#aebf79",
        code: "471",
        family: "green"
    },
    {
        id: 472,
        name: "Avocado Grn U Lt",
        hex: "#d8e498",
        code: "472",
        family: "green"
    },
    {
        id: 498,
        name: "Red Dark",
        hex: "#a7132b",
        code: "498",
        family: "red"
    },
    {
        id: 500,
        name: "Blue Green Vy Dk",
        hex: "#044d33",
        code: "500",
        family: "green"
    },
    {
        id: 501,
        name: "Blue Green Dark",
        hex: "#396f52",
        code: "501",
        family: "green"
    },
    {
        id: 502,
        name: "Blue Green",
        hex: "#5b9071",
        code: "502",
        family: "green"
    },
    {
        id: 503,
        name: "Blue Green Med",
        hex: "#7bac94",
        code: "503",
        family: "green"
    },
    {
        id: 504,
        name: "Blue Green Vy Lt",
        hex: "#c4decc",
        code: "504",
        family: "green"
    },
    {
        id: 505,
        name: "Jade Green",
        hex: "#338362",
        code: "505",
        family: "green"
    },
    {
        id: 517,
        name: "Wedgewood Dark",
        hex: "#3b768f",
        code: "517",
        family: "blue"
    },
    {
        id: 518,
        name: "Wedgewood Light",
        hex: "#4f93a7",
        code: "518",
        family: "blue"
    },
    {
        id: 519,
        name: "Sky Blue",
        hex: "#7eb1c8",
        code: "519",
        family: "blue"
    },
    {
        id: 520,
        name: "Fern Green Dark",
        hex: "#666d4f",
        code: "520",
        family: "green"
    },
    {
        id: 522,
        name: "Fern Green",
        hex: "#969e7e",
        code: "522",
        family: "green"
    },
    {
        id: 523,
        name: "Fern Green Lt",
        hex: "#abb197",
        code: "523",
        family: "green"
    },
    {
        id: 524,
        name: "Fern Green Vy Lt",
        hex: "#c4cdac",
        code: "524",
        family: "green"
    },
    {
        id: 535,
        name: "Ash Gray Vy Lt",
        hex: "#636458",
        code: "535",
        family: "neutrals"
    },
    {
        id: 543,
        name: "Beige Brown Ult Vy Lt",
        hex: "#f2e3ce",
        code: "543",
        family: "neutrals"
    },
    {
        id: 550,
        name: "Violet Very Dark",
        hex: "#5c184e",
        code: "550",
        family: "violet"
    },
    {
        id: 552,
        name: "Violet  Medium",
        hex: "#803a6b",
        code: "552",
        family: "violet"
    },
    {
        id: 553,
        name: "Violet",
        hex: "#a3638b",
        code: "553",
        family: "violet"
    },
    {
        id: 554,
        name: "Violet Light",
        hex: "#dbb3cb",
        code: "554",
        family: "violet"
    },
    {
        id: 561,
        name: "Celadon Green VD",
        hex: "#2c6a45",
        code: "561",
        family: "green"
    },
    {
        id: 562,
        name: "Jade Medium",
        hex: "#53976a",
        code: "562",
        family: "green"
    },
    {
        id: 563,
        name: "Jade Light",
        hex: "#8fc098",
        code: "563",
        family: "green"
    },
    {
        id: 564,
        name: "Jade Very Light",
        hex: "#a7cdaf",
        code: "564",
        family: "green"
    },
    {
        id: 580,
        name: "Moss Green Dk",
        hex: "#888d33",
        code: "580",
        family: "green"
    },
    {
        id: 581,
        name: "Moss Green",
        hex: "#a7ae38",
        code: "581",
        family: "green"
    },
    {
        id: 597,
        name: "Turquoise",
        hex: "#5ba3b3",
        code: "597",
        family: "blue"
    },
    {
        id: 598,
        name: "Turquoise Light",
        hex: "#90c3cc",
        code: "598",
        family: "blue"
    },
    {
        id: 600,
        name: "Cranberry Very Dark",
        hex: "#cd2f63",
        code: "600",
        family: "red"
    },
    {
        id: 601,
        name: "Cranberry Dark",
        hex: "#d1286a",
        code: "601",
        family: "violet"
    },
    {
        id: 602,
        name: "Cranberry Medium",
        hex: "#e24874",
        code: "602",
        family: "red"
    },
    {
        id: 603,
        name: "Cranberry",
        hex: "#ffa4be",
        code: "603",
        family: "red"
    },
    {
        id: 604,
        name: "Cranberry Light",
        hex: "#ffb0be",
        code: "604",
        family: "red"
    },
    {
        id: 605,
        name: "Cranberry Very Light",
        hex: "#ffc0cd",
        code: "605",
        family: "red"
    },
    {
        id: 606,
        name: "Orange?Red Bright",
        hex: "#fa3203",
        code: "606",
        family: "orange"
    },
    {
        id: 608,
        name: "Burnt Orange Bright",
        hex: "#fd5d35",
        code: "608",
        family: "orange"
    },
    {
        id: 610,
        name: "Drab Brown Dk",
        hex: "#796047",
        code: "610",
        family: "neutrals"
    },
    {
        id: 611,
        name: "Drab Brown",
        hex: "#967656",
        code: "611",
        family: "neutrals"
    },
    {
        id: 612,
        name: "Drab Brown Lt",
        hex: "#bc9a78",
        code: "612",
        family: "neutrals"
    },
    {
        id: 613,
        name: "Drab Brown V Lt",
        hex: "#dcc4aa",
        code: "613",
        family: "neutrals"
    },
    {
        id: 632,
        name: "Desert Sand Ult Vy Dk",
        hex: "#875539",
        code: "632",
        family: "neutrals"
    },
    {
        id: 640,
        name: "Beige Gray Vy Dk",
        hex: "#857b61",
        code: "640",
        family: "neutrals"
    },
    {
        id: 642,
        name: "Beige Gray Dark",
        hex: "#a49878",
        code: "642",
        family: "neutrals"
    },
    {
        id: 644,
        name: "Beige Gray Med",
        hex: "#ddd8cb",
        code: "644",
        family: "neutrals"
    },
    {
        id: 645,
        name: "Beaver Gray Vy Dk",
        hex: "#6e655c",
        code: "645",
        family: "neutrals"
    },
    {
        id: 646,
        name: "Beaver Gray Dk",
        hex: "#877d73",
        code: "646",
        family: "neutrals"
    },
    {
        id: 647,
        name: "Beaver Gray Med",
        hex: "#b0a69c",
        code: "647",
        family: "neutrals"
    },
    {
        id: 648,
        name: "Beaver Gray Lt",
        hex: "#bcb4ac",
        code: "648",
        family: "neutrals"
    },
    {
        id: 666,
        name: "Bright Red",
        hex: "#e31d42",
        code: "666",
        family: "red"
    },
    {
        id: 676,
        name: "Old Gold Lt",
        hex: "#e5ce97",
        code: "676",
        family: "orange"
    },
    {
        id: 677,
        name: "Old Gold Vy Lt",
        hex: "#f5eccb",
        code: "677",
        family: "yellow"
    },
    {
        id: 680,
        name: "Old Gold Dark",
        hex: "#bc8d0e",
        code: "680",
        family: "yellow"
    },
    {
        id: 699,
        name: "Green",
        hex: "#056517",
        code: "699",
        family: "green"
    },
    {
        id: 700,
        name: "Green Bright",
        hex: "#07731b",
        code: "700",
        family: "green"
    },
    {
        id: 701,
        name: "Green Light",
        hex: "#3f8f29",
        code: "701",
        family: "green"
    },
    {
        id: 702,
        name: "Kelly Green",
        hex: "#47a72f",
        code: "702",
        family: "green"
    },
    {
        id: 703,
        name: "Chartreuse",
        hex: "#7bb547",
        code: "703",
        family: "green"
    },
    {
        id: 704,
        name: "Chartreuse Bright",
        hex: "#9ecf34",
        code: "704",
        family: "green"
    },
    {
        id: 712,
        name: "Cream",
        hex: "#fffbef",
        code: "712",
        family: "neutrals"
    },
    {
        id: 718,
        name: "Plum",
        hex: "#9c2462",
        code: "718",
        family: "violet"
    },
    {
        id: 720,
        name: "Orange Spice Dark",
        hex: "#e55c1f",
        code: "720",
        family: "orange"
    },
    {
        id: 721,
        name: "Orange Spice Med",
        hex: "#f27842",
        code: "721",
        family: "orange"
    },
    {
        id: 722,
        name: "Orange Spice Light",
        hex: "#f7976f",
        code: "722",
        family: "orange"
    },
    {
        id: 725,
        name: "Topaz Med Lt",
        hex: "#ffc840",
        code: "725",
        family: "orange"
    },
    {
        id: 726,
        name: "Topaz Light",
        hex: "#fdd755",
        code: "726",
        family: "yellow"
    },
    {
        id: 727,
        name: "Topaz Vy Lt",
        hex: "#fff1af",
        code: "727",
        family: "yellow"
    },
    {
        id: 728,
        name: "Topaz",
        hex: "#e4b468",
        code: "728",
        family: "orange"
    },
    {
        id: 729,
        name: "Old Gold Medium",
        hex: "#d0a53e",
        code: "729",
        family: "yellow"
    },
    {
        id: 730,
        name: "Olive Green V Dk",
        hex: "#827b30",
        code: "730",
        family: "green"
    },
    {
        id: 731,
        name: "Olive Green Dk",
        hex: "#938b37",
        code: "731",
        family: "green"
    },
    {
        id: 732,
        name: "Olive Green",
        hex: "#948c36",
        code: "732",
        family: "green"
    },
    {
        id: 733,
        name: "Olive Green Md",
        hex: "#bcb34c",
        code: "733",
        family: "green"
    },
    {
        id: 734,
        name: "Olive Green Lt",
        hex: "#c7c077",
        code: "734",
        family: "green"
    },
    {
        id: 738,
        name: "Tan Very Light",
        hex: "#eccc9e",
        code: "738",
        family: "neutrals"
    },
    {
        id: 739,
        name: "Tan Ult Vy Lt",
        hex: "#f8e4c8",
        code: "739",
        family: "neutrals"
    },
    {
        id: 740,
        name: "Tangerine",
        hex: "#ff8b00",
        code: "740",
        family: "orange"
    },
    {
        id: 741,
        name: "Tangerine Med",
        hex: "#ffa32b",
        code: "741",
        family: "orange"
    },
    {
        id: 742,
        name: "Tangerine Light",
        hex: "#ffbf57",
        code: "742",
        family: "orange"
    },
    {
        id: 743,
        name: "Yellow Med",
        hex: "#fed376",
        code: "743",
        family: "yellow"
    },
    {
        id: 744,
        name: "Yellow Pale",
        hex: "#ffe793",
        code: "744",
        family: "yellow"
    },
    {
        id: 745,
        name: "Yellow Pale Light",
        hex: "#ffe9ad",
        code: "745",
        family: "yellow"
    },
    {
        id: 746,
        name: "Off White",
        hex: "#fcfcee",
        code: "746",
        family: "neutrals"
    },
    {
        id: 747,
        name: "Peacock Blue Vy Lt",
        hex: "#e5fcfd",
        code: "747",
        family: "blue"
    },
    {
        id: 754,
        name: "Peach Light",
        hex: "#f7cbbf",
        code: "754",
        family: "red"
    },
    {
        id: 758,
        name: "Terra Cotta Vy Lt",
        hex: "#eeaa9b",
        code: "758",
        family: "red"
    },
    {
        id: 760,
        name: "Salmon",
        hex: "#f5adad",
        code: "760",
        family: "red"
    },
    {
        id: 761,
        name: "Salmon Light",
        hex: "#ffc9c9",
        code: "761",
        family: "red"
    },
    {
        id: 762,
        name: "Pearl Gray Vy Lt",
        hex: "#ececec",
        code: "762",
        family: "neutrals"
    },
    {
        id: 772,
        name: "Yellow Green Vy Lt",
        hex: "#e4ecd4",
        code: "772",
        family: "green"
    },
    {
        id: 775,
        name: "Baby Blue Very Light",
        hex: "#d9ebf1",
        code: "775",
        family: "blue"
    },
    {
        id: 776,
        name: "Pink Medium",
        hex: "#fcb0b9",
        code: "776",
        family: "red"
    },
    {
        id: 777,
        name: "Raspberry Very Dark",
        hex: "#913546",
        code: "777",
        family: "red"
    },
    {
        id: 778,
        name: "Antique Mauve Vy Lt",
        hex: "#dfb3bb",
        code: "778",
        family: "red"
    },
    {
        id: 779,
        name: "Cocoa Dark",
        hex: "#624b45",
        code: "779",
        family: "neutrals"
    },
    {
        id: 780,
        name: "Topaz Ultra Vy Dk",
        hex: "#94631a",
        code: "780",
        family: "orange"
    },
    {
        id: 781,
        name: "Topaz Very Dark",
        hex: "#a26d20",
        code: "781",
        family: "orange"
    },
    {
        id: 782,
        name: "Topaz Dark",
        hex: "#ae7720",
        code: "782",
        family: "orange"
    },
    {
        id: 783,
        name: "Topaz Medium",
        hex: "#ce9124",
        code: "783",
        family: "orange"
    },
    {
        id: 791,
        name: "Cornflower Blue V D",
        hex: "#464563",
        code: "791",
        family: "blue"
    },
    {
        id: 792,
        name: "Cornflower Blue Dark",
        hex: "#555b7b",
        code: "792",
        family: "blue"
    },
    {
        id: 793,
        name: "Cornflower Blue Med",
        hex: "#707da2",
        code: "793",
        family: "blue"
    },
    {
        id: 794,
        name: "Cornflower Blue Light",
        hex: "#8f9cc1",
        code: "794",
        family: "blue"
    },
    {
        id: 796,
        name: "Royal Blue Dark",
        hex: "#11416d",
        code: "796",
        family: "blue"
    },
    {
        id: 797,
        name: "Royal Blue",
        hex: "#13477d",
        code: "797",
        family: "blue"
    },
    {
        id: 798,
        name: "Delft Blue Dark",
        hex: "#466a8e",
        code: "798",
        family: "blue"
    },
    {
        id: 799,
        name: "Delft Blue Medium",
        hex: "#748eb6",
        code: "799",
        family: "blue"
    },
    {
        id: 800,
        name: "Delft Blue Pale",
        hex: "#c0ccde",
        code: "800",
        family: "blue"
    },
    {
        id: 801,
        name: "Coffee Brown Dk",
        hex: "#653919",
        code: "801",
        family: "neutrals"
    },
    {
        id: 803,
        name: "Baby Blue Ult Vy Dk",
        hex: "#2c597c",
        code: "803",
        family: "blue"
    },
    {
        id: 806,
        name: "Peacock Blue Dark",
        hex: "#3d95a5",
        code: "806",
        family: "blue"
    },
    {
        id: 807,
        name: "Peacock Blue",
        hex: "#64abba",
        code: "807",
        family: "blue"
    },
    {
        id: 809,
        name: "Delft Blue",
        hex: "#94a8c6",
        code: "809",
        family: "blue"
    },
    {
        id: 813,
        name: "Blue Light",
        hex: "#a1c2d7",
        code: "813",
        family: "blue"
    },
    {
        id: 814,
        name: "Garnet Dark",
        hex: "#7b001b",
        code: "814",
        family: "red"
    },
    {
        id: 815,
        name: "Garnet Medium",
        hex: "#87071f",
        code: "815",
        family: "red"
    },
    {
        id: 816,
        name: "Garnet",
        hex: "#970b23",
        code: "816",
        family: "red"
    },
    {
        id: 817,
        name: "Coral Red Very Dark",
        hex: "#bb051f",
        code: "817",
        family: "red"
    },
    {
        id: 818,
        name: "Baby Pink",
        hex: "#ffdfd9",
        code: "818",
        family: "red"
    },
    {
        id: 819,
        name: "Baby Pink Light",
        hex: "#ffeeeb",
        code: "819",
        family: "red"
    },
    {
        id: 820,
        name: "Royal Blue Very Dark",
        hex: "#0e365c",
        code: "820",
        family: "blue"
    },
    {
        id: 822,
        name: "Beige Gray Light",
        hex: "#e7e2d3",
        code: "822",
        family: "neutrals"
    },
    {
        id: 823,
        name: "Navy Blue Dark",
        hex: "#213063",
        code: "823",
        family: "blue"
    },
    {
        id: 824,
        name: "Blue Very Dark",
        hex: "#396987",
        code: "824",
        family: "blue"
    },
    {
        id: 825,
        name: "Blue Dark",
        hex: "#4781a5",
        code: "825",
        family: "blue"
    },
    {
        id: 826,
        name: "Blue Medium",
        hex: "#6b9ebf",
        code: "826",
        family: "blue"
    },
    {
        id: 827,
        name: "Blue Very Light",
        hex: "#bddded",
        code: "827",
        family: "blue"
    },
    {
        id: 828,
        name: "Sky Blue Vy Lt",
        hex: "#c5e8ed",
        code: "828",
        family: "blue"
    },
    {
        id: 829,
        name: "Golden Olive Vy Dk",
        hex: "#7e6b42",
        code: "829",
        family: "orange"
    },
    {
        id: 830,
        name: "Golden Olive Dk",
        hex: "#8d784b",
        code: "830",
        family: "orange"
    },
    {
        id: 831,
        name: "Golden Olive Md",
        hex: "#aa8f56",
        code: "831",
        family: "yellow"
    },
    {
        id: 832,
        name: "Golden Olive",
        hex: "#bd9b51",
        code: "832",
        family: "yellow"
    },
    {
        id: 833,
        name: "Golden Olive Lt",
        hex: "#c8ab6c",
        code: "833",
        family: "yellow"
    },
    {
        id: 834,
        name: "Golden Olive Vy Lt",
        hex: "#dbbe7f",
        code: "834",
        family: "yellow"
    },
    {
        id: 838,
        name: "Beige Brown Vy Dk",
        hex: "#594937",
        code: "838",
        family: "neutrals"
    },
    {
        id: 839,
        name: "Beige Brown Dk",
        hex: "#675541",
        code: "839",
        family: "neutrals"
    },
    {
        id: 840,
        name: "Beige Brown Med",
        hex: "#9a7c5c",
        code: "840",
        family: "neutrals"
    },
    {
        id: 841,
        name: "Beige Brown Lt",
        hex: "#b69b7e",
        code: "841",
        family: "neutrals"
    },
    {
        id: 842,
        name: "Beige Brown Vy Lt",
        hex: "#d1baa1",
        code: "842",
        family: "neutrals"
    },
    {
        id: 844,
        name: "Beaver Gray Ult Dk",
        hex: "#484848",
        code: "844",
        family: "neutrals"
    },
    {
        id: 869,
        name: "Hazelnut Brown V Dk",
        hex: "#835e39",
        code: "869",
        family: "neutrals"
    },
    {
        id: 890,
        name: "Pistachio Grn Ult V D",
        hex: "#174923",
        code: "890",
        family: "green"
    },
    {
        id: 891,
        name: "Carnation Dark",
        hex: "#ff5773",
        code: "891",
        family: "red"
    },
    {
        id: 892,
        name: "Carnation Medium",
        hex: "#ff798c",
        code: "892",
        family: "red"
    },
    {
        id: 893,
        name: "Carnation Light",
        hex: "#fc90a2",
        code: "893",
        family: "red"
    },
    {
        id: 894,
        name: "Carnation Very Light",
        hex: "#ffb2bb",
        code: "894",
        family: "red"
    },
    {
        id: 895,
        name: "Hunter Green Vy Dk",
        hex: "#1b5300",
        code: "895",
        family: "green"
    },
    {
        id: 898,
        name: "Coffee Brown Vy Dk",
        hex: "#492a13",
        code: "898",
        family: "neutrals"
    },
    {
        id: 899,
        name: "Rose Medium",
        hex: "#f27688",
        code: "899",
        family: "red"
    },
    {
        id: 900,
        name: "Burnt Orange Dark",
        hex: "#d15807",
        code: "900",
        family: "orange"
    },
    {
        id: 902,
        name: "Garnet Very Dark",
        hex: "#822637",
        code: "902",
        family: "red"
    },
    {
        id: 904,
        name: "Parrot Green V Dk",
        hex: "#557822",
        code: "904",
        family: "green"
    },
    {
        id: 905,
        name: "Parrot Green Dk",
        hex: "#628a28",
        code: "905",
        family: "green"
    },
    {
        id: 906,
        name: "Parrot Green Md",
        hex: "#7fb335",
        code: "906",
        family: "green"
    },
    {
        id: 907,
        name: "Parrot Green Lt",
        hex: "#c7e666",
        code: "907",
        family: "green"
    },
    {
        id: 909,
        name: "Emerald Green Vy Dk",
        hex: "#156f49",
        code: "909",
        family: "green"
    },
    {
        id: 910,
        name: "Emerald Green Dark",
        hex: "#187e56",
        code: "910",
        family: "green"
    },
    {
        id: 911,
        name: "Emerald Green Med",
        hex: "#189065",
        code: "911",
        family: "green"
    },
    {
        id: 912,
        name: "Emerald Green Lt",
        hex: "#1b9d6b",
        code: "912",
        family: "green"
    },
    {
        id: 913,
        name: "Nile Green Med",
        hex: "#6dab77",
        code: "913",
        family: "green"
    },
    {
        id: 915,
        name: "Plum Dark",
        hex: "#820043",
        code: "915",
        family: "violet"
    },
    {
        id: 917,
        name: "Plum Medium",
        hex: "#9b1359",
        code: "917",
        family: "violet"
    },
    {
        id: 918,
        name: "Red?Copper Dark",
        hex: "#82340a",
        code: "918",
        family: "orange"
    },
    {
        id: 919,
        name: "Red?Copper",
        hex: "#a64510",
        code: "919",
        family: "orange"
    },
    {
        id: 920,
        name: "Copper Med",
        hex: "#ac5414",
        code: "920",
        family: "orange"
    },
    {
        id: 921,
        name: "Copper",
        hex: "#c66218",
        code: "921",
        family: "orange"
    },
    {
        id: 922,
        name: "Copper Light",
        hex: "#e27323",
        code: "922",
        family: "orange"
    },
    {
        id: 924,
        name: "Gray Green Vy Dark",
        hex: "#566a6a",
        code: "924",
        family: "blue"
    },
    {
        id: 926,
        name: "Gray Green Med",
        hex: "#98aeae",
        code: "926",
        family: "blue"
    },
    {
        id: 927,
        name: "Gray Green Light",
        hex: "#bdcbcb",
        code: "927",
        family: "neutrals"
    },
    {
        id: 928,
        name: "Gray Green Vy Lt",
        hex: "#dde3e3",
        code: "928",
        family: "neutrals"
    },
    {
        id: 930,
        name: "Antique Blue Dark",
        hex: "#455c71",
        code: "930",
        family: "blue"
    },
    {
        id: 931,
        name: "Antique Blue Medium",
        hex: "#6a859e",
        code: "931",
        family: "blue"
    },
    {
        id: 932,
        name: "Antique Blue Light",
        hex: "#a2b5c6",
        code: "932",
        family: "blue"
    },
    {
        id: 934,
        name: "Avocado Grn Black",
        hex: "#313919",
        code: "934",
        family: "green"
    },
    {
        id: 935,
        name: "Avocado Green Dk",
        hex: "#424d21",
        code: "935",
        family: "green"
    },
    {
        id: 936,
        name: "Avocado Grn V Dk",
        hex: "#4c5826",
        code: "936",
        family: "green"
    },
    {
        id: 937,
        name: "Avocado Green Md",
        hex: "#627133",
        code: "937",
        family: "green"
    },
    {
        id: 938,
        name: "Coffee Brown Ult Dk",
        hex: "#361f0e",
        code: "938",
        family: "neutrals"
    },
    {
        id: 939,
        name: "Navy Blue Very Dark",
        hex: "#1b2853",
        code: "939",
        family: "blue"
    },
    {
        id: 943,
        name: "Green Bright Md",
        hex: "#3d9384",
        code: "943",
        family: "blue"
    },
    {
        id: 945,
        name: "Tawny",
        hex: "#fbd5bb",
        code: "945",
        family: "orange"
    },
    {
        id: 946,
        name: "Burnt Orange Med",
        hex: "#eb6307",
        code: "946",
        family: "orange"
    },
    {
        id: 947,
        name: "Burnt Orange",
        hex: "#ff7b4d",
        code: "947",
        family: "orange"
    },
    {
        id: 948,
        name: "Peach Very Light",
        hex: "#fee7da",
        code: "948",
        family: "orange"
    },
    {
        id: 950,
        name: "Desert Sand Light",
        hex: "#eed3c4",
        code: "950",
        family: "neutrals"
    },
    {
        id: 951,
        name: "Tawny Light",
        hex: "#ffe2cf",
        code: "951",
        family: "orange"
    },
    {
        id: 954,
        name: "Nile Green",
        hex: "#88ba91",
        code: "954",
        family: "green"
    },
    {
        id: 955,
        name: "Nile Green Light",
        hex: "#a2d6ad",
        code: "955",
        family: "green"
    },
    {
        id: 956,
        name: "Geranium",
        hex: "#ff9191",
        code: "956",
        family: "red"
    },
    {
        id: 957,
        name: "Geranium Pale",
        hex: "#fdb5b5",
        code: "957",
        family: "red"
    },
    {
        id: 958,
        name: "Sea Green Dark",
        hex: "#3eb6a1",
        code: "958",
        family: "blue"
    },
    {
        id: 959,
        name: "Sea Green Med",
        hex: "#59c7b4",
        code: "959",
        family: "blue"
    },
    {
        id: 961,
        name: "Dusty Rose Dark",
        hex: "#cf7373",
        code: "961",
        family: "red"
    },
    {
        id: 962,
        name: "Dusty Rose Medium",
        hex: "#e68a8a",
        code: "962",
        family: "red"
    },
    {
        id: 963,
        name: "Dusty Rose Ult Vy Lt",
        hex: "#ffd7d7",
        code: "963",
        family: "red"
    },
    {
        id: 964,
        name: "Sea Green Light",
        hex: "#a9e2d8",
        code: "964",
        family: "blue"
    },
    {
        id: 966,
        name: "Jade Ultra Vy Lt",
        hex: "#b9d7c0",
        code: "966",
        family: "green"
    },
    {
        id: 967,
        name: "Apricot Very Light",
        hex: "#ffded5",
        code: "967",
        family: "red"
    },
    {
        id: 970,
        name: "Pumpkin Light",
        hex: "#f78b13",
        code: "970",
        family: "orange"
    },
    {
        id: 971,
        name: "Pumpkin",
        hex: "#f67f00",
        code: "971",
        family: "orange"
    },
    {
        id: 972,
        name: "Canary Deep",
        hex: "#ffb515",
        code: "972",
        family: "orange"
    },
    {
        id: 973,
        name: "Canary Bright",
        hex: "#ffe300",
        code: "973",
        family: "yellow"
    },
    {
        id: 975,
        name: "Golden Brown Dk",
        hex: "#914f12",
        code: "975",
        family: "neutrals"
    },
    {
        id: 976,
        name: "Golden Brown Med",
        hex: "#c28142",
        code: "976",
        family: "neutrals"
    },
    {
        id: 977,
        name: "Golden Brown Light",
        hex: "#dc9c56",
        code: "977",
        family: "orange"
    },
    {
        id: 986,
        name: "Forest Green Vy Dk",
        hex: "#405230",
        code: "986",
        family: "green"
    },
    {
        id: 987,
        name: "Forest Green Dk",
        hex: "#587141",
        code: "987",
        family: "green"
    },
    {
        id: 988,
        name: "Forest Green Med",
        hex: "#738b5b",
        code: "988",
        family: "green"
    },
    {
        id: 989,
        name: "Forest Green",
        hex: "#8da675",
        code: "989",
        family: "green"
    },
    {
        id: 991,
        name: "Aquamarine Dk",
        hex: "#477b6e",
        code: "991",
        family: "blue"
    },
    {
        id: 992,
        name: "Aquamarine Lt",
        hex: "#6fae9f",
        code: "992",
        family: "blue"
    },
    {
        id: 993,
        name: "Aquamarine Vy Lt",
        hex: "#90c0b4",
        code: "993",
        family: "blue"
    },
    {
        id: 995,
        name: "Electric Blue Dark",
        hex: "#2696b6",
        code: "995",
        family: "blue"
    },
    {
        id: 996,
        name: "Electric Blue Medium",
        hex: "#30c2ec",
        code: "996",
        family: "blue"
    },
    {
        id: 3011,
        name: "Khaki Green Dk",
        hex: "#898a58",
        code: "3011",
        family: "green"
    },
    {
        id: 3012,
        name: "Khaki Green Md",
        hex: "#a6a75d",
        code: "3012",
        family: "green"
    },
    {
        id: 3013,
        name: "Khaki Green Lt",
        hex: "#b9b982",
        code: "3013",
        family: "green"
    },
    {
        id: 3021,
        name: "Brown Gray Vy Dk",
        hex: "#4f4b41",
        code: "3021",
        family: "neutrals"
    },
    {
        id: 3022,
        name: "Brown Gray Med",
        hex: "#8e9078",
        code: "3022",
        family: "neutrals"
    },
    {
        id: 3023,
        name: "Brown Gray Light",
        hex: "#b1aa97",
        code: "3023",
        family: "neutrals"
    },
    {
        id: 3024,
        name: "Brown Gray Vy Lt",
        hex: "#ebeae7",
        code: "3024",
        family: "neutrals"
    },
    {
        id: 3031,
        name: "Mocha Brown Vy Dk",
        hex: "#4b3c2a",
        code: "3031",
        family: "neutrals"
    },
    {
        id: 3032,
        name: "Mocha Brown Med",
        hex: "#b39f8b",
        code: "3032",
        family: "neutrals"
    },
    {
        id: 3033,
        name: "Mocha Brown Vy Lt",
        hex: "#e3d8cc",
        code: "3033",
        family: "neutrals"
    },
    {
        id: 3041,
        name: "Antique Violet Medium",
        hex: "#956f7c",
        code: "3041",
        family: "violet"
    },
    {
        id: 3042,
        name: "Antique Violet Light",
        hex: "#b79da7",
        code: "3042",
        family: "violet"
    },
    {
        id: 3045,
        name: "Yellow Beige Dk",
        hex: "#bc966a",
        code: "3045",
        family: "neutrals"
    },
    {
        id: 3046,
        name: "Yellow Beige Md",
        hex: "#d8bc9a",
        code: "3046",
        family: "neutrals"
    },
    {
        id: 3047,
        name: "Yellow Beige Lt",
        hex: "#e7d6c1",
        code: "3047",
        family: "neutrals"
    },
    {
        id: 3051,
        name: "Green Gray Dk",
        hex: "#5f6648",
        code: "3051",
        family: "green"
    },
    {
        id: 3052,
        name: "Green Gray Md",
        hex: "#889268",
        code: "3052",
        family: "green"
    },
    {
        id: 3053,
        name: "Green Gray",
        hex: "#9ca482",
        code: "3053",
        family: "green"
    },
    {
        id: 3064,
        name: "Desert Sand",
        hex: "#c48e70",
        code: "3064",
        family: "neutrals"
    },
    {
        id: 3072,
        name: "Beaver Gray Vy Lt",
        hex: "#e6e8e8",
        code: "3072",
        family: "neutrals"
    },
    {
        id: 3078,
        name: "Golden Yellow Vy Lt",
        hex: "#fdf9cd",
        code: "3078",
        family: "yellow"
    },
    {
        id: 3325,
        name: "Baby Blue Light",
        hex: "#b8d2e6",
        code: "3325",
        family: "blue"
    },
    {
        id: 3326,
        name: "Rose Light",
        hex: "#fbadb4",
        code: "3326",
        family: "red"
    },
    {
        id: 3328,
        name: "Salmon Dark",
        hex: "#e36d6d",
        code: "3328",
        family: "red"
    },
    {
        id: 3340,
        name: "Apricot Med",
        hex: "#ff836f",
        code: "3340",
        family: "orange"
    },
    {
        id: 3341,
        name: "Apricot",
        hex: "#fcab98",
        code: "3341",
        family: "red"
    },
    {
        id: 3345,
        name: "Hunter Green Dk",
        hex: "#1b5915",
        code: "3345",
        family: "green"
    },
    {
        id: 3346,
        name: "Hunter Green",
        hex: "#406a3a",
        code: "3346",
        family: "green"
    },
    {
        id: 3347,
        name: "Yellow Green Med",
        hex: "#71935c",
        code: "3347",
        family: "green"
    },
    {
        id: 3348,
        name: "Yellow Green Lt",
        hex: "#ccd9b1",
        code: "3348",
        family: "green"
    },
    {
        id: 3350,
        name: "Dusty Rose Ultra Dark",
        hex: "#bc4365",
        code: "3350",
        family: "red"
    },
    {
        id: 3354,
        name: "Dusty Rose Light",
        hex: "#e4a6ac",
        code: "3354",
        family: "red"
    },
    {
        id: 3362,
        name: "Pine Green Dk",
        hex: "#5e6b47",
        code: "3362",
        family: "green"
    },
    {
        id: 3363,
        name: "Pine Green Md",
        hex: "#728256",
        code: "3363",
        family: "green"
    },
    {
        id: 3364,
        name: "Pine Green",
        hex: "#83975f",
        code: "3364",
        family: "green"
    },
    {
        id: 3371,
        name: "Black Brown",
        hex: "#1e1108",
        code: "3371",
        family: "neutrals"
    },
    {
        id: 3607,
        name: "Plum Light",
        hex: "#c54989",
        code: "3607",
        family: "violet"
    },
    {
        id: 3608,
        name: "Plum Very Light",
        hex: "#ea9cc4",
        code: "3608",
        family: "violet"
    },
    {
        id: 3609,
        name: "Plum Ultra Light",
        hex: "#f4aed5",
        code: "3609",
        family: "violet"
    },
    {
        id: 3685,
        name: "Mauve Very Dark",
        hex: "#881531",
        code: "3685",
        family: "red"
    },
    {
        id: 3687,
        name: "Mauve",
        hex: "#c96b70",
        code: "3687",
        family: "red"
    },
    {
        id: 3688,
        name: "Mauve Medium",
        hex: "#e7a9ac",
        code: "3688",
        family: "red"
    },
    {
        id: 3689,
        name: "Mauve Light",
        hex: "#fbbfc2",
        code: "3689",
        family: "red"
    },
    {
        id: 3705,
        name: "Melon Dark",
        hex: "#ff7992",
        code: "3705",
        family: "red"
    },
    {
        id: 3706,
        name: "Melon Medium",
        hex: "#ffadbc",
        code: "3706",
        family: "red"
    },
    {
        id: 3708,
        name: "Melon Light",
        hex: "#ffcbd5",
        code: "3708",
        family: "red"
    },
    {
        id: 3712,
        name: "Salmon Medium",
        hex: "#f18787",
        code: "3712",
        family: "red"
    },
    {
        id: 3713,
        name: "Salmon Very Light",
        hex: "#ffe2e2",
        code: "3713",
        family: "red"
    },
    {
        id: 3716,
        name: "Dusty Rose Med Vy Lt",
        hex: "#ffbdbd",
        code: "3716",
        family: "red"
    },
    {
        id: 3721,
        name: "Shell Pink Dark",
        hex: "#a14b51",
        code: "3721",
        family: "red"
    },
    {
        id: 3722,
        name: "Shell Pink Med",
        hex: "#bc6c64",
        code: "3722",
        family: "red"
    },
    {
        id: 3726,
        name: "Antique Mauve Dark",
        hex: "#9b5b66",
        code: "3726",
        family: "red"
    },
    {
        id: 3727,
        name: "Antique Mauve Light",
        hex: "#dba9b2",
        code: "3727",
        family: "red"
    },
    {
        id: 3731,
        name: "Dusty Rose Very Dark",
        hex: "#da6783",
        code: "3731",
        family: "red"
    },
    {
        id: 3733,
        name: "Dusty Rose",
        hex: "#e8879b",
        code: "3733",
        family: "red"
    },
    {
        id: 3740,
        name: "Antique Violet Dark",
        hex: "#785762",
        code: "3740",
        family: "violet"
    },
    {
        id: 3743,
        name: "Antique Violet Vy Lt",
        hex: "#d7cbd3",
        code: "3743",
        family: "violet"
    },
    {
        id: 3746,
        name: "Blue Violet Dark",
        hex: "#776b98",
        code: "3746",
        family: "violet"
    },
    {
        id: 3747,
        name: "Blue Violet Vy Lt",
        hex: "#d3d7ed",
        code: "3747",
        family: "violet"
    },
    {
        id: 3750,
        name: "Antique Blue Very Dk",
        hex: "#384c5e",
        code: "3750",
        family: "blue"
    },
    {
        id: 3752,
        name: "Antique Blue Very Lt",
        hex: "#c7d1db",
        code: "3752",
        family: "neutrals"
    },
    {
        id: 3753,
        name: "Antique Blue Ult Vy Lt",
        hex: "#dbe2e9",
        code: "3753",
        family: "neutrals"
    },
    {
        id: 3755,
        name: "Baby Blue",
        hex: "#93b4ce",
        code: "3755",
        family: "blue"
    },
    {
        id: 3756,
        name: "Baby Blue Ult Vy Lt",
        hex: "#eefcfc",
        code: "3756",
        family: "blue"
    },
    {
        id: 3760,
        name: "Wedgewood Med",
        hex: "#3e85a2",
        code: "3760",
        family: "blue"
    },
    {
        id: 3761,
        name: "Sky Blue Light",
        hex: "#acd8e2",
        code: "3761",
        family: "blue"
    },
    {
        id: 3765,
        name: "Peacock Blue Vy Dk",
        hex: "#347f8c",
        code: "3765",
        family: "blue"
    },
    {
        id: 3766,
        name: "Peacock Blue Light",
        hex: "#99cfd9",
        code: "3766",
        family: "blue"
    },
    {
        id: 3768,
        name: "Gray Green Dark",
        hex: "#657f7f",
        code: "3768",
        family: "blue"
    },
    {
        id: 3770,
        name: "Tawny Vy Light",
        hex: "#ffeee3",
        code: "3770",
        family: "orange"
    },
    {
        id: 3771,
        name: "Terra Cotta Ult Vy Lt",
        hex: "#f4bba9",
        code: "3771",
        family: "red"
    },
    {
        id: 3772,
        name: "Desert Sand Vy Dk",
        hex: "#a06c50",
        code: "3772",
        family: "neutrals"
    },
    {
        id: 3773,
        name: "Desert Sand Dark",
        hex: "#b67552",
        code: "3773",
        family: "neutrals"
    },
    {
        id: 3774,
        name: "Desert Sand Vy Lt",
        hex: "#f3e1d7",
        code: "3774",
        family: "neutrals"
    },
    {
        id: 3776,
        name: "Mahogany Light",
        hex: "#cf7939",
        code: "3776",
        family: "orange"
    },
    {
        id: 3777,
        name: "Terra Cotta Vy Dk",
        hex: "#863022",
        code: "3777",
        family: "red"
    },
    {
        id: 3778,
        name: "Terra Cotta Light",
        hex: "#d98978",
        code: "3778",
        family: "red"
    },
    {
        id: 3779,
        name: "Rosewood Ult Vy Lt",
        hex: "#f8cac8",
        code: "3779",
        family: "red"
    },
    {
        id: 3781,
        name: "Mocha Brown Dk",
        hex: "#6b5743",
        code: "3781",
        family: "neutrals"
    },
    {
        id: 3782,
        name: "Mocha Brown Lt",
        hex: "#d2bca6",
        code: "3782",
        family: "neutrals"
    },
    {
        id: 3787,
        name: "Brown Gray Dark",
        hex: "#625d50",
        code: "3787",
        family: "neutrals"
    },
    {
        id: 3790,
        name: "Beige Gray Ult Dk",
        hex: "#7f6a55",
        code: "3790",
        family: "neutrals"
    },
    {
        id: 3799,
        name: "Pewter Gray Vy Dk",
        hex: "#424242",
        code: "3799",
        family: "neutrals"
    },
    {
        id: 3801,
        name: "Melon Very Dark",
        hex: "#e74967",
        code: "3801",
        family: "red"
    },
    {
        id: 3802,
        name: "Antique Mauve Vy Dk",
        hex: "#714149",
        code: "3802",
        family: "red"
    },
    {
        id: 3803,
        name: "Mauve Dark",
        hex: "#ab3357",
        code: "3803",
        family: "red"
    },
    {
        id: 3804,
        name: "Cyclamen Pink Dark",
        hex: "#e02876",
        code: "3804",
        family: "violet"
    },
    {
        id: 3805,
        name: "Cyclamen Pink",
        hex: "#f3478b",
        code: "3805",
        family: "violet"
    },
    {
        id: 3806,
        name: "Cyclamen Pink Light",
        hex: "#ff8cae",
        code: "3806",
        family: "red"
    },
    {
        id: 3807,
        name: "Cornflower Blue",
        hex: "#60678c",
        code: "3807",
        family: "blue"
    },
    {
        id: 3808,
        name: "Turquoise Ult Vy Dk",
        hex: "#366970",
        code: "3808",
        family: "blue"
    },
    {
        id: 3809,
        name: "Turquoise Vy Dark",
        hex: "#3f7c85",
        code: "3809",
        family: "blue"
    },
    {
        id: 3810,
        name: "Turquoise Dark",
        hex: "#488e9a",
        code: "3810",
        family: "blue"
    },
    {
        id: 3811,
        name: "Turquoise Very Light",
        hex: "#bce3e6",
        code: "3811",
        family: "blue"
    },
    {
        id: 3812,
        name: "Sea Green Vy Dk",
        hex: "#2f8c84",
        code: "3812",
        family: "blue"
    },
    {
        id: 3813,
        name: "Blue Green Lt",
        hex: "#b2d4bd",
        code: "3813",
        family: "green"
    },
    {
        id: 3814,
        name: "Aquamarine",
        hex: "#508b7d",
        code: "3814",
        family: "blue"
    },
    {
        id: 3815,
        name: "Celadon Green Dk",
        hex: "#477759",
        code: "3815",
        family: "green"
    },
    {
        id: 3816,
        name: "Celadon Green",
        hex: "#65a57d",
        code: "3816",
        family: "green"
    },
    {
        id: 3817,
        name: "Celadon Green Lt",
        hex: "#99c3aa",
        code: "3817",
        family: "green"
    },
    {
        id: 3818,
        name: "Emerald Grn Ult V Dk",
        hex: "#115a3b",
        code: "3818",
        family: "green"
    },
    {
        id: 3819,
        name: "Moss Green Lt",
        hex: "#e0e868",
        code: "3819",
        family: "green"
    },
    {
        id: 3820,
        name: "Straw Dark",
        hex: "#dfb65f",
        code: "3820",
        family: "yellow"
    },
    {
        id: 3821,
        name: "Straw",
        hex: "#f3ce75",
        code: "3821",
        family: "yellow"
    },
    {
        id: 3822,
        name: "Straw Light",
        hex: "#f6dc98",
        code: "3822",
        family: "yellow"
    },
    {
        id: 3823,
        name: "Yellow Ultra Pale",
        hex: "#fffde3",
        code: "3823",
        family: "yellow"
    },
    {
        id: 3824,
        name: "Apricot Light",
        hex: "#fecdc2",
        code: "3824",
        family: "red"
    },
    {
        id: 3825,
        name: "Pumpkin Pale",
        hex: "#fdbd96",
        code: "3825",
        family: "orange"
    },
    {
        id: 3826,
        name: "Golden Brown",
        hex: "#ad7239",
        code: "3826",
        family: "neutrals"
    },
    {
        id: 3827,
        name: "Golden Brown Pale",
        hex: "#f7bb77",
        code: "3827",
        family: "orange"
    },
    {
        id: 3828,
        name: "Hazelnut Brown",
        hex: "#b78b61",
        code: "3828",
        family: "neutrals"
    },
    {
        id: 3829,
        name: "Old Gold Vy Dark",
        hex: "#a98204",
        code: "3829",
        family: "yellow"
    },
    {
        id: 3830,
        name: "Terra Cotta",
        hex: "#b95544",
        code: "3830",
        family: "red"
    },
    {
        id: 3831,
        name: "Raspberry Dark",
        hex: "#b32f48",
        code: "3831",
        family: "red"
    },
    {
        id: 3832,
        name: "Raspberry Medium",
        hex: "#db556e",
        code: "3832",
        family: "red"
    },
    {
        id: 3833,
        name: "Raspberry Light",
        hex: "#ea8699",
        code: "3833",
        family: "red"
    },
    {
        id: 3834,
        name: "Grape Dark",
        hex: "#72375d",
        code: "3834",
        family: "violet"
    },
    {
        id: 3835,
        name: "Grape Medium",
        hex: "#946083",
        code: "3835",
        family: "violet"
    },
    {
        id: 3836,
        name: "Grape Light",
        hex: "#ba91aa",
        code: "3836",
        family: "violet"
    },
    {
        id: 3837,
        name: "Lavender Ultra Dark",
        hex: "#6c3a6e",
        code: "3837",
        family: "violet"
    },
    {
        id: 3838,
        name: "Lavender Blue Dark",
        hex: "#5c7294",
        code: "3838",
        family: "blue"
    },
    {
        id: 3839,
        name: "Lavender Blue Med",
        hex: "#7b8eab",
        code: "3839",
        family: "blue"
    },
    {
        id: 3840,
        name: "Lavender Blue Light",
        hex: "#b0c0da",
        code: "3840",
        family: "blue"
    },
    {
        id: 3841,
        name: "Baby Blue Pale",
        hex: "#cddfed",
        code: "3841",
        family: "blue"
    },
    {
        id: 3842,
        name: "Wedgewood Vry Dk",
        hex: "#32667c",
        code: "3842",
        family: "blue"
    },
    {
        id: 3843,
        name: "Electric Blue",
        hex: "#14aad0",
        code: "3843",
        family: "blue"
    },
    {
        id: 3844,
        name: "Turquoise Bright Dark",
        hex: "#12aeba",
        code: "3844",
        family: "blue"
    },
    {
        id: 3845,
        name: "Turquoise Bright Med",
        hex: "#04c4ca",
        code: "3845",
        family: "blue"
    },
    {
        id: 3846,
        name: "Turquoise Bright Light",
        hex: "#06e3e6",
        code: "3846",
        family: "blue"
    },
    {
        id: 3847,
        name: "Teal Green Dark",
        hex: "#347d75",
        code: "3847",
        family: "blue"
    },
    {
        id: 3848,
        name: "Teal Green Med",
        hex: "#559392",
        code: "3848",
        family: "blue"
    },
    {
        id: 3849,
        name: "Teal Green Light",
        hex: "#52b3a4",
        code: "3849",
        family: "blue"
    },
    {
        id: 3850,
        name: "Green Bright Dk",
        hex: "#378477",
        code: "3850",
        family: "blue"
    },
    {
        id: 3851,
        name: "Green Bright Lt",
        hex: "#49b3a1",
        code: "3851",
        family: "blue"
    },
    {
        id: 3852,
        name: "Straw Very Dark",
        hex: "#cd9d37",
        code: "3852",
        family: "yellow"
    },
    {
        id: 3853,
        name: "Autumn Gold Dk",
        hex: "#f29746",
        code: "3853",
        family: "orange"
    },
    {
        id: 3854,
        name: "Autumn Gold Med",
        hex: "#f2af68",
        code: "3854",
        family: "orange"
    },
    {
        id: 3855,
        name: "Autumn Gold Lt",
        hex: "#fad396",
        code: "3855",
        family: "orange"
    },
    {
        id: 3856,
        name: "Mahogany Ult Vy Lt",
        hex: "#ffd3b5",
        code: "3856",
        family: "orange"
    },
    {
        id: 3857,
        name: "Rosewood Dark",
        hex: "#68251a",
        code: "3857",
        family: "red"
    },
    {
        id: 3858,
        name: "Rosewood Med",
        hex: "#964a3f",
        code: "3858",
        family: "red"
    },
    {
        id: 3859,
        name: "Rosewood Light",
        hex: "#ba8b7c",
        code: "3859",
        family: "red"
    },
    {
        id: 3860,
        name: "Cocoa",
        hex: "#7d5d57",
        code: "3860",
        family: "neutrals"
    },
    {
        id: 3861,
        name: "Cocoa Light",
        hex: "#a68881",
        code: "3861",
        family: "neutrals"
    },
    {
        id: 3862,
        name: "Mocha Beige Dark",
        hex: "#8a6e4e",
        code: "3862",
        family: "neutrals"
    },
    {
        id: 3863,
        name: "Mocha Beige Med",
        hex: "#a4835c",
        code: "3863",
        family: "neutrals"
    },
    {
        id: 3864,
        name: "Mocha Beige Light",
        hex: "#cbb69c",
        code: "3864",
        family: "neutrals"
    },
    {
        id: 3865,
        name: "Winter White",
        hex: "#f9f7f1",
        code: "3865",
        family: "neutrals"
    },
    {
        id: 3866,
        name: "Mocha Brn Ult Vy Lt",
        hex: "#faf6f0",
        code: "3866",
        family: "neutrals"
    },
    {
        id: 5200,
        name: "Snow White",
        hex: "#ffffff",
        code: "b5200",
        family: "neutrals"
    },
    {
        id: 5201,
        name: "Ecru",
        hex: "#f0eada",
        code: "ecru",
        family: "neutrals"
    },
    {
        id: 5202,
        name: "White",
        hex: "#fcfbf8",
        code: "white",
        family: "neutrals"
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/editor-v2/editor/color-library/dmcColorLibrary.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_DMC_COLOR_ID",
    ()=>DEFAULT_DMC_COLOR_ID,
    "DMC_COLOR_LIBRARY",
    ()=>DMC_COLOR_LIBRARY,
    "DMC_COLOR_LIBRARY_BY_ID",
    ()=>DMC_COLOR_LIBRARY_BY_ID,
    "DMC_COLOR_LIBRARY_MATRIX",
    ()=>DMC_COLOR_LIBRARY_MATRIX,
    "addDmcColorLibraryToPalette",
    ()=>addDmcColorLibraryToPalette,
    "getDmcColorLibraryMatrix",
    ()=>getDmcColorLibraryMatrix
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/dmcColors.ts [app-client] (ecmascript)");
;
const DEFAULT_DMC_COLOR_ID = "dmc-310";
const DMC_COLOR_LIBRARY = buildFlatMatrixOrderedLibrary(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DMC_COLORS"]);
_c = DMC_COLOR_LIBRARY;
const DMC_COLOR_LIBRARY_BY_ID = Object.fromEntries(_c2 = DMC_COLOR_LIBRARY.map(_c1 = (color)=>[
        color.id,
        color
    ]));
_c3 = DMC_COLOR_LIBRARY_BY_ID;
const DMC_COLOR_LIBRARY_MATRIX = buildDmcColorLibraryMatrix(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DMC_COLORS"]);
_c4 = DMC_COLOR_LIBRARY_MATRIX;
function addDmcColorLibraryToPalette(palette) {
    return {
        ...palette,
        colorsById: {
            ...DMC_COLOR_LIBRARY_BY_ID,
            ...palette.colorsById
        }
    };
}
function getDmcColorLibraryMatrix() {
    return DMC_COLOR_LIBRARY_MATRIX;
}
function buildFlatMatrixOrderedLibrary(colors) {
    const matrix = buildDmcColorLibraryMatrix(colors);
    const flattened = [];
    for (const column of matrix){
        for (const rowKey of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DMC_MATRIX_ROWS"]){
            flattened.push(...column.rows[rowKey]);
        }
    }
    return flattened;
}
function buildDmcColorLibraryMatrix(colors) {
    const matrix = createEmptyMatrix();
    for (const color of colors){
        const placement = getMatrixPlacement(color);
        matrix[placement.column][placement.row].push(toPaletteColor(color));
    }
    for (const column of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DMC_MATRIX_COLUMNS"]){
        for (const row of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DMC_MATRIX_ROWS"]){
            matrix[column][row].sort(comparePaletteColorsInCell);
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DMC_MATRIX_COLUMNS"].map((column)=>({
            column,
            rows: matrix[column]
        }));
}
function createEmptyMatrix() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DMC_MATRIX_COLUMNS"].reduce((columnAcc, column)=>{
        columnAcc[column] = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$dmcColors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DMC_MATRIX_ROWS"].reduce((rowAcc, row)=>{
            rowAcc[row] = [];
            return rowAcc;
        }, {});
        return columnAcc;
    }, {});
}
function toPaletteColor(color) {
    return {
        id: getDmcColorId(color.code),
        brand: "dmc",
        code: color.code,
        name: color.name,
        hex: color.hex
    };
}
function getDmcColorId(code) {
    return `dmc-${code.toLowerCase()}`;
}
function getMatrixPlacement(color) {
    const hsl = hexToHsl(color.hex);
    return {
        column: getMatrixColumn(hsl.h, hsl.s),
        row: getMatrixRow(hsl.l)
    };
}
function getMatrixColumn(hue, saturation) {
    if (saturation < 0.12) {
        return "neutral";
    }
    if (hue >= 345 || hue < 20) {
        return "red";
    }
    if (hue < 50) {
        return "orange";
    }
    if (hue < 75) {
        return "yellow";
    }
    if (hue < 165) {
        return "green";
    }
    if (hue < 200) {
        return "teal";
    }
    if (hue < 255) {
        return "blue";
    }
    return "purple";
}
function getMatrixRow(lightness) {
    if (lightness < 0.18) {
        return "veryDark";
    }
    if (lightness < 0.32) {
        return "dark";
    }
    if (lightness < 0.5) {
        return "medium";
    }
    if (lightness < 0.68) {
        return "light";
    }
    if (lightness < 0.84) {
        return "veryLight";
    }
    return "ultraLight";
}
function comparePaletteColorsInCell(a, b) {
    const aHsl = hexToHsl(a.hex);
    const bHsl = hexToHsl(b.hex);
    const hueDiff = circularHueDistanceFromAnchor(aHsl.h) - circularHueDistanceFromAnchor(bHsl.h);
    if (hueDiff !== 0) {
        return hueDiff;
    }
    if (aHsl.s !== bHsl.s) {
        return bHsl.s - aHsl.s;
    }
    if (aHsl.l !== bHsl.l) {
        return aHsl.l - bHsl.l;
    }
    return compareCode(a.code, b.code);
}
function circularHueDistanceFromAnchor(hue) {
    return hue;
}
function compareCode(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    const aIsNum = Number.isFinite(aNum);
    const bIsNum = Number.isFinite(bNum);
    if (aIsNum && bIsNum) {
        return aNum - bNum;
    }
    return a.localeCompare(b);
}
function hexToHsl(hex) {
    const normalized = normalizeHex(hex);
    const r = parseInt(normalized.slice(1, 3), 16) / 255;
    const g = parseInt(normalized.slice(3, 5), 16) / 255;
    const b = parseInt(normalized.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    const l = (max + min) / 2;
    let s = 0;
    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        switch(max){
            case r:
                h = 60 * ((g - b) / delta % 6);
                break;
            case g:
                h = 60 * ((b - r) / delta + 2);
                break;
            case b:
                h = 60 * ((r - g) / delta + 4);
                break;
        }
    }
    if (h < 0) {
        h += 360;
    }
    return {
        h,
        s,
        l
    };
}
function normalizeHex(hex) {
    const value = hex.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(value)) {
        return value;
    }
    if (/^#[0-9a-f]{3}$/.test(value)) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    throw new Error(`Invalid hex color: ${hex}`);
}
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "DMC_COLOR_LIBRARY");
__turbopack_context__.k.register(_c1, "DMC_COLOR_LIBRARY_BY_ID$Object.fromEntries$DMC_COLOR_LIBRARY.map");
__turbopack_context__.k.register(_c2, "DMC_COLOR_LIBRARY_BY_ID$Object.fromEntries");
__turbopack_context__.k.register(_c3, "DMC_COLOR_LIBRARY_BY_ID");
__turbopack_context__.k.register(_c4, "DMC_COLOR_LIBRARY_MATRIX");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/editor-v2/editor/color-library/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$color$2d$library$2f$dmcColorLibrary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/color-library/dmcColorLibrary.ts [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/editor-v2/editor/store/createNewDesignState.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createLocalProjectId",
    ()=>createLocalProjectId,
    "createNewDesignState",
    ()=>createNewDesignState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$store$2f$state$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/store/state.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$color$2d$library$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/color-library/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$color$2d$library$2f$dmcColorLibrary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/color-library/dmcColorLibrary.ts [app-client] (ecmascript)");
;
;
const DEFAULT_TITLE = "Untitled Design";
function createNewDesignState(width, height, options = {}) {
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$store$2f$state$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createInitialEditorStoreState"])();
    const localProjectId = options.projectId ?? createLocalProjectId();
    const { sizingMode = "stitches", meshCount = null, widthInches = null, heightInches = null } = options;
    return {
        ...state,
        document: {
            ...state.document,
            project: {
                ...state.document.project,
                id: localProjectId,
                title: DEFAULT_TITLE
            },
            grid: {
                ...state.document.grid,
                width,
                height,
                sizingMode,
                meshCount,
                widthInches,
                heightInches,
                cells: new Array(width * height).fill(null)
            },
            palette: {
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$color$2d$library$2f$dmcColorLibrary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addDmcColorLibraryToPalette"])(state.document.palette)
            }
        },
        session: {
            ...state.session,
            activeTool: {
                ...state.session.activeTool,
                tool: "paint",
                colorId: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$color$2d$library$2f$dmcColorLibrary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_DMC_COLOR_ID"]
            },
            eyedropperReturnTool: null,
            persistence: {
                ...state.session.persistence,
                currentDraftId: localProjectId
            }
        }
    };
}
function createLocalProjectId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `local_${crypto.randomUUID()}`;
    }
    return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor-v2/app/EditorV2SetupModal.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "actions": "EditorV2SetupModal-module__-oAxCG__actions",
  "card": "EditorV2SetupModal-module__-oAxCG__card",
  "cardCompact": "EditorV2SetupModal-module__-oAxCG__cardCompact",
  "compactPresetButton": "EditorV2SetupModal-module__-oAxCG__compactPresetButton",
  "content": "EditorV2SetupModal-module__-oAxCG__content",
  "contentCompact": "EditorV2SetupModal-module__-oAxCG__contentCompact",
  "customMeshCountInput": "EditorV2SetupModal-module__-oAxCG__customMeshCountInput",
  "errorText": "EditorV2SetupModal-module__-oAxCG__errorText",
  "eyebrow": "EditorV2SetupModal-module__-oAxCG__eyebrow",
  "fieldError": "EditorV2SetupModal-module__-oAxCG__fieldError",
  "fieldGrid": "EditorV2SetupModal-module__-oAxCG__fieldGrid",
  "header": "EditorV2SetupModal-module__-oAxCG__header",
  "helper": "EditorV2SetupModal-module__-oAxCG__helper",
  "helperRow": "EditorV2SetupModal-module__-oAxCG__helperRow",
  "inchesSection": "EditorV2SetupModal-module__-oAxCG__inchesSection",
  "inlineOptionGrid": "EditorV2SetupModal-module__-oAxCG__inlineOptionGrid",
  "intro": "EditorV2SetupModal-module__-oAxCG__intro",
  "invalidInput": "EditorV2SetupModal-module__-oAxCG__invalidInput",
  "meshPresetButton": "EditorV2SetupModal-module__-oAxCG__meshPresetButton",
  "modal": "EditorV2SetupModal-module__-oAxCG__modal",
  "modalCompact": "EditorV2SetupModal-module__-oAxCG__modalCompact",
  "optionGrid": "EditorV2SetupModal-module__-oAxCG__optionGrid",
  "presetBlock": "EditorV2SetupModal-module__-oAxCG__presetBlock",
  "presetButton": "EditorV2SetupModal-module__-oAxCG__presetButton",
  "presetGrid": "EditorV2SetupModal-module__-oAxCG__presetGrid",
  "presetLabel": "EditorV2SetupModal-module__-oAxCG__presetLabel",
  "section": "EditorV2SetupModal-module__-oAxCG__section",
  "sectionHeader": "EditorV2SetupModal-module__-oAxCG__sectionHeader",
  "sectionHeaderStandalone": "EditorV2SetupModal-module__-oAxCG__sectionHeaderStandalone",
  "sectionHint": "EditorV2SetupModal-module__-oAxCG__sectionHint",
  "sectionStandalone": "EditorV2SetupModal-module__-oAxCG__sectionStandalone",
  "sectionTitle": "EditorV2SetupModal-module__-oAxCG__sectionTitle",
  "subtleLabel": "EditorV2SetupModal-module__-oAxCG__subtleLabel",
  "tertiaryCompactPresetButton": "EditorV2SetupModal-module__-oAxCG__tertiaryCompactPresetButton",
  "tertiaryPresetButton": "EditorV2SetupModal-module__-oAxCG__tertiaryPresetButton",
  "title": "EditorV2SetupModal-module__-oAxCG__title",
  "titleBlock": "EditorV2SetupModal-module__-oAxCG__titleBlock",
  "validation": "EditorV2SetupModal-module__-oAxCG__validation",
});
}),
"[project]/components/editor-v2/app/EditorV2SetupModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EditorV2SetupModal",
    ()=>EditorV2SetupModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/design-system/typography.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/components/design-system/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Field.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Notification.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/SegmentedControl.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SingleSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/SingleSelectDropdown.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$store$2f$createNewDesignState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/store/createNewDesignState.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/editor-v2/app/EditorV2SetupModal.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
const LARGE_GRID_PRESETS = [
    {
        label: "120 x 120",
        width: 120,
        height: 120
    },
    {
        label: "160 x 160",
        width: 160,
        height: 160
    },
    {
        label: "200 x 200",
        width: 200,
        height: 200
    },
    {
        label: "240 x 240",
        width: 240,
        height: 240
    },
    {
        label: "300 x 300",
        width: 300,
        height: 300
    }
];
const INCH_SIZE_PRESETS = [
    {
        label: '6" x 10"',
        width: 6,
        height: 10
    },
    {
        label: '8" x 8"',
        width: 8,
        height: 8
    },
    {
        label: '7" x 9"',
        width: 7,
        height: 9
    },
    {
        label: '9" x 9"',
        width: 9,
        height: 9
    },
    {
        label: '11" x 7"',
        width: 11,
        height: 7
    }
];
const CELLS_PER_INCH_PRESETS = [
    10,
    13,
    18
];
function EditorV2SetupModal({ canClose, creatingDesign, draftHeight, draftHeightInches, draftMeshCount, draftSizingMode, draftWidth, draftWidthInches, hasSavedDesignAccess, mode, hasMoreSavedDocuments, onDismissSavedDocumentsError, onDismissSetupError, onOpenSavedDocuments, onLoadMoreSavedDocuments, onSignIn, onClose, onCreateDesign, onDraftHeightChange, onDraftHeightInchesChange, onDraftMeshCountChange, onDraftSizingModeChange, onDraftWidthChange, onDraftWidthInchesChange, onLoadSavedDesign, savedDocuments, savedDocumentsLoading, savedDocumentsLoadingMore, savedDocumentsErrorMessage, selectedStorageId, setSelectedStorageId, setupErrorMessage }) {
    _s();
    const [useTopDropdownPlacement, setUseTopDropdownPlacement] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [useCustomMeshCount, setUseCustomMeshCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "EditorV2SetupModal.useState": ()=>getCellsPerInchPreset(draftMeshCount) === null
    }["EditorV2SetupModal.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditorV2SetupModal.useEffect": ()=>{
            const mediaQuery = window.matchMedia("(max-width: 799px)");
            const updatePlacement = {
                "EditorV2SetupModal.useEffect.updatePlacement": ()=>{
                    setUseTopDropdownPlacement(mediaQuery.matches);
                }
            }["EditorV2SetupModal.useEffect.updatePlacement"];
            updatePlacement();
            mediaQuery.addEventListener("change", updatePlacement);
            return ({
                "EditorV2SetupModal.useEffect": ()=>mediaQuery.removeEventListener("change", updatePlacement)
            })["EditorV2SetupModal.useEffect"];
        }
    }["EditorV2SetupModal.useEffect"], []);
    const inchSizing = resolveInchSizing({
        widthInches: draftWidthInches,
        heightInches: draftHeightInches,
        meshCount: draftMeshCount
    });
    const stitchSizing = resolveStitchSizing({
        width: draftWidth,
        height: draftHeight
    });
    const selectedLargeGridPreset = getLargeGridPreset(draftWidth, draftHeight);
    const selectedInchSizePreset = getInchSizePreset(draftWidthInches, draftHeightInches);
    const selectedCellsPerInchPreset = getCellsPerInchPreset(draftMeshCount);
    const showSavedDesignSection = mode === "full";
    const compactMode = !showSavedDesignSection;
    const createDisabled = creatingDesign || (draftSizingMode === "inches" ? !inchSizing.canCreate : !stitchSizing.canCreate);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: [
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].modal,
            compactMode ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].modalCompact : null
        ].filter(Boolean).join(" "),
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "editor-v2-setup-title",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: [
                __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].card,
                compactMode ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardCompact : null
            ].filter(Boolean).join(" "),
            children: [
                showSavedDesignSection ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].titleBlock,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    id: "editor-v2-setup-title",
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].title,
                                    style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].h3,
                                    children: "Start a design"
                                }, void 0, false, {
                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                    lineNumber: 186,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].intro,
                                    style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                                    children: "Create a fresh canvas or jump back into a saved design."
                                }, void 0, false, {
                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                    lineNumber: 193,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                            lineNumber: 185,
                            columnNumber: 13
                        }, this),
                        canClose ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            type: "button",
                            variant: "ghostV2",
                            onClick: onClose,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                icon: "/icons/lucide/x.svg",
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sidebarCloseIcon
                            }, void 0, false, {
                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                lineNumber: 199,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                            lineNumber: 198,
                            columnNumber: 15
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                    lineNumber: 184,
                    columnNumber: 11
                }, this) : null,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: [
                        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].content,
                        compactMode ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].contentCompact : null
                    ].filter(Boolean).join(" "),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: [
                                __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                                compactMode ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionStandalone : null
                            ].filter(Boolean).join(" "),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: [
                                        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionHeader,
                                        compactMode ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionHeaderStandalone : null
                                    ].filter(Boolean).join(" "),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            id: "editor-v2-setup-title",
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                                            style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].h4,
                                            children: "New design"
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 223,
                                            columnNumber: 15
                                        }, this),
                                        compactMode && canClose ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            type: "button",
                                            variant: "ghostV2",
                                            onClick: onClose,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                                icon: "/icons/lucide/x.svg",
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sidebarCloseIcon
                                            }, void 0, false, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 232,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 231,
                                            columnNumber: 17
                                        }, this) : null
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                    lineNumber: 218,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Field"], {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SegmentedControl"], {
                                        ariaLabel: "Sizing mode",
                                        stackOnSmallScreens: true,
                                        value: draftSizingMode,
                                        onChange: onDraftSizingModeChange,
                                        options: [
                                            {
                                                label: "Canvas Size + Mesh",
                                                value: "inches"
                                            },
                                            {
                                                label: "Grid Size",
                                                value: "stitches"
                                            }
                                        ]
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                        lineNumber: 248,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                    lineNumber: 245,
                                    columnNumber: 13
                                }, this),
                                draftSizingMode === "stitches" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fieldGrid,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Field"], {
                                                    label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: stitchSizing.widthError ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].errorText : undefined,
                                                        children: "Length"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 265,
                                                        columnNumber: 23
                                                    }, void 0),
                                                    hint: stitchSizing.widthError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fieldError,
                                                        children: stitchSizing.widthError
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 271,
                                                        columnNumber: 25
                                                    }, void 0) : null,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FieldInput"], {
                                                        type: "number",
                                                        min: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MIN_GRID_SIZE"],
                                                        max: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"],
                                                        "aria-invalid": stitchSizing.widthError ? "true" : undefined,
                                                        className: stitchSizing.widthError ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].invalidInput : undefined,
                                                        suffix: "cells",
                                                        value: draftWidth,
                                                        onChange: (event)=>onDraftWidthChange(event.target.value)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 277,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                    lineNumber: 263,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Field"], {
                                                    label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: stitchSizing.heightError ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].errorText : undefined,
                                                        children: "Height"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 290,
                                                        columnNumber: 23
                                                    }, void 0),
                                                    hint: stitchSizing.heightError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fieldError,
                                                        children: stitchSizing.heightError
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 296,
                                                        columnNumber: 25
                                                    }, void 0) : null,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FieldInput"], {
                                                        type: "number",
                                                        min: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MIN_GRID_SIZE"],
                                                        max: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"],
                                                        "aria-invalid": stitchSizing.heightError ? "true" : undefined,
                                                        className: stitchSizing.heightError ? __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].invalidInput : undefined,
                                                        suffix: "cells",
                                                        value: draftHeight,
                                                        onChange: (event)=>onDraftHeightChange(event.target.value)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 302,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                    lineNumber: 288,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 262,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].presetBlock,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].presetLabel,
                                                    style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                                                    children: "Quick presets"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                    lineNumber: 316,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].presetGrid,
                                                    children: LARGE_GRID_PRESETS.map((preset)=>{
                                                        const active = selectedLargeGridPreset?.label === preset.label;
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            type: "button",
                                                            variant: "secondary2",
                                                            size: "sm",
                                                            // className={styles.tertiaryPresetButton}
                                                            active: active,
                                                            inertWhenActive: active,
                                                            "aria-pressed": active,
                                                            onClick: ()=>{
                                                                onDraftWidthChange(String(preset.width));
                                                                onDraftHeightChange(String(preset.height));
                                                            },
                                                            children: preset.label
                                                        }, preset.label, false, {
                                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                            lineNumber: 324,
                                                            columnNumber: 25
                                                        }, this);
                                                    })
                                                }, void 0, false, {
                                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                    lineNumber: 319,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 315,
                                            columnNumber: 17
                                        }, this),
                                        stitchSizing.alert ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notification"], {
                                            tone: "destructive",
                                            title: stitchSizing.alertTitle,
                                            description: stitchSizing.alert,
                                            layout: "compact"
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 346,
                                            columnNumber: 19
                                        }, this) : null
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].presetBlock,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inchesSection,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].h5,
                                                        children: "Dimensions"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 360,
                                                        columnNumber: 16
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fieldGrid,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Field"], {
                                                                label: "Length",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FieldInput"], {
                                                                    type: "number",
                                                                    min: "0",
                                                                    step: "any",
                                                                    suffix: "inches",
                                                                    value: draftWidthInches,
                                                                    onChange: (event)=>onDraftWidthInchesChange(event.target.value)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                    lineNumber: 368,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                lineNumber: 367,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Field"], {
                                                                label: "Height",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FieldInput"], {
                                                                    type: "number",
                                                                    min: "0",
                                                                    step: "any",
                                                                    suffix: "inches",
                                                                    value: draftHeightInches,
                                                                    onChange: (event)=>onDraftHeightInchesChange(event.target.value)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                    lineNumber: 380,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                lineNumber: 379,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 366,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].helperRow,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].subtleLabel,
                                                                style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].s,
                                                                children: "Quick presets"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                lineNumber: 394,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inlineOptionGrid,
                                                                children: INCH_SIZE_PRESETS.map((preset)=>{
                                                                    const active = selectedInchSizePreset?.label === preset.label;
                                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                        type: "button",
                                                                        variant: "secondary2",
                                                                        size: "sm",
                                                                        // className={styles.tertiaryCompactPresetButton}
                                                                        active: active,
                                                                        inertWhenActive: active,
                                                                        "aria-pressed": active,
                                                                        onClick: ()=>{
                                                                            onDraftWidthInchesChange(String(preset.width));
                                                                            onDraftHeightInchesChange(String(preset.height));
                                                                        },
                                                                        children: preset.label
                                                                    }, preset.label, false, {
                                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                        lineNumber: 402,
                                                                        columnNumber: 27
                                                                    }, this);
                                                                })
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                lineNumber: 397,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 393,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 358,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inchesSection,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].h5,
                                                        children: "Canvas Mesh"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 424,
                                                        columnNumber: 16
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inlineOptionGrid,
                                                        children: [
                                                            CELLS_PER_INCH_PRESETS.map((preset)=>{
                                                                const active = !useCustomMeshCount && selectedCellsPerInchPreset === preset;
                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                    type: "button",
                                                                    variant: "secondary2",
                                                                    size: "md",
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].meshPresetButton,
                                                                    active: active,
                                                                    inertWhenActive: active,
                                                                    "aria-pressed": active,
                                                                    onClick: ()=>{
                                                                        setUseCustomMeshCount(false);
                                                                        onDraftMeshCountChange(String(preset));
                                                                    },
                                                                    children: preset + " mesh"
                                                                }, preset, false, {
                                                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                    lineNumber: 441,
                                                                    columnNumber: 27
                                                                }, this);
                                                            }),
                                                            useCustomMeshCount ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Field$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FieldInput"], {
                                                                "aria-label": "Custom cells per inch",
                                                                type: "number",
                                                                min: "0",
                                                                step: "any",
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].customMeshCountInput,
                                                                value: draftMeshCount,
                                                                onChange: (event)=>{
                                                                    setUseCustomMeshCount(true);
                                                                    onDraftMeshCountChange(event.target.value);
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                lineNumber: 460,
                                                                columnNumber: 25
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                type: "button",
                                                                variant: "ghostV2",
                                                                size: "md",
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].meshPresetButton,
                                                                onClick: ()=>{
                                                                    setUseCustomMeshCount(true);
                                                                },
                                                                children: "Custom"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                                lineNumber: 473,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 432,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 423,
                                                columnNumber: 15
                                            }, this),
                                            inchSizing.error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notification"], {
                                                tone: "destructive",
                                                title: inchSizing.errorTitle,
                                                description: inchSizing.error,
                                                layout: "compact"
                                            }, void 0, false, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 491,
                                                columnNumber: 19
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].helper,
                                                style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                                                children: [
                                                    "Total canvas size: ",
                                                    inchSizing.width,
                                                    " x ",
                                                    inchSizing.height,
                                                    " cells"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 498,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                        lineNumber: 357,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].actions,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        type: "button",
                                        variant: "primary",
                                        disabled: createDisabled,
                                        onClick: ()=>{
                                            if (draftSizingMode === "inches") {
                                                if (inchSizing.error) {
                                                    return;
                                                }
                                                onDraftWidthChange(String(inchSizing.width));
                                                onDraftHeightChange(String(inchSizing.height));
                                                onDraftWidthInchesChange(normalizeDecimalInput(draftWidthInches));
                                                onDraftHeightInchesChange(normalizeDecimalInput(draftHeightInches));
                                                onDraftMeshCountChange(normalizeDecimalInput(draftMeshCount));
                                                onCreateDesign({
                                                    kind: "new",
                                                    draftId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$store$2f$createNewDesignState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createLocalProjectId"])(),
                                                    width: inchSizing.width,
                                                    height: inchSizing.height,
                                                    sizingMode: "inches",
                                                    meshCount: inchSizing.meshCount,
                                                    widthInches: inchSizing.widthInches,
                                                    heightInches: inchSizing.heightInches,
                                                    instanceKey: `design_${inchSizing.width}x${inchSizing.height}_${Date.now()}`
                                                });
                                                return;
                                            }
                                            if (stitchSizing.widthError || stitchSizing.heightError) {
                                                return;
                                            }
                                            const width = clampGridSize(draftWidth);
                                            const height = clampGridSize(draftHeight);
                                            onDraftWidthChange(String(width));
                                            onDraftHeightChange(String(height));
                                            onCreateDesign({
                                                kind: "new",
                                                draftId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$store$2f$createNewDesignState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createLocalProjectId"])(),
                                                width,
                                                height,
                                                sizingMode: "stitches",
                                                meshCount: null,
                                                widthInches: null,
                                                heightInches: null,
                                                instanceKey: `design_${width}x${height}_${Date.now()}`
                                            });
                                        },
                                        children: creatingDesign ? "Creating design..." : "Create new design"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                        lineNumber: 509,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                    lineNumber: 508,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                            lineNumber: 213,
                            columnNumber: 11
                        }, this),
                        showSavedDesignSection ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].section,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionHeader,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                                        style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].h5,
                                        children: "Open saved design"
                                    }, void 0, false, {
                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                        lineNumber: 572,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                    lineNumber: 571,
                                    columnNumber: 15
                                }, this),
                                savedDocumentsErrorMessage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notification"], {
                                    tone: "destructive",
                                    title: "Couldn't load your saved designs",
                                    description: savedDocumentsErrorMessage,
                                    layout: "compact",
                                    onDismiss: onDismissSavedDocumentsError
                                }, void 0, false, {
                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                    lineNumber: 578,
                                    columnNumber: 17
                                }, this) : null,
                                setupErrorMessage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notification"], {
                                    tone: "destructive",
                                    title: "Couldn't open saved design",
                                    description: setupErrorMessage,
                                    layout: "compact",
                                    onDismiss: onDismissSetupError
                                }, void 0, false, {
                                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                    lineNumber: 588,
                                    columnNumber: 17
                                }, this) : null,
                                hasSavedDesignAccess ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].helper,
                                            style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                                            children: "Choose a design"
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 599,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SingleSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SingleSelectDropdown"], {
                                            ariaLabel: "Saved designs",
                                            emptyLabel: savedDocumentsLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    minWidth: "100%"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "loading-spinner",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 614,
                                                        columnNumber: 27
                                                    }, void 0),
                                                    "Loading saved designs..."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 606,
                                                columnNumber: 25
                                            }, void 0) : "No saved designs",
                                            menuMaxHeight: 220,
                                            getItemLabel: formatSavedDesignLabel,
                                            getItemValue: (record)=>record.storageId,
                                            items: savedDocuments,
                                            menuPlacement: useTopDropdownPlacement ? "top-start" : "bottom-start",
                                            onOpenChange: (open)=>{
                                                if (open) {
                                                    void onOpenSavedDocuments();
                                                }
                                            },
                                            onReachEnd: ()=>{
                                                if (hasMoreSavedDocuments) {
                                                    void onLoadMoreSavedDocuments();
                                                }
                                            },
                                            onValueChange: setSelectedStorageId,
                                            menuFooter: savedDocumentsLoadingMore ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    minWidth: "100%",
                                                    padding: "8px 12px"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "loading-spinner",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                        lineNumber: 646,
                                                        columnNumber: 27
                                                    }, void 0),
                                                    "Loading more designs..."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 637,
                                                columnNumber: 25
                                            }, void 0) : null,
                                            placeholder: savedDocumentsLoading ? "Loading saved designs..." : "Load saved design",
                                            value: selectedStorageId,
                                            menuWidth: "100%",
                                            menuMaxWidth: "100%",
                                            wrapperStyle: {
                                                width: "100%"
                                            },
                                            triggerStyle: {
                                                width: "100%"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 602,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].actions,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                type: "button",
                                                variant: "primary",
                                                disabled: savedDocumentsLoading || !selectedStorageId,
                                                onClick: ()=>{
                                                    if (!selectedStorageId) {
                                                        return;
                                                    }
                                                    onLoadSavedDesign(selectedStorageId);
                                                },
                                                children: "Load design"
                                            }, void 0, false, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 660,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 659,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].helper,
                                            style: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$design$2d$system$2f$typography$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typographyStyles"].p2,
                                            children: "Sign in to access your saved designs."
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 678,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].actions,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                type: "button",
                                                variant: "primary",
                                                onClick: onSignIn,
                                                children: "Sign in"
                                            }, void 0, false, {
                                                fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                                lineNumber: 683,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                                            lineNumber: 682,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                            lineNumber: 570,
                            columnNumber: 13
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
                    lineNumber: 208,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
            lineNumber: 178,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/editor-v2/app/EditorV2SetupModal.tsx",
        lineNumber: 170,
        columnNumber: 5
    }, this);
}
_s(EditorV2SetupModal, "9ERa21qwWi9+TJm73f7Ti66Cy7E=");
_c = EditorV2SetupModal;
function formatSavedDesignLabel(record) {
    return `${record.title || "Untitled Design"} (${record.gridWidth}x${record.gridHeight})`;
}
function clampGridSize(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 8;
    }
    return Math.max(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MIN_GRID_SIZE"], Math.min(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"], Math.floor(parsed)));
}
function resolveStitchSizing({ width, height }) {
    const parsedWidth = parseRequiredPositiveNumber(width);
    const parsedHeight = parseRequiredPositiveNumber(height);
    const hasEmptyField = parsedWidth.kind === "empty" || parsedHeight.kind === "empty";
    const hasInvalidField = parsedWidth.kind === "invalid" || parsedHeight.kind === "invalid";
    const widthError = getStitchSizeMaxError(width);
    const heightError = getStitchSizeMaxError(height);
    return {
        canCreate: !hasEmptyField && !hasInvalidField && widthError === null && heightError === null,
        alertTitle: hasInvalidField ? "Check your grid size" : null,
        alert: hasInvalidField ? "Enter values greater than 0 for length and height." : null,
        widthError,
        heightError
    };
}
function getStitchSizeMaxError(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"]) {
        return null;
    }
    return `Max ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"]} cells.`;
}
function getLargeGridPreset(width, height) {
    const parsedWidth = Number(width);
    const parsedHeight = Number(height);
    if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight)) {
        return null;
    }
    return LARGE_GRID_PRESETS.find((preset)=>preset.width === parsedWidth && preset.height === parsedHeight) ?? null;
}
function parsePositiveDecimal(value) {
    if (value.trim().length === 0) {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}
function parseRequiredPositiveNumber(value) {
    if (value.trim().length === 0) {
        return {
            kind: "empty"
        };
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return {
            kind: "invalid"
        };
    }
    return {
        kind: "valid",
        value: parsed
    };
}
function normalizeDecimalInput(value) {
    const parsed = parsePositiveDecimal(value);
    return parsed === null ? value : String(parsed);
}
function getCellsPerInchPreset(value) {
    const parsed = parsePositiveDecimal(value);
    if (parsed === null) {
        return null;
    }
    return CELLS_PER_INCH_PRESETS.find((preset)=>preset === parsed) ?? null;
}
function getInchSizePreset(widthInches, heightInches) {
    const parsedWidth = parsePositiveDecimal(widthInches);
    const parsedHeight = parsePositiveDecimal(heightInches);
    if (parsedWidth === null || parsedHeight === null) {
        return null;
    }
    return INCH_SIZE_PRESETS.find((preset)=>preset.width === parsedWidth && preset.height === parsedHeight) ?? null;
}
function resolveInchSizing({ widthInches, heightInches, meshCount }) {
    const parsedWidthInches = parseRequiredPositiveNumber(widthInches);
    const parsedHeightInches = parseRequiredPositiveNumber(heightInches);
    const parsedMeshCount = parseRequiredPositiveNumber(meshCount);
    if (parsedWidthInches.kind === "empty" || parsedHeightInches.kind === "empty" || parsedMeshCount.kind === "empty") {
        return {
            errorTitle: null,
            error: null,
            canCreate: false,
            width: null,
            height: null,
            widthInches: null,
            heightInches: null,
            meshCount: null
        };
    }
    if (parsedWidthInches.kind === "invalid" || parsedHeightInches.kind === "invalid" || parsedMeshCount.kind === "invalid") {
        return {
            errorTitle: "Check your dimensions",
            error: "Enter values greater than 0 for width, height, and cells per inch.",
            canCreate: false,
            width: null,
            height: null,
            widthInches: null,
            heightInches: null,
            meshCount: null
        };
    }
    const widthInchesValue = parsedWidthInches.value;
    const heightInchesValue = parsedHeightInches.value;
    const meshCountValue = parsedMeshCount.value;
    const widthCellCount = widthInchesValue * meshCountValue;
    const heightCellCount = heightInchesValue * meshCountValue;
    const widthExceeded = widthCellCount > __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"];
    const heightExceeded = heightCellCount > __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"];
    if (widthExceeded || heightExceeded) {
        return {
            errorTitle: getInchSizeMaxErrorTitle(widthExceeded, heightExceeded),
            error: `Maximum canvas size is ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"]} x ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EDITOR_V2_MAX_GRID_SIZE"]} cells. Please input ${getInchSizeMaxSuggestion(widthExceeded, heightExceeded)} or choose a lower mesh count.`,
            canCreate: false,
            width: null,
            height: null,
            widthInches: null,
            heightInches: null,
            meshCount: null
        };
    }
    const width = clampGridSize(String(widthCellCount));
    const height = clampGridSize(String(heightCellCount));
    return {
        errorTitle: null,
        error: null,
        canCreate: true,
        width,
        height,
        widthInches: widthInchesValue,
        heightInches: heightInchesValue,
        meshCount: meshCountValue
    };
}
function getInchSizeMaxErrorTitle(widthExceeded, heightExceeded) {
    if (widthExceeded && heightExceeded) {
        return "Max length and height exceeded";
    }
    return widthExceeded ? "Max length exceeded" : "Max height exceeded";
}
function getInchSizeMaxSuggestion(widthExceeded, heightExceeded) {
    if (widthExceeded && heightExceeded) {
        return "a smaller length and height";
    }
    return widthExceeded ? "a smaller length" : "a smaller height";
}
var _c;
__turbopack_context__.k.register(_c, "EditorV2SetupModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/editor-v2/persistence/designs.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PERSISTED_EDITOR_V2_SCHEMA_VERSION",
    ()=>PERSISTED_EDITOR_V2_SCHEMA_VERSION,
    "hydrateEditorV2Document",
    ()=>hydrateEditorV2Document,
    "normalizeProjectTitle",
    ()=>normalizeProjectTitle,
    "parsePersistedEditorV2Design",
    ()=>parsePersistedEditorV2Design,
    "serializeEditorV2Document",
    ()=>serializeEditorV2Document
]);
const PERSISTED_EDITOR_V2_SCHEMA_VERSION = 1;
function serializeEditorV2Document(document) {
    return {
        schemaVersion: PERSISTED_EDITOR_V2_SCHEMA_VERSION,
        project: {
            title: normalizeProjectTitle(document.project.title)
        },
        grid: {
            width: document.grid.width,
            height: document.grid.height,
            sizingMode: document.grid.sizingMode,
            meshCount: document.grid.meshCount,
            widthInches: document.grid.widthInches,
            heightInches: document.grid.heightInches,
            cells: [
                ...document.grid.cells
            ]
        },
        palette: {
            colorsById: document.palette.colorsById,
            customPalettesById: document.palette.customPalettesById,
            extractedPaletteIds: [
                ...document.palette.extractedPaletteIds
            ],
            symbolAssignments: document.palette.symbolAssignments
        },
        trace: document.trace ? {
            previewUrl: document.trace.previewUrl,
            thumbnailUrl: document.trace.thumbnailUrl,
            originalUrl: document.trace.originalUrl,
            fileName: document.trace.fileName,
            byteSize: document.trace.byteSize,
            mimeType: document.trace.mimeType,
            imageWidth: document.trace.imageWidth,
            imageHeight: document.trace.imageHeight,
            offsetX: document.trace.offsetX,
            offsetY: document.trace.offsetY,
            scale: document.trace.scale,
            rotation: document.trace.rotation
        } : null,
        text: document.text
    };
}
function hydrateEditorV2Document(record) {
    return {
        project: {
            id: record.id,
            title: normalizeProjectTitle(record.data.project.title),
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            sourceVersion: 1
        },
        grid: {
            width: record.data.grid.width,
            height: record.data.grid.height,
            sizingMode: record.data.grid.sizingMode,
            meshCount: record.data.grid.meshCount,
            widthInches: record.data.grid.widthInches,
            heightInches: record.data.grid.heightInches,
            cells: [
                ...record.data.grid.cells
            ]
        },
        palette: {
            colorsById: record.data.palette.colorsById,
            customPalettesById: record.data.palette.customPalettesById,
            extractedPaletteIds: [
                ...record.data.palette.extractedPaletteIds
            ],
            symbolAssignments: record.data.palette.symbolAssignments
        },
        trace: record.data.trace ? (()=>{
            const normalizedTrace = normalizePersistedTrace(record.data.trace);
            return {
                previewUrl: normalizedTrace.previewUrl,
                thumbnailUrl: normalizedTrace.thumbnailUrl,
                originalUrl: normalizedTrace.originalUrl,
                fileName: normalizedTrace.fileName,
                byteSize: normalizedTrace.byteSize,
                mimeType: normalizedTrace.mimeType,
                imageWidth: normalizedTrace.imageWidth,
                imageHeight: normalizedTrace.imageHeight,
                offsetX: normalizedTrace.offsetX,
                offsetY: normalizedTrace.offsetY,
                scale: normalizedTrace.scale,
                rotation: normalizedTrace.rotation,
                visible: true,
                blendMode: "image",
                opacity: 0.35,
                locked: true
            };
        })() : null,
        text: record.data.text,
        metadata: {
            legacyDraftId: null,
            persistedVersionId: null,
            schemaVersion: record.data.schemaVersion
        }
    };
}
function parsePersistedEditorV2Design(value) {
    if (!value || typeof value !== "object") {
        return null;
    }
    const candidate = value;
    if (candidate.schemaVersion !== PERSISTED_EDITOR_V2_SCHEMA_VERSION || !candidate.project || typeof candidate.project !== "object" || typeof candidate.project.title !== "string" || !candidate.grid || typeof candidate.grid !== "object" || !Array.isArray(candidate.grid.cells) || typeof candidate.grid.width !== "number" || typeof candidate.grid.height !== "number" || candidate.grid.sizingMode !== "stitches" && candidate.grid.sizingMode !== "inches" || !candidate.palette || typeof candidate.palette !== "object" || !candidate.text || typeof candidate.text !== "object") {
        return null;
    }
    if (candidate.trace !== null && candidate.trace !== undefined && !isPersistedTrace(candidate.trace)) {
        return null;
    }
    return {
        ...candidate,
        trace: candidate.trace ? normalizePersistedTrace(candidate.trace) : null
    };
}
function normalizeProjectTitle(title) {
    const trimmedTitle = title.trim();
    return trimmedTitle.length > 0 ? trimmedTitle : "Untitled Design";
}
function isPersistedTrace(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const trace = value;
    return typeof getLegacyCompatibleTraceUrl(trace, "previewUrl") === "string" && typeof getLegacyCompatibleTraceUrl(trace, "thumbnailUrl") === "string" && typeof getLegacyCompatibleTraceUrl(trace, "originalUrl") === "string" && typeof trace.offsetX === "number" && typeof trace.offsetY === "number" && typeof trace.scale === "number" && typeof trace.rotation === "number";
}
function normalizePersistedTrace(trace) {
    return {
        ...trace,
        previewUrl: getLegacyCompatibleTraceUrl(trace, "previewUrl"),
        thumbnailUrl: getLegacyCompatibleTraceUrl(trace, "thumbnailUrl"),
        originalUrl: getLegacyCompatibleTraceUrl(trace, "originalUrl"),
        fileName: trace.fileName ?? null,
        byteSize: trace.byteSize ?? null,
        mimeType: trace.mimeType ?? null,
        imageWidth: trace.imageWidth ?? null,
        imageHeight: trace.imageHeight ?? null,
        offsetX: trace.offsetX ?? 0,
        offsetY: trace.offsetY ?? 0,
        scale: trace.scale ?? 1,
        rotation: trace.rotation ?? 0
    };
}
function getLegacyCompatibleTraceUrl(trace, field) {
    const candidate = trace[field];
    if (typeof candidate === "string") {
        return candidate;
    }
    if (typeof trace.assetUrl === "string") {
        return trace.assetUrl;
    }
    throw new Error(`Missing ${field}`);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/editor-v2/app/editorV2ServerPersistence.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EditorV2PersistenceError",
    ()=>EditorV2PersistenceError,
    "deleteSavedEditorV2Document",
    ()=>deleteSavedEditorV2Document,
    "listEditorV2DesignVersions",
    ()=>listEditorV2DesignVersions,
    "listSavedEditorV2Documents",
    ()=>listSavedEditorV2Documents,
    "loadEditorV2DesignVersion",
    ()=>loadEditorV2DesignVersion,
    "loadSavedEditorV2Document",
    ()=>loadSavedEditorV2Document,
    "restoreEditorV2DesignVersion",
    ()=>restoreEditorV2DesignVersion,
    "saveEditorV2Document",
    ()=>saveEditorV2Document
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$persistence$2f$designs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/persistence/designs.ts [app-client] (ecmascript)");
"use client";
;
class EditorV2PersistenceError extends Error {
    status;
    versionToken;
    constructor(message, status = 500, versionToken = null){
        super(message);
        this.name = "EditorV2PersistenceError";
        this.status = status;
        this.versionToken = versionToken;
    }
}
async function listSavedEditorV2Documents({ limit, offset } = {}) {
    const searchParams = new URLSearchParams();
    if (typeof limit === "number") {
        searchParams.set("limit", String(limit));
    }
    if (typeof offset === "number") {
        searchParams.set("offset", String(offset));
    }
    const response = await fetch(`/api/editor-v2/designs${searchParams.size ? `?${searchParams.toString()}` : ""}`, {
        method: "GET",
        credentials: "same-origin"
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok) {
        throw new EditorV2PersistenceError(body?.error ?? "Couldn't load your saved designs.", response.status);
    }
    return {
        documents: Array.isArray(body?.designs) ? body.designs.map((design)=>({
                storageId: design.id,
                title: design.title,
                gridWidth: design.gridWidth,
                gridHeight: design.gridHeight,
                updatedAt: design.updatedAt
            })) : [],
        hasMore: body?.hasMore === true,
        nextOffset: typeof body?.nextOffset === "number" ? body.nextOffset : null
    };
}
async function loadSavedEditorV2Document(storageId) {
    const response = await fetch(`/api/editor-v2/designs/${storageId}`, {
        method: "GET",
        credentials: "same-origin"
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok || !body?.data || !body.id || !body.createdAt || !body.updatedAt || !body.versionToken) {
        throw new EditorV2PersistenceError(body?.error ?? "Couldn't load this design.", response.status, body?.versionToken ?? null);
    }
    return {
        document: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$persistence$2f$designs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hydrateEditorV2Document"])({
            id: body.id,
            createdAt: body.createdAt,
            updatedAt: body.updatedAt,
            data: body.data
        }),
        versionToken: body.versionToken,
        storageId: body.id,
        createdAt: body.createdAt,
        updatedAt: body.updatedAt
    };
}
async function saveEditorV2Document(document, storageId, baseVersion, saveSource = "manual", forceVersion = false) {
    const response = await fetch(storageId ? `/api/editor-v2/designs/${storageId}` : "/api/editor-v2/designs", {
        method: storageId ? "PUT" : "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
            data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$persistence$2f$designs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serializeEditorV2Document"])(document),
            baseVersion: baseVersion ?? null,
            forceVersion,
            saveSource
        })
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok || !body?.id || !body.title || typeof body.gridWidth !== "number" || typeof body.gridHeight !== "number" || !body.createdAt || !body.updatedAt || !body.versionToken) {
        throw new EditorV2PersistenceError(body?.error ?? "Couldn't save this design.", response.status, body?.versionToken ?? null);
    }
    return {
        storageId: body.id,
        title: body.title,
        gridWidth: body.gridWidth,
        gridHeight: body.gridHeight,
        createdAt: body.createdAt,
        updatedAt: body.updatedAt,
        versionToken: body.versionToken
    };
}
async function listEditorV2DesignVersions(storageId) {
    const response = await fetch(`/api/editor-v2/designs/${storageId}/versions`, {
        method: "GET",
        credentials: "same-origin"
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok) {
        throw new EditorV2PersistenceError(body?.error ?? "Couldn't load version history.", response.status);
    }
    return Array.isArray(body?.versions) ? body.versions : [];
}
async function loadEditorV2DesignVersion(storageId, versionId) {
    const response = await fetch(`/api/editor-v2/designs/${storageId}/versions/${versionId}`, {
        method: "GET",
        credentials: "same-origin"
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok || !body?.versionId || !body.designId || !body.createdAt || !body.data) {
        throw new EditorV2PersistenceError(body?.error ?? "Couldn't load this version.", response.status);
    }
    const document = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$persistence$2f$designs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hydrateEditorV2Document"])({
        id: body.designId,
        createdAt: body.createdAt,
        updatedAt: body.createdAt,
        data: body.data
    });
    document.metadata.persistedVersionId = body.versionId;
    return {
        versionId: body.versionId,
        designId: body.designId,
        createdAt: body.createdAt,
        saveSource: body.saveSource ?? null,
        document
    };
}
async function restoreEditorV2DesignVersion(storageId, versionId, options) {
    const response = await fetch(`/api/editor-v2/designs/${storageId}/versions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
            versionId,
            mode: options?.mode === "copy" ? "copy" : "replace"
        })
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok || !body?.storageId || !body.title || typeof body.gridWidth !== "number" || typeof body.gridHeight !== "number" || !body.updatedAt || !body.versionToken || !body.restoredVersionId || !body.data) {
        throw new EditorV2PersistenceError(body?.error ?? "Couldn't restore this version.", response.status, body?.versionToken ?? null);
    }
    const document = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$persistence$2f$designs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hydrateEditorV2Document"])({
        id: body.storageId,
        createdAt: body.updatedAt,
        updatedAt: body.updatedAt,
        data: body.data
    });
    document.metadata.persistedVersionId = body.restoredVersionId;
    return {
        storageId: body.storageId,
        title: body.title,
        gridWidth: body.gridWidth,
        gridHeight: body.gridHeight,
        updatedAt: body.updatedAt,
        versionToken: body.versionToken,
        restoredVersionId: body.restoredVersionId,
        document
    };
}
async function deleteSavedEditorV2Document(storageId) {
    const response = await fetch(`/api/editor-v2/designs/${storageId}`, {
        method: "DELETE",
        credentials: "same-origin"
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok || !body?.id) {
        throw new EditorV2PersistenceError(body?.error ?? "Couldn't delete this design.", response.status);
    }
    return {
        storageId: body.id
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/library/stitchSnapshot.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildLibraryStitchSnapshot",
    ()=>buildLibraryStitchSnapshot
]);
function buildLibraryStitchSnapshot(options) {
    const { gridWidth, gridHeight, cells, colorsById } = options;
    const safeGridWidth = Math.max(1, Math.floor(gridWidth));
    const safeGridHeight = Math.max(1, Math.floor(gridHeight));
    const snapshotCells = cells.slice(0, safeGridWidth * safeGridHeight).map((colorId)=>colorId && colorsById[colorId] ? colorsById[colorId].hex : null);
    return {
        width: safeGridWidth,
        height: safeGridHeight,
        cells: snapshotCells
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/editor-v2/editor/positioning/boxGeometry.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MOVE_CENTER_SNAP_PX",
    ()=>MOVE_CENTER_SNAP_PX,
    "MOVE_CENTER_UNSNAP_PX",
    ()=>MOVE_CENTER_UNSNAP_PX,
    "POSITIONING_HANDLES",
    ()=>POSITIONING_HANDLES,
    "ROTATION_SNAP_DEGREES",
    ()=>ROTATION_SNAP_DEGREES,
    "ROTATION_UNSNAP_DEGREES",
    ()=>ROTATION_UNSNAP_DEGREES,
    "clampPositioningScale",
    ()=>clampPositioningScale,
    "getBoundsFromHandleDrag",
    ()=>getBoundsFromHandleDrag,
    "getCenterSnappedPosition",
    ()=>getCenterSnappedPosition,
    "getContainedRect",
    ()=>getContainedRect,
    "getHandleLeft",
    ()=>getHandleLeft,
    "getHandleTop",
    ()=>getHandleTop,
    "getLocalPointWithinRotatedBounds",
    ()=>getLocalPointWithinRotatedBounds,
    "getPositionedBounds",
    ()=>getPositionedBounds,
    "getPositioningTransformCss",
    ()=>getPositioningTransformCss,
    "getResizeSnappedBounds",
    ()=>getResizeSnappedBounds,
    "getRotatedBounds",
    ()=>getRotatedBounds,
    "getRotationCss",
    ()=>getRotationCss,
    "getRotationSnapTarget",
    ()=>getRotationSnapTarget,
    "getSnappedRotationDegrees",
    ()=>getSnappedRotationDegrees,
    "getTransformFromDrag",
    ()=>getTransformFromDrag,
    "getTransformFromPinch",
    ()=>getTransformFromPinch,
    "normalizeRotationDegrees",
    ()=>normalizeRotationDegrees
]);
const ROTATION_SNAP_DEGREES = 3;
const ROTATION_UNSNAP_DEGREES = 5;
const MOVE_CENTER_SNAP_PX = 8;
const MOVE_CENTER_UNSNAP_PX = 12;
const POSITIONING_HANDLES = [
    {
        id: "nw",
        kind: "corner",
        cursor: "nwse-resize"
    },
    {
        id: "n",
        kind: "edge",
        cursor: "ns-resize"
    },
    {
        id: "ne",
        kind: "corner",
        cursor: "nesw-resize"
    },
    {
        id: "e",
        kind: "edge",
        cursor: "ew-resize"
    },
    {
        id: "se",
        kind: "corner",
        cursor: "nwse-resize"
    },
    {
        id: "s",
        kind: "edge",
        cursor: "ns-resize"
    },
    {
        id: "sw",
        kind: "corner",
        cursor: "nesw-resize"
    },
    {
        id: "w",
        kind: "edge",
        cursor: "ew-resize"
    }
];
function getContainedRect(sourceWidth, sourceHeight, frameWidth, frameHeight) {
    if (sourceWidth <= 0 || sourceHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
        return {
            left: 0,
            top: 0,
            width: Math.max(frameWidth, 0),
            height: Math.max(frameHeight, 0)
        };
    }
    const scale = Math.min(frameWidth / sourceWidth, frameHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    return {
        left: (frameWidth - width) / 2,
        top: (frameHeight - height) / 2,
        width,
        height
    };
}
function getPositionedBounds(baseRect, transform) {
    return {
        left: baseRect.left + transform.offsetX,
        top: baseRect.top + transform.offsetY,
        width: baseRect.width * transform.scale,
        height: baseRect.height * transform.scale
    };
}
function getPositioningTransformCss(transform) {
    return `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`;
}
function getRotationCss(rotation) {
    return `rotate(${normalizeRotationDegrees(rotation)}deg)`;
}
function getHandleLeft(handle, width, size) {
    if (handle === "nw" || handle === "w" || handle === "sw") {
        return -size / 2;
    }
    if (handle === "n" || handle === "s") {
        return width / 2 - size / 2;
    }
    return width - size / 2;
}
function getHandleTop(handle, height, size) {
    if (handle === "nw" || handle === "n" || handle === "ne") {
        return -size / 2;
    }
    if (handle === "e" || handle === "w") {
        return height / 2 - size / 2;
    }
    return height - size / 2;
}
function getTransformFromDrag(dragState, point, baseRect) {
    if (dragState.mode === "rotate") {
        const centerX = dragState.startBounds.left + dragState.startBounds.width / 2;
        const centerY = dragState.startBounds.top + dragState.startBounds.height / 2;
        const startAngle = Math.atan2(dragState.startPoint.y - centerY, dragState.startPoint.x - centerX);
        const nextAngle = Math.atan2(point.y - centerY, point.x - centerX);
        return {
            offsetX: dragState.startTransform.offsetX,
            offsetY: dragState.startTransform.offsetY,
            scale: dragState.startTransform.scale,
            rotation: normalizeRotationDegrees(dragState.startTransform.rotation + (nextAngle - startAngle) * 180 / Math.PI)
        };
    }
    if (dragState.mode === "move") {
        return {
            offsetX: dragState.startTransform.offsetX + (point.x - dragState.startPoint.x),
            offsetY: dragState.startTransform.offsetY + (point.y - dragState.startPoint.y),
            scale: dragState.startTransform.scale,
            rotation: dragState.startTransform.rotation
        };
    }
    const nextBounds = getBoundsFromHandleDrag(dragState.startBounds, dragState.mode, point);
    const nextScale = clampPositioningScale(nextBounds.width / baseRect.width);
    return {
        offsetX: nextBounds.left - baseRect.left,
        offsetY: nextBounds.top - baseRect.top,
        scale: nextScale,
        rotation: dragState.startTransform.rotation
    };
}
function getTransformFromPinch(pinchState, nextCenter, nextDistance, nextAngle, baseRect) {
    const distanceRatio = nextDistance / Math.max(pinchState.startDistance, 0.0001);
    const nextScale = clampPositioningScale(pinchState.startTransform.scale * distanceRatio);
    const nextWidth = baseRect.width * nextScale;
    const nextHeight = baseRect.height * nextScale;
    const nextLeft = nextCenter.x - pinchState.anchorX * nextWidth;
    const nextTop = nextCenter.y - pinchState.anchorY * nextHeight;
    return {
        offsetX: nextLeft - baseRect.left,
        offsetY: nextTop - baseRect.top,
        scale: nextScale,
        rotation: getSnappedRotationDegrees(pinchState.startTransform.rotation + (nextAngle - pinchState.startAngle) * 180 / Math.PI, pinchState.snapRotation)
    };
}
function getCenterSnappedPosition(bounds, containerBounds, currentSnap, zoom) {
    const safeZoom = Math.max(zoom, 0.0001);
    const snapTolerance = MOVE_CENTER_SNAP_PX / safeZoom;
    const unsnapTolerance = MOVE_CENTER_UNSNAP_PX / safeZoom;
    const containerLeft = containerBounds.left;
    const containerTop = containerBounds.top;
    const containerRight = containerBounds.left + containerBounds.width;
    const containerBottom = containerBounds.top + containerBounds.height;
    const containerCenterX = containerBounds.left + containerBounds.width / 2;
    const containerCenterY = containerBounds.top + containerBounds.height / 2;
    const boundsLeft = bounds.left;
    const boundsTop = bounds.top;
    const boundsRight = bounds.left + bounds.width;
    const boundsBottom = bounds.top + bounds.height;
    const boundsCenterX = bounds.left + bounds.width / 2;
    const boundsCenterY = bounds.top + bounds.height / 2;
    const snappedX = getAxisSnapTarget([
        {
            key: "left",
            currentValue: currentSnap.left,
            value: boundsLeft,
            target: containerLeft
        },
        {
            key: "centerX",
            currentValue: currentSnap.centerX,
            value: boundsCenterX,
            target: containerCenterX
        },
        {
            key: "right",
            currentValue: currentSnap.right,
            value: boundsRight,
            target: containerRight
        }
    ], snapTolerance, unsnapTolerance);
    const snappedY = getAxisSnapTarget([
        {
            key: "top",
            currentValue: currentSnap.top,
            value: boundsTop,
            target: containerTop
        },
        {
            key: "centerY",
            currentValue: currentSnap.centerY,
            value: boundsCenterY,
            target: containerCenterY
        },
        {
            key: "bottom",
            currentValue: currentSnap.bottom,
            value: boundsBottom,
            target: containerBottom
        }
    ], snapTolerance, unsnapTolerance);
    return {
        offsetX: snappedX?.offset ?? 0,
        offsetY: snappedY?.offset ?? 0,
        snap: {
            left: snappedX?.key === "left" ? containerLeft : null,
            right: snappedX?.key === "right" ? containerRight : null,
            centerX: snappedX?.key === "centerX" ? containerCenterX : null,
            top: snappedY?.key === "top" ? containerTop : null,
            bottom: snappedY?.key === "bottom" ? containerBottom : null,
            centerY: snappedY?.key === "centerY" ? containerCenterY : null
        }
    };
}
function getResizeSnappedBounds(startBounds, resizedBounds, handle, containerBounds, currentSnap, zoom) {
    const safeZoom = Math.max(zoom, 0.0001);
    const snapTolerance = MOVE_CENTER_SNAP_PX / safeZoom;
    const unsnapTolerance = MOVE_CENTER_UNSNAP_PX / safeZoom;
    const rawScale = clampPositioningScale(resizedBounds.width / Math.max(startBounds.width, 0.0001));
    const horizontalCandidates = getResizeAxisCandidates(startBounds, resizedBounds, handle, containerBounds, "x", currentSnap);
    const verticalCandidates = getResizeAxisCandidates(startBounds, resizedBounds, handle, containerBounds, "y", currentSnap);
    const snappedX = getResizeSnapTarget(horizontalCandidates, snapTolerance, unsnapTolerance);
    const snappedY = getResizeSnapTarget(verticalCandidates, snapTolerance, unsnapTolerance);
    const nextScale = chooseResizeSnapScale(rawScale, snappedX, snappedY);
    if (nextScale === null) {
        return {
            bounds: resizedBounds,
            snap: emptySnapState()
        };
    }
    const bounds = getBoundsForHandleScale(startBounds, handle, nextScale);
    const horizontalSnap = snappedX && Math.abs(snappedX.scale - nextScale) <= 0.0001 ? snappedX : null;
    const verticalSnap = snappedY && Math.abs(snappedY.scale - nextScale) <= 0.0001 ? snappedY : null;
    return {
        bounds,
        snap: {
            left: horizontalSnap?.key === "left" ? horizontalSnap.target : null,
            right: horizontalSnap?.key === "right" ? horizontalSnap.target : null,
            centerX: horizontalSnap?.key === "centerX" ? horizontalSnap.target : null,
            top: verticalSnap?.key === "top" ? verticalSnap.target : null,
            bottom: verticalSnap?.key === "bottom" ? verticalSnap.target : null,
            centerY: verticalSnap?.key === "centerY" ? verticalSnap.target : null
        }
    };
}
function getRotatedBounds(bounds, rotation) {
    if (Math.abs(normalizeRotationDegrees(rotation)) < 0.0001) {
        return bounds;
    }
    const radians = rotation * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    const corners = [
        {
            x: -halfWidth,
            y: -halfHeight
        },
        {
            x: halfWidth,
            y: -halfHeight
        },
        {
            x: halfWidth,
            y: halfHeight
        },
        {
            x: -halfWidth,
            y: halfHeight
        }
    ].map((corner)=>({
            x: centerX + corner.x * cos - corner.y * sin,
            y: centerY + corner.x * sin + corner.y * cos
        }));
    const xs = corners.map((corner)=>corner.x);
    const ys = corners.map((corner)=>corner.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    return {
        left,
        top,
        width: right - left,
        height: bottom - top
    };
}
function getLocalPointWithinRotatedBounds(point, bounds, rotation) {
    if (Math.abs(normalizeRotationDegrees(rotation)) < 0.0001) {
        return {
            x: point.x - bounds.left,
            y: point.y - bounds.top
        };
    }
    const radians = -rotation * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    return {
        x: dx * cos - dy * sin + bounds.width / 2,
        y: dx * sin + dy * cos + bounds.height / 2
    };
}
function getBoundsFromHandleDrag(startBounds, handle, point) {
    const minScale = 0.1;
    const minWidth = startBounds.width * minScale;
    const minHeight = startBounds.height * minScale;
    const left = startBounds.left;
    const right = startBounds.left + startBounds.width;
    const top = startBounds.top;
    const bottom = startBounds.top + startBounds.height;
    const centerX = left + startBounds.width / 2;
    const centerY = top + startBounds.height / 2;
    switch(handle){
        case "e":
            {
                const scale = clampPositioningScale((point.x - left) / startBounds.width);
                const width = startBounds.width * scale;
                const height = startBounds.height * scale;
                return {
                    left,
                    top: centerY - height / 2,
                    width,
                    height
                };
            }
        case "w":
            {
                const scale = clampPositioningScale((right - point.x) / startBounds.width);
                const width = startBounds.width * scale;
                const height = startBounds.height * scale;
                return {
                    left: right - width,
                    top: centerY - height / 2,
                    width,
                    height
                };
            }
        case "s":
            {
                const scale = clampPositioningScale((point.y - top) / startBounds.height);
                const width = startBounds.width * scale;
                const height = startBounds.height * scale;
                return {
                    left: centerX - width / 2,
                    top,
                    width,
                    height
                };
            }
        case "n":
            {
                const scale = clampPositioningScale((bottom - point.y) / startBounds.height);
                const width = startBounds.width * scale;
                const height = startBounds.height * scale;
                return {
                    left: centerX - width / 2,
                    top: bottom - height,
                    width,
                    height
                };
            }
        case "se":
            {
                const scale = clampPositioningScale(Math.max((point.x - left) / startBounds.width, (point.y - top) / startBounds.height));
                return {
                    left,
                    top,
                    width: Math.max(minWidth, startBounds.width * scale),
                    height: Math.max(minHeight, startBounds.height * scale)
                };
            }
        case "sw":
            {
                const scale = clampPositioningScale(Math.max((right - point.x) / startBounds.width, (point.y - top) / startBounds.height));
                const width = startBounds.width * scale;
                const height = startBounds.height * scale;
                return {
                    left: right - width,
                    top,
                    width,
                    height
                };
            }
        case "ne":
            {
                const scale = clampPositioningScale(Math.max((point.x - left) / startBounds.width, (bottom - point.y) / startBounds.height));
                const width = startBounds.width * scale;
                const height = startBounds.height * scale;
                return {
                    left,
                    top: bottom - height,
                    width,
                    height
                };
            }
        case "nw":
        default:
            {
                const scale = clampPositioningScale(Math.max((right - point.x) / startBounds.width, (bottom - point.y) / startBounds.height));
                const width = startBounds.width * scale;
                const height = startBounds.height * scale;
                return {
                    left: right - width,
                    top: bottom - height,
                    width,
                    height
                };
            }
    }
}
function clampPositioningScale(value) {
    if (!Number.isFinite(value)) {
        return 1;
    }
    return Math.min(4, Math.max(0.1, Number(value.toFixed(4))));
}
function normalizeRotationDegrees(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }
    const normalized = ((value + 180) % 360 + 360) % 360 - 180;
    return Number(normalized.toFixed(4));
}
function getRotationSnapTarget(rotation, currentSnapRotation) {
    const normalizedRotation = normalizeRotationDegrees(rotation);
    if (currentSnapRotation !== null && getRotationDeltaDegrees(normalizedRotation, currentSnapRotation) <= ROTATION_UNSNAP_DEGREES) {
        return currentSnapRotation;
    }
    const nearestQuarterTurn = normalizeRotationDegrees(Math.round(normalizedRotation / 90) * 90);
    return getRotationDeltaDegrees(normalizedRotation, nearestQuarterTurn) <= ROTATION_SNAP_DEGREES ? nearestQuarterTurn : null;
}
function getSnappedRotationDegrees(rotation, snapRotation) {
    return snapRotation ?? normalizeRotationDegrees(rotation);
}
function getRotationDeltaDegrees(a, b) {
    return Math.abs(normalizeRotationDegrees(a - b));
}
function getAxisSnapTarget(candidates, snapTolerance, unsnapTolerance) {
    const latchedCandidate = candidates.find((candidate)=>candidate.currentValue !== null);
    if (latchedCandidate && Math.abs(latchedCandidate.value - latchedCandidate.target) <= unsnapTolerance) {
        return {
            key: latchedCandidate.key,
            offset: latchedCandidate.target - latchedCandidate.value
        };
    }
    const snappedCandidate = candidates.map((candidate)=>({
            ...candidate,
            delta: candidate.target - candidate.value,
            distance: Math.abs(candidate.target - candidate.value)
        })).filter((candidate)=>candidate.distance <= snapTolerance).sort((a, b)=>a.distance - b.distance)[0];
    if (!snappedCandidate) {
        return null;
    }
    return {
        key: snappedCandidate.key,
        offset: snappedCandidate.delta
    };
}
function getBoundsForHandleScale(startBounds, handle, scale) {
    const width = startBounds.width * scale;
    const height = startBounds.height * scale;
    const left = startBounds.left;
    const right = startBounds.left + startBounds.width;
    const top = startBounds.top;
    const bottom = startBounds.top + startBounds.height;
    const centerX = left + startBounds.width / 2;
    const centerY = top + startBounds.height / 2;
    switch(handle){
        case "e":
            return {
                left,
                top: centerY - height / 2,
                width,
                height
            };
        case "w":
            return {
                left: right - width,
                top: centerY - height / 2,
                width,
                height
            };
        case "s":
            return {
                left: centerX - width / 2,
                top,
                width,
                height
            };
        case "n":
            return {
                left: centerX - width / 2,
                top: bottom - height,
                width,
                height
            };
        case "se":
            return {
                left,
                top,
                width,
                height
            };
        case "sw":
            return {
                left: right - width,
                top,
                width,
                height
            };
        case "ne":
            return {
                left,
                top: bottom - height,
                width,
                height
            };
        case "nw":
        default:
            return {
                left: right - width,
                top: bottom - height,
                width,
                height
            };
    }
}
function getResizeAxisCandidates(startBounds, currentBounds, handle, containerBounds, axis, currentSnap) {
    const containerStart = axis === "x" ? containerBounds.left : containerBounds.top;
    const containerSize = axis === "x" ? containerBounds.width : containerBounds.height;
    const containerCenter = containerStart + containerSize / 2;
    const containerEnd = containerStart + containerSize;
    const size = axis === "x" ? startBounds.width : startBounds.height;
    const candidateSpecs = axis === "x" ? getResizeHorizontalCandidateSpecs(startBounds, handle, currentBounds, currentSnap, containerStart, containerCenter, containerEnd) : getResizeVerticalCandidateSpecs(startBounds, handle, currentBounds, currentSnap, containerStart, containerCenter, containerEnd);
    const candidates = candidateSpecs.map((candidate)=>createResizeSnapCandidate(handle, candidate.key, candidate.currentValue, candidate.rawValue, candidate.target, size, candidate.constraint));
    return candidates.filter((candidate)=>candidate !== null);
}
function getResizeConstraintForKey(startBounds, handle, key) {
    const left = startBounds.left;
    const right = startBounds.left + startBounds.width;
    const top = startBounds.top;
    const bottom = startBounds.top + startBounds.height;
    const centerX = left + startBounds.width / 2;
    const centerY = top + startBounds.height / 2;
    switch(handle){
        case "e":
            switch(key){
                case "left":
                    return {
                        kind: "fixed",
                        value: left
                    };
                case "centerX":
                    return {
                        kind: "fromStart",
                        start: left,
                        factor: 0.5
                    };
                case "right":
                    return {
                        kind: "fromStart",
                        start: left,
                        factor: 1
                    };
                case "top":
                    return {
                        kind: "fromCenter",
                        center: centerY,
                        factor: 0.5,
                        sign: -1
                    };
                case "centerY":
                    return {
                        kind: "fixed",
                        value: centerY
                    };
                case "bottom":
                    return {
                        kind: "fromCenter",
                        center: centerY,
                        factor: 0.5,
                        sign: 1
                    };
            }
        case "w":
            switch(key){
                case "left":
                    return {
                        kind: "fromEnd",
                        end: right,
                        factor: 1
                    };
                case "centerX":
                    return {
                        kind: "fromEnd",
                        end: right,
                        factor: 0.5
                    };
                case "right":
                    return {
                        kind: "fixed",
                        value: right
                    };
                case "top":
                    return {
                        kind: "fromCenter",
                        center: centerY,
                        factor: 0.5,
                        sign: -1
                    };
                case "centerY":
                    return {
                        kind: "fixed",
                        value: centerY
                    };
                case "bottom":
                    return {
                        kind: "fromCenter",
                        center: centerY,
                        factor: 0.5,
                        sign: 1
                    };
            }
        case "s":
            switch(key){
                case "left":
                    return {
                        kind: "fromCenter",
                        center: centerX,
                        factor: 0.5,
                        sign: -1
                    };
                case "centerX":
                    return {
                        kind: "fixed",
                        value: centerX
                    };
                case "right":
                    return {
                        kind: "fromCenter",
                        center: centerX,
                        factor: 0.5,
                        sign: 1
                    };
                case "top":
                    return {
                        kind: "fixed",
                        value: top
                    };
                case "centerY":
                    return {
                        kind: "fromStart",
                        start: top,
                        factor: 0.5
                    };
                case "bottom":
                    return {
                        kind: "fromStart",
                        start: top,
                        factor: 1
                    };
            }
        case "n":
            switch(key){
                case "left":
                    return {
                        kind: "fromCenter",
                        center: centerX,
                        factor: 0.5,
                        sign: -1
                    };
                case "centerX":
                    return {
                        kind: "fixed",
                        value: centerX
                    };
                case "right":
                    return {
                        kind: "fromCenter",
                        center: centerX,
                        factor: 0.5,
                        sign: 1
                    };
                case "top":
                    return {
                        kind: "fromEnd",
                        end: bottom,
                        factor: 1
                    };
                case "centerY":
                    return {
                        kind: "fromEnd",
                        end: bottom,
                        factor: 0.5
                    };
                case "bottom":
                    return {
                        kind: "fixed",
                        value: bottom
                    };
            }
        case "se":
            switch(key){
                case "left":
                    return {
                        kind: "fixed",
                        value: left
                    };
                case "centerX":
                    return {
                        kind: "fromStart",
                        start: left,
                        factor: 0.5
                    };
                case "right":
                    return {
                        kind: "fromStart",
                        start: left,
                        factor: 1
                    };
                case "top":
                    return {
                        kind: "fixed",
                        value: top
                    };
                case "centerY":
                    return {
                        kind: "fromStart",
                        start: top,
                        factor: 0.5
                    };
                case "bottom":
                    return {
                        kind: "fromStart",
                        start: top,
                        factor: 1
                    };
            }
        case "sw":
            switch(key){
                case "left":
                    return {
                        kind: "fromEnd",
                        end: right,
                        factor: 1
                    };
                case "centerX":
                    return {
                        kind: "fromEnd",
                        end: right,
                        factor: 0.5
                    };
                case "right":
                    return {
                        kind: "fixed",
                        value: right
                    };
                case "top":
                    return {
                        kind: "fixed",
                        value: top
                    };
                case "centerY":
                    return {
                        kind: "fromStart",
                        start: top,
                        factor: 0.5
                    };
                case "bottom":
                    return {
                        kind: "fromStart",
                        start: top,
                        factor: 1
                    };
            }
        case "ne":
            switch(key){
                case "left":
                    return {
                        kind: "fixed",
                        value: left
                    };
                case "centerX":
                    return {
                        kind: "fromStart",
                        start: left,
                        factor: 0.5
                    };
                case "right":
                    return {
                        kind: "fromStart",
                        start: left,
                        factor: 1
                    };
                case "top":
                    return {
                        kind: "fromEnd",
                        end: bottom,
                        factor: 1
                    };
                case "centerY":
                    return {
                        kind: "fromEnd",
                        end: bottom,
                        factor: 0.5
                    };
                case "bottom":
                    return {
                        kind: "fixed",
                        value: bottom
                    };
            }
        case "nw":
        default:
            switch(key){
                case "left":
                    return {
                        kind: "fromEnd",
                        end: right,
                        factor: 1
                    };
                case "centerX":
                    return {
                        kind: "fromEnd",
                        end: right,
                        factor: 0.5
                    };
                case "right":
                    return {
                        kind: "fixed",
                        value: right
                    };
                case "top":
                    return {
                        kind: "fromEnd",
                        end: bottom,
                        factor: 1
                    };
                case "centerY":
                    return {
                        kind: "fromEnd",
                        end: bottom,
                        factor: 0.5
                    };
                case "bottom":
                    return {
                        kind: "fixed",
                        value: bottom
                    };
            }
    }
}
function createResizeSnapCandidate(handle, key, currentValue, rawValue, target, size, constraint) {
    const scale = getResizeConstraintScale(handle, key, target, size, constraint);
    const value = getResizeConstraintValue(constraint, scale, size);
    const startValue = getResizeConstraintValue(constraint, 1, size);
    if (scale === null || value === null || startValue === null) {
        return null;
    }
    return {
        key,
        currentValue,
        startValue,
        value: rawValue,
        target,
        scale,
        priority: getResizeSnapPriority(handle, key)
    };
}
function getResizeConstraintScale(handle, key, target, size, constraint) {
    void handle;
    void key;
    if (constraint.kind === "fixed") {
        return null;
    }
    if (constraint.kind === "fromStart") {
        return clampPositioningScale((target - constraint.start) / (size * constraint.factor));
    }
    if (constraint.kind === "fromCenter") {
        return clampPositioningScale((target - constraint.center) * constraint.sign / (size * constraint.factor));
    }
    return clampPositioningScale((constraint.end - target) / (size * constraint.factor));
}
function getResizeConstraintValue(constraint, scale, size) {
    if (constraint.kind === "fixed") {
        return constraint.value;
    }
    if (scale === null) {
        return null;
    }
    if (constraint.kind === "fromStart") {
        return constraint.start + size * constraint.factor * scale;
    }
    if (constraint.kind === "fromCenter") {
        return constraint.center + size * constraint.factor * scale * constraint.sign;
    }
    return constraint.end - size * constraint.factor * scale;
}
function getResizeSnapTarget(candidates, snapTolerance, unsnapTolerance) {
    const scaledCandidates = candidates.filter((candidate)=>candidate.scale !== null);
    const latchedCandidate = scaledCandidates.find((candidate)=>candidate.currentValue !== null);
    if (latchedCandidate && Math.abs(latchedCandidate.value - latchedCandidate.target) <= unsnapTolerance) {
        return latchedCandidate;
    }
    return scaledCandidates.map((candidate)=>({
            ...candidate,
            distance: Math.abs(candidate.target - candidate.value),
            startDistance: Math.abs(candidate.target - candidate.startValue)
        })).filter((candidate)=>candidate.distance <= snapTolerance && candidate.distance < candidate.startDistance).sort((a, b)=>a.priority - b.priority || a.distance - b.distance)[0] ?? null;
}
function chooseResizeSnapScale(rawScale, snappedX, snappedY) {
    if (!snappedX && !snappedY) {
        return null;
    }
    if (snappedX && snappedY) {
        const xLatched = snappedX.currentValue !== null;
        const yLatched = snappedY.currentValue !== null;
        if (xLatched && !yLatched) {
            return snappedX.scale;
        }
        if (yLatched && !xLatched) {
            return snappedY.scale;
        }
        return Math.abs(snappedX.scale - rawScale) <= Math.abs(snappedY.scale - rawScale) ? snappedX.scale : snappedY.scale;
    }
    return snappedX?.scale ?? snappedY?.scale ?? null;
}
function emptySnapState() {
    return {
        left: null,
        right: null,
        top: null,
        bottom: null,
        centerX: null,
        centerY: null
    };
}
function getResizeSnapPriority(handle, key) {
    switch(handle){
        case "e":
            return key === "right" ? 0 : key === "centerX" ? 1 : 2;
        case "w":
            return key === "left" ? 0 : key === "centerX" ? 1 : 2;
        case "s":
            return key === "bottom" ? 0 : key === "centerY" ? 1 : 2;
        case "n":
            return key === "top" ? 0 : key === "centerY" ? 1 : 2;
        case "se":
            return key === "right" || key === "bottom" ? 0 : 1;
        case "sw":
            return key === "left" || key === "bottom" ? 0 : 1;
        case "ne":
            return key === "right" || key === "top" ? 0 : 1;
        case "nw":
        default:
            return key === "left" || key === "top" ? 0 : 1;
    }
}
function getResizeHorizontalCandidateSpecs(startBounds, handle, currentBounds, currentSnap, containerLeft, containerCenterX, containerRight) {
    const specs = [];
    switch(handle){
        case "w":
        case "sw":
        case "nw":
            specs.push({
                key: "left",
                currentValue: currentSnap.left,
                rawValue: currentBounds.left,
                target: containerLeft,
                constraint: getResizeConstraintForKey(startBounds, handle, "left")
            });
            break;
        case "e":
        case "se":
        case "ne":
            specs.push({
                key: "right",
                currentValue: currentSnap.right,
                rawValue: currentBounds.left + currentBounds.width,
                target: containerRight,
                constraint: getResizeConstraintForKey(startBounds, handle, "right")
            });
            break;
        default:
            break;
    }
    specs.push({
        key: "centerX",
        currentValue: currentSnap.centerX,
        rawValue: currentBounds.left + currentBounds.width / 2,
        target: containerCenterX,
        constraint: getResizeConstraintForKey(startBounds, handle, "centerX")
    });
    return specs;
}
function getResizeVerticalCandidateSpecs(startBounds, handle, currentBounds, currentSnap, containerTop, containerCenterY, containerBottom) {
    const specs = [];
    switch(handle){
        case "n":
        case "ne":
        case "nw":
            specs.push({
                key: "top",
                currentValue: currentSnap.top,
                rawValue: currentBounds.top,
                target: containerTop,
                constraint: getResizeConstraintForKey(startBounds, handle, "top")
            });
            break;
        case "s":
        case "se":
        case "sw":
            specs.push({
                key: "bottom",
                currentValue: currentSnap.bottom,
                rawValue: currentBounds.top + currentBounds.height,
                target: containerBottom,
                constraint: getResizeConstraintForKey(startBounds, handle, "bottom")
            });
            break;
        default:
            break;
    }
    specs.push({
        key: "centerY",
        currentValue: currentSnap.centerY,
        rawValue: currentBounds.top + currentBounds.height / 2,
        target: containerCenterY,
        constraint: getResizeConstraintForKey(startBounds, handle, "centerY")
    });
    return specs;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/editor-v2/editor/positioning/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$positioning$2f$boxGeometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/positioning/boxGeometry.ts [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/stitchUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getThreadRadii",
    ()=>getThreadRadii,
    "getThreadStitchCanvas",
    ()=>getThreadStitchCanvas
]);
"use client";
function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return null;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if ([
        r,
        g,
        b
    ].some((v)=>Number.isNaN(v))) return null;
    return {
        r,
        g,
        b
    };
}
function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        if (max === rn) h = (gn - bn) / delta % 6;
        else if (max === gn) h = (bn - rn) / delta + 2;
        else h = (rn - gn) / delta + 4;
        h /= 6;
        if (h < 0) h += 1;
    }
    return {
        h,
        s,
        l
    };
}
function hslToRgb(h, s, l) {
    if (s === 0) {
        const v = Math.round(l * 255);
        return {
            r: v,
            g: v,
            b: v
        };
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hueToRgb = (t)=>{
        let tt = t;
        if (tt < 0) tt += 1;
        if (tt > 1) tt -= 1;
        if (tt < 1 / 6) return p + (q - p) * 6 * tt;
        if (tt < 1 / 2) return q;
        if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
        return p;
    };
    const r = Math.round(hueToRgb(h + 1 / 3) * 255);
    const g = Math.round(hueToRgb(h) * 255);
    const b = Math.round(hueToRgb(h - 1 / 3) * 255);
    return {
        r,
        g,
        b
    };
}
function adjustTone(hex, options) {
    const rgb = hexToRgb(hex);
    if (!rgb) return {
        r: 0,
        g: 0,
        b: 0
    };
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const nextL = Math.min(1, Math.max(0, hsl.l + (options.lightnessDelta ?? 0)));
    const nextS = Math.min(1, Math.max(0, hsl.s * (options.saturationMultiplier ?? 1)));
    return hslToRgb(hsl.h, nextS, nextL);
}
function mixWithBlack(hex, amount) {
    const rgb = hexToRgb(hex);
    if (!rgb) return {
        r: 0,
        g: 0,
        b: 0
    };
    const clampedAmount = Math.min(1, Math.max(0, amount));
    const keep = 1 - clampedAmount;
    return {
        r: Math.round(rgb.r * keep),
        g: Math.round(rgb.g * keep),
        b: Math.round(rgb.b * keep)
    };
}
function hashString(input) {
    let hash = 2166136261;
    for(let i = 0; i < input.length; i++){
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
function mulberry32(seed) {
    let t = seed;
    return ()=>{
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ t >>> 15, t | 1);
        r ^= r + Math.imul(r ^ r >>> 7, r | 61);
        return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
}
function getThreadRadii(size) {
    const s = Math.max(1, Math.round(size));
    const padding = -0.2;
    const half = Math.max(1, s / 2 - padding);
    const ratio = 1.28;
    const b = Math.SQRT2 * half / Math.sqrt(ratio * ratio + 1);
    const a = b * ratio;
    return {
        radiusX: Math.max(1, a),
        radiusY: Math.max(1, b)
    };
}
function getPreviewThreadRadii(size) {
    const s = Math.max(1, Math.round(size));
    const half = Math.max(1, s / 2 - 0.1);
    return {
        radiusX: Math.max(1, half * 1.34),
        radiusY: Math.max(1, half * 0.72)
    };
}
function getThreadStitchCanvas(hex, size, cache, styleVersion, options) {
    const rounded = Math.max(1, Math.round(size));
    const showTopLeftShadow = options?.showTopLeftShadow ?? false;
    const showBottomRightShadow = options?.showBottomRightShadow ?? false;
    const key = `${styleVersion}|${hex}|${rounded}|${showTopLeftShadow ? 1 : 0}|${showBottomRightShadow ? 1 : 0}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const previewStyle = styleVersion >= 2;
    const oversample = previewStyle ? 2 : 1;
    const canvas = document.createElement("canvas");
    canvas.width = rounded * oversample;
    canvas.height = rounded * oversample;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (oversample > 1) {
        ctx.scale(oversample, oversample);
    }
    const center = rounded / 2;
    const { radiusX, radiusY } = previewStyle ? getPreviewThreadRadii(rounded) : getThreadRadii(rounded);
    const light = adjustTone(hex, {
        lightnessDelta: 0.18,
        saturationMultiplier: 0.94
    });
    const topShadow = mixWithBlack(hex, 0.52);
    const bottomShadow = mixWithBlack(hex, 0.68);
    const edgeShadow = mixWithBlack(hex, 0.4);
    const highlightColor = `rgba(${light.r}, ${light.g}, ${light.b}, ${previewStyle ? 0.26 : 0.3})`;
    const shadowColor = `rgba(${edgeShadow.r}, ${edgeShadow.g}, ${edgeShadow.b}, ${previewStyle ? 0.22 : 0.25})`;
    const ridgeColor = `rgba(${light.r}, ${light.g}, ${light.b}, ${previewStyle ? 0.1 : 0.12})`;
    const glintColor = `rgba(${light.r}, ${light.g}, ${light.b}, ${previewStyle ? 0.09 : 0.12})`;
    if (previewStyle) {
        const cornerReach = rounded * 0.66;
        const seamOverlap = Math.max(1, rounded * 0.04);
        if (showTopLeftShadow) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, rounded, rounded * 0.5 + seamOverlap);
            ctx.clip();
            ctx.fillStyle = `rgb(${topShadow.r}, ${topShadow.g}, ${topShadow.b})`;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(cornerReach, 0);
            ctx.lineTo(0, cornerReach);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        if (showBottomRightShadow) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, rounded * 0.5 - seamOverlap, rounded, rounded * 0.5 + seamOverlap);
            ctx.clip();
            ctx.fillStyle = `rgb(${bottomShadow.r}, ${bottomShadow.g}, ${bottomShadow.b})`;
            ctx.beginPath();
            ctx.moveTo(rounded, rounded);
            ctx.lineTo(rounded - cornerReach, rounded);
            ctx.lineTo(rounded, rounded - cornerReach);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(-Math.PI / 4);
    if (previewStyle) {
        const shadowGradient = ctx.createLinearGradient(-radiusX * 1.1, -radiusY * 1.1, radiusX * 1.1, radiusY * 1.1);
        shadowGradient.addColorStop(0, `rgba(${edgeShadow.r}, ${edgeShadow.g}, ${edgeShadow.b}, 0.44)`);
        shadowGradient.addColorStop(0.65, `rgba(${edgeShadow.r}, ${edgeShadow.g}, ${edgeShadow.b}, 0.16)`);
        shadowGradient.addColorStop(1, `rgba(${light.r}, ${light.g}, ${light.b}, 0.08)`);
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX * 1.06, radiusY * 1.06, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.ellipse(0, 0, previewStyle ? radiusX * 0.98 : radiusX, previewStyle ? radiusY * 0.98 : radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    const highlight = ctx.createLinearGradient(-radiusX, 0, radiusX, 0);
    highlight.addColorStop(0, highlightColor);
    highlight.addColorStop(0.45, "rgba(0,0,0,0)");
    highlight.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    const shadow = ctx.createLinearGradient(-radiusX, 0, radiusX, 0);
    shadow.addColorStop(0, "rgba(0,0,0,0)");
    shadow.addColorStop(0.55, "rgba(0,0,0,0)");
    shadow.addColorStop(1, shadowColor);
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ridgeColor;
    ctx.lineWidth = Math.max(0.6, rounded * (previewStyle ? 0.033 : 0.04));
    const ridgeCount = rounded >= 18 ? 4 : 3;
    const offsets = ridgeCount === 4 ? [
        -0.35,
        -0.12,
        0.12,
        0.35
    ] : [
        -0.25,
        0,
        0.25
    ];
    offsets.forEach((t)=>{
        const y = t * radiusY;
        ctx.beginPath();
        ctx.moveTo(-radiusX * 0.85, y);
        ctx.lineTo(radiusX * 0.85, y);
        ctx.stroke();
    });
    ctx.strokeStyle = glintColor;
    ctx.lineWidth = Math.max(0.5, rounded * (previewStyle ? 0.024 : 0.03));
    ctx.beginPath();
    ctx.moveTo(-radiusX * 0.2, -radiusY * 0.05);
    ctx.lineTo(radiusX * 0.2, -radiusY * 0.05);
    ctx.stroke();
    const rand = mulberry32(hashString(key));
    ctx.strokeStyle = `rgba(${light.r}, ${light.g}, ${light.b}, ${previewStyle ? 0.08 : 0.1})`;
    ctx.lineWidth = Math.max(0.4, rounded * (previewStyle ? 0.017 : 0.02));
    const fuzzLines = rounded >= 18 ? 10 : 8;
    for(let i = 0; i < fuzzLines; i++){
        const y = (rand() * 2 - 1) * radiusY * 0.65;
        const x0 = -radiusX * 0.75 + rand() * radiusX * 1.5;
        const len = radiusX * (0.08 + rand() * 0.22);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + len, y);
        ctx.stroke();
    }
    ctx.restore();
    cache.set(key, canvas);
    return canvas;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/library/StitchThumbnailCanvas.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StitchThumbnailCanvas",
    ()=>StitchThumbnailCanvas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$positioning$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/positioning/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$positioning$2f$boxGeometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/positioning/boxGeometry.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$stitchUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/stitchUtils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const EDITOR_TRACE_POSITION_CELL_SIZE = 28;
const TRACE_ASPECT_MISMATCH_EPSILON = 0.05;
function getThumbnailSurfaceSize(snapshot) {
    return {
        width: snapshot.width * EDITOR_TRACE_POSITION_CELL_SIZE,
        height: snapshot.height * EDITOR_TRACE_POSITION_CELL_SIZE
    };
}
function StitchThumbnailCanvas({ snapshot, traceThumbnailUrl, tracePlacement, className, testId }) {
    _s();
    const surfaceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const frameRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const stitchCanvasCacheRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const traceImageCacheRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StitchThumbnailCanvas.useEffect": ()=>{
            const surface = surfaceRef.current;
            const frame = frameRef.current;
            const canvas = canvasRef.current;
            if (!surface || !frame || !canvas) {
                return;
            }
            const render = {
                "StitchThumbnailCanvas.useEffect.render": ()=>{
                    const currentSurface = surfaceRef.current;
                    const currentFrame = frameRef.current;
                    const currentCanvas = canvasRef.current;
                    if (!currentSurface || !currentFrame || !currentCanvas) {
                        return;
                    }
                    const surfaceBounds = currentSurface.getBoundingClientRect();
                    const surfaceWidth = Math.max(1, Math.round(surfaceBounds.width));
                    const surfaceHeight = Math.max(1, Math.round(surfaceBounds.height));
                    const thumbnailSurface = snapshot ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$positioning$2f$boxGeometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getContainedRect"])(snapshot.width, snapshot.height, surfaceWidth, surfaceHeight) : {
                        width: surfaceWidth,
                        height: surfaceHeight
                    };
                    const width = Math.max(1, Math.round(thumbnailSurface.width));
                    const height = Math.max(1, Math.round(thumbnailSurface.height));
                    const dpr = window.devicePixelRatio || 1;
                    const targetWidth = Math.max(1, Math.round(width * dpr));
                    const targetHeight = Math.max(1, Math.round(height * dpr));
                    const nextFrameWidth = `${width}px`;
                    const nextFrameHeight = `${height}px`;
                    if (currentFrame.style.width !== nextFrameWidth) {
                        currentFrame.style.width = nextFrameWidth;
                    }
                    if (currentFrame.style.height !== nextFrameHeight) {
                        currentFrame.style.height = nextFrameHeight;
                    }
                    if (currentCanvas.width !== targetWidth) {
                        currentCanvas.width = targetWidth;
                    }
                    if (currentCanvas.height !== targetHeight) {
                        currentCanvas.height = targetHeight;
                    }
                    const context = currentCanvas.getContext("2d");
                    if (!context) {
                        return;
                    }
                    const canvasBackground = getComputedStyle(currentCanvas).getPropertyValue("--canvas-bg").trim();
                    context.setTransform(dpr, 0, 0, dpr, 0, 0);
                    context.clearRect(0, 0, width, height);
                    context.fillStyle = canvasBackground || "#ffffff";
                    context.fillRect(0, 0, width, height);
                    if (!snapshot) {
                        return;
                    }
                    const cellSize = Math.max(1, Math.min(width / snapshot.width, height / snapshot.height));
                    const drawWidth = cellSize * snapshot.width;
                    const drawHeight = cellSize * snapshot.height;
                    const drawX = (width - drawWidth) / 2;
                    const drawY = (height - drawHeight) / 2;
                    const oversampleFactor = cellSize >= 18 ? 1 : cellSize >= 12 ? 1.5 : 2;
                    const stitchSize = Math.max(1, Math.round(cellSize * oversampleFactor));
                    context.imageSmoothingEnabled = oversampleFactor > 1;
                    if (oversampleFactor > 1) {
                        context.imageSmoothingQuality = "high";
                    }
                    if (traceThumbnailUrl) {
                        const cachedTraceImage = traceImageCacheRef.current.get(traceThumbnailUrl);
                        if (cachedTraceImage) {
                            const loadedTraceWidth = cachedTraceImage.naturalWidth || cachedTraceImage.width || 0;
                            const loadedTraceHeight = cachedTraceImage.naturalHeight || cachedTraceImage.height || 0;
                            const persistedTraceWidth = tracePlacement?.imageWidth && tracePlacement.imageWidth > 0 ? tracePlacement.imageWidth : 0;
                            const persistedTraceHeight = tracePlacement?.imageHeight && tracePlacement.imageHeight > 0 ? tracePlacement.imageHeight : 0;
                            const loadedAspect = loadedTraceWidth > 0 && loadedTraceHeight > 0 ? loadedTraceWidth / loadedTraceHeight : null;
                            const persistedAspect = persistedTraceWidth > 0 && persistedTraceHeight > 0 ? persistedTraceWidth / persistedTraceHeight : null;
                            const shouldPreferPersistedAspect = loadedAspect !== null && persistedAspect !== null && Math.abs(loadedAspect - persistedAspect) / persistedAspect > TRACE_ASPECT_MISMATCH_EPSILON;
                            const traceSourceWidth = shouldPreferPersistedAspect ? persistedTraceWidth : loadedTraceWidth || persistedTraceWidth;
                            const traceSourceHeight = shouldPreferPersistedAspect ? persistedTraceHeight : loadedTraceHeight || persistedTraceHeight;
                            const traceBaseRect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$positioning$2f$boxGeometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getContainedRect"])(traceSourceWidth, traceSourceHeight, drawWidth, drawHeight);
                            const traceBounds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$positioning$2f$boxGeometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPositionedBounds"])(traceBaseRect, {
                                offsetX: (tracePlacement?.offsetX ?? 0) * (cellSize / EDITOR_TRACE_POSITION_CELL_SIZE),
                                offsetY: (tracePlacement?.offsetY ?? 0) * (cellSize / EDITOR_TRACE_POSITION_CELL_SIZE),
                                scale: tracePlacement?.scale ?? 1,
                                rotation: tracePlacement?.rotation ?? 0
                            });
                            context.save();
                            context.globalAlpha = 0.35;
                            context.translate(drawX + traceBounds.left + traceBounds.width / 2, drawY + traceBounds.top + traceBounds.height / 2);
                            context.rotate((tracePlacement?.rotation ?? 0) * Math.PI / 180);
                            context.drawImage(cachedTraceImage, -traceBounds.width / 2, -traceBounds.height / 2, traceBounds.width, traceBounds.height);
                            context.restore();
                        } else if (!traceImageCacheRef.current.has(traceThumbnailUrl)) {
                            traceImageCacheRef.current.set(traceThumbnailUrl, null);
                            const traceImage = new Image();
                            traceImage.crossOrigin = "anonymous";
                            traceImage.decoding = "async";
                            traceImage.onload = ({
                                "StitchThumbnailCanvas.useEffect.render": ()=>{
                                    traceImageCacheRef.current.set(traceThumbnailUrl, traceImage);
                                    render();
                                }
                            })["StitchThumbnailCanvas.useEffect.render"];
                            traceImage.onerror = ({
                                "StitchThumbnailCanvas.useEffect.render": ()=>{
                                    traceImageCacheRef.current.delete(traceThumbnailUrl);
                                }
                            })["StitchThumbnailCanvas.useEffect.render"];
                            traceImage.src = traceThumbnailUrl;
                        }
                    }
                    for(let index = 0; index < snapshot.cells.length; index += 1){
                        const color = snapshot.cells[index];
                        if (!color) {
                            continue;
                        }
                        const x = index % snapshot.width;
                        const y = Math.floor(index / snapshot.width);
                        const stitchCanvas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$stitchUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getThreadStitchCanvas"])(color, stitchSize, stitchCanvasCacheRef.current, 1);
                        context.drawImage(stitchCanvas, drawX + x * cellSize, drawY + y * cellSize, cellSize, cellSize);
                    }
                }
            }["StitchThumbnailCanvas.useEffect.render"];
            render();
            const observer = new ResizeObserver({
                "StitchThumbnailCanvas.useEffect": ()=>render()
            }["StitchThumbnailCanvas.useEffect"]);
            observer.observe(surface);
            return ({
                "StitchThumbnailCanvas.useEffect": ()=>observer.disconnect()
            })["StitchThumbnailCanvas.useEffect"];
        }
    }["StitchThumbnailCanvas.useEffect"], [
        snapshot,
        tracePlacement,
        traceThumbnailUrl
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: surfaceRef,
        style: {
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center"
        },
        "aria-hidden": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: frameRef,
            className: className,
            "data-testid": testId,
            style: {
                width: "100%",
                height: "100%"
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: canvasRef,
                style: {
                    display: "block",
                    width: "100%",
                    height: "100%"
                }
            }, void 0, false, {
                fileName: "[project]/app/library/StitchThumbnailCanvas.tsx",
                lineNumber: 255,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/library/StitchThumbnailCanvas.tsx",
            lineNumber: 249,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/library/StitchThumbnailCanvas.tsx",
        lineNumber: 239,
        columnNumber: 5
    }, this);
}
_s(StitchThumbnailCanvas, "ck//2DTCut8kHHRIh+VrrSO1jhg=");
_c = StitchThumbnailCanvas;
var _c;
__turbopack_context__.k.register(_c, "StitchThumbnailCanvas");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/library/page.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "actions": "page-module__lH2wXa__actions",
  "bulkBar": "page-module__lH2wXa__bulkBar",
  "bulkBarAction": "page-module__lH2wXa__bulkBarAction",
  "bulkBarActionIcon": "page-module__lH2wXa__bulkBarActionIcon",
  "bulkBarCount": "page-module__lH2wXa__bulkBarCount",
  "bulkBarDeleteAction": "page-module__lH2wXa__bulkBarDeleteAction",
  "bulkBarDeleteIcon": "page-module__lH2wXa__bulkBarDeleteIcon",
  "bulkBarDismiss": "page-module__lH2wXa__bulkBarDismiss",
  "bulkBarDismissIcon": "page-module__lH2wXa__bulkBarDismissIcon",
  "bulkBarDivider": "page-module__lH2wXa__bulkBarDivider",
  "bulkBarOverlay": "page-module__lH2wXa__bulkBarOverlay",
  "bulkBarSelectAllIcon": "page-module__lH2wXa__bulkBarSelectAllIcon",
  "card": "page-module__lH2wXa__card",
  "cardBody": "page-module__lH2wXa__cardBody",
  "cardCheckbox": "page-module__lH2wXa__cardCheckbox",
  "cardCheckboxIndicator": "page-module__lH2wXa__cardCheckboxIndicator",
  "cardCheckboxInput": "page-module__lH2wXa__cardCheckboxInput",
  "cardDetailsLink": "page-module__lH2wXa__cardDetailsLink",
  "cardLink": "page-module__lH2wXa__cardLink",
  "cardMenuAnchor": "page-module__lH2wXa__cardMenuAnchor",
  "cardMenuDots": "page-module__lH2wXa__cardMenuDots",
  "cardMenuItemIcon": "page-module__lH2wXa__cardMenuItemIcon",
  "cardMenuItemLabel": "page-module__lH2wXa__cardMenuItemLabel",
  "cardMenuItemLabelDestructive": "page-module__lH2wXa__cardMenuItemLabelDestructive",
  "cardMenuSurface": "page-module__lH2wXa__cardMenuSurface",
  "cardMenuTrigger": "page-module__lH2wXa__cardMenuTrigger",
  "cardMenuWrapper": "page-module__lH2wXa__cardMenuWrapper",
  "cardMeta": "page-module__lH2wXa__cardMeta",
  "cardSelectionInput": "page-module__lH2wXa__cardSelectionInput",
  "cardSelectionInputCard": "page-module__lH2wXa__cardSelectionInputCard",
  "cardSelectionSurface": "page-module__lH2wXa__cardSelectionSurface",
  "cardTimestamp": "page-module__lH2wXa__cardTimestamp",
  "cardTitle": "page-module__lH2wXa__cardTitle",
  "cardTitleLink": "page-module__lH2wXa__cardTitleLink",
  "cardTopRow": "page-module__lH2wXa__cardTopRow",
  "content": "page-module__lH2wXa__content",
  "contentWithBulkBar": "page-module__lH2wXa__contentWithBulkBar",
  "desktopSelectButton": "page-module__lH2wXa__desktopSelectButton",
  "emptyState": "page-module__lH2wXa__emptyState",
  "emptyStateBody": "page-module__lH2wXa__emptyStateBody",
  "emptyStateTitle": "page-module__lH2wXa__emptyStateTitle",
  "grid": "page-module__lH2wXa__grid",
  "header": "page-module__lH2wXa__header",
  "headerCopy": "page-module__lH2wXa__headerCopy",
  "libraryNotificationFadeOut": "page-module__lH2wXa__libraryNotificationFadeOut",
  "libraryPulse": "page-module__lH2wXa__libraryPulse",
  "listBody": "page-module__lH2wXa__listBody",
  "listHeader": "page-module__lH2wXa__listHeader",
  "listHeaderActions": "page-module__lH2wXa__listHeaderActions",
  "listHeaderName": "page-module__lH2wXa__listHeaderName",
  "listLoadingText": "page-module__lH2wXa__listLoadingText",
  "listMetaCell": "page-module__lH2wXa__listMetaCell",
  "listMobileMeta": "page-module__lH2wXa__listMobileMeta",
  "listMobileMetaItem": "page-module__lH2wXa__listMobileMetaItem",
  "listNameCell": "page-module__lH2wXa__listNameCell",
  "listNameContent": "page-module__lH2wXa__listNameContent",
  "listRow": "page-module__lH2wXa__listRow",
  "listSelectionCell": "page-module__lH2wXa__listSelectionCell",
  "listSelectionIndicator": "page-module__lH2wXa__listSelectionIndicator",
  "listThumbnailCanvas": "page-module__lH2wXa__listThumbnailCanvas",
  "listThumbnailFrame": "page-module__lH2wXa__listThumbnailFrame",
  "listTitle": "page-module__lH2wXa__listTitle",
  "listView": "page-module__lH2wXa__listView",
  "loadMoreError": "page-module__lH2wXa__loadMoreError",
  "loadingCard": "page-module__lH2wXa__loadingCard",
  "loadingLineLong": "page-module__lH2wXa__loadingLineLong",
  "loadingLineMedium": "page-module__lH2wXa__loadingLineMedium",
  "loadingLineShort": "page-module__lH2wXa__loadingLineShort",
  "loadingThumbnail": "page-module__lH2wXa__loadingThumbnail",
  "mobileSelectionDots": "page-module__lH2wXa__mobileSelectionDots",
  "mobileSelectionMenu": "page-module__lH2wXa__mobileSelectionMenu",
  "mobileSelectionMenuIcon": "page-module__lH2wXa__mobileSelectionMenuIcon",
  "mobileSelectionMenuInControls": "page-module__lH2wXa__mobileSelectionMenuInControls",
  "mobileSelectionMenuInSummary": "page-module__lH2wXa__mobileSelectionMenuInSummary",
  "mobileSelectionMenuLabel": "page-module__lH2wXa__mobileSelectionMenuLabel",
  "mobileSelectionMenuSurface": "page-module__lH2wXa__mobileSelectionMenuSurface",
  "mobileSelectionTrigger": "page-module__lH2wXa__mobileSelectionTrigger",
  "modalOverlay": "page-module__lH2wXa__modalOverlay",
  "notificationOverlayTop": "page-module__lH2wXa__notificationOverlayTop",
  "notificationStack": "page-module__lH2wXa__notificationStack",
  "page": "page-module__lH2wXa__page",
  "scrollSentinel": "page-module__lH2wXa__scrollSentinel",
  "searchField": "page-module__lH2wXa__searchField",
  "searchIcon": "page-module__lH2wXa__searchIcon",
  "searchInput": "page-module__lH2wXa__searchInput",
  "sortControl": "page-module__lH2wXa__sortControl",
  "sortDropdown": "page-module__lH2wXa__sortDropdown",
  "sortDropdownLabel": "page-module__lH2wXa__sortDropdownLabel",
  "sortMenu": "page-module__lH2wXa__sortMenu",
  "sortTrigger": "page-module__lH2wXa__sortTrigger",
  "sortTriggerLabel": "page-module__lH2wXa__sortTriggerLabel",
  "sortTriggerValue": "page-module__lH2wXa__sortTriggerValue",
  "thumbnail": "page-module__lH2wXa__thumbnail",
  "thumbnailCanvas": "page-module__lH2wXa__thumbnailCanvas",
  "thumbnailFrame": "page-module__lH2wXa__thumbnailFrame",
  "thumbnailShell": "page-module__lH2wXa__thumbnailShell",
  "title": "page-module__lH2wXa__title",
  "viewControls": "page-module__lH2wXa__viewControls",
  "viewControlsDivider": "page-module__lH2wXa__viewControlsDivider",
  "viewControlsDividerKeep": "page-module__lH2wXa__viewControlsDividerKeep",
  "viewControlsDividerNoDesktop": "page-module__lH2wXa__viewControlsDividerNoDesktop",
  "viewControlsDividerNoMobile": "page-module__lH2wXa__viewControlsDividerNoMobile",
  "viewRow": "page-module__lH2wXa__viewRow",
  "viewSummary": "page-module__lH2wXa__viewSummary",
  "viewSummaryCount": "page-module__lH2wXa__viewSummaryCount",
  "viewSummaryLabel": "page-module__lH2wXa__viewSummaryLabel",
  "viewToggle": "page-module__lH2wXa__viewToggle",
  "viewToggleIcon": "page-module__lH2wXa__viewToggleIcon",
  "viewToggleItem": "page-module__lH2wXa__viewToggleItem",
});
}),
"[project]/app/library/LibraryPageClient.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LibraryPageClient",
    ()=>LibraryPageClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/components/design-system/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Modal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/Notification.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/SegmentedControl.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SingleSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/design-system/SingleSelectDropdown.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor-v2/app/EditorV2SetupModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$editorV2ServerPersistence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/editor-v2/app/editorV2ServerPersistence.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$store$2f$createNewDesignState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editor-v2/editor/store/createNewDesignState.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$library$2f$stitchSnapshot$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/library/stitchSnapshot.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$StitchThumbnailCanvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/library/StitchThumbnailCanvas.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/app/library/page.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
"use client";
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
const PAGE_SIZE = 12;
const LOADING_CARD_COUNT = PAGE_SIZE;
const DESIGN_OPEN_TRANSITION_MS = 70;
const cardMenuItems = [
    {
        id: "open",
        label: "Open",
        icon: "/icons/lucide/file.svg"
    },
    {
        id: "duplicate",
        label: "Duplicate",
        icon: "/icons/lucide/copy.svg"
    },
    {
        id: "delete",
        label: "Delete",
        icon: "/icons/lucide/trash.svg"
    }
];
const sortOptions = [
    {
        id: "updated-desc",
        label: "Last edited date"
    },
    {
        id: "created-desc",
        label: "Created date"
    },
    {
        id: "name-asc",
        label: "Name"
    },
    {
        id: "size-desc",
        label: "Size"
    },
    {
        id: "colors-desc",
        label: "Color count"
    }
];
const mobileSelectionMenuItems = [
    {
        id: "toggle-selection"
    }
];
function countUsedColors(cells) {
    return new Set(cells.filter((cellId)=>Boolean(cellId))).size;
}
async function fetchLibraryPage(offset) {
    const searchParams = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset)
    });
    const response = await fetch(`/api/editor-v2/designs?${searchParams.toString()}`, {
        method: "GET",
        credentials: "same-origin"
    });
    const body = await response.json().catch(()=>null);
    if (!response.ok) {
        throw new Error(body?.error ?? "Couldn't load more designs.");
    }
    return {
        designs: Array.isArray(body?.designs) ? body.designs : [],
        totalCount: typeof body?.totalCount === "number" ? body.totalCount : 0,
        hasMore: body?.hasMore === true,
        nextOffset: typeof body?.nextOffset === "number" ? body.nextOffset : null
    };
}
function LibraryPageClient({ initialDesigns = [], initialTotalCount = 0, initialHasMore = false, initialNextOffset = null, deferInitialLoad = false }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [designs, setDesigns] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialDesigns);
    const [totalCount, setTotalCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialTotalCount);
    const [hasMore, setHasMore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialHasMore);
    const [nextOffset, setNextOffset] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialNextOffset);
    const [initialLoadPending, setInitialLoadPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(deferInitialLoad);
    const [loadingMore, setLoadingMore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loadMoreError, setLoadMoreError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [setupModalOpen, setSetupModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [creatingDesign, setCreatingDesign] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [setupErrorMessage, setSetupErrorMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [draftWidth, setDraftWidth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("120");
    const [draftHeight, setDraftHeight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("120");
    const [draftSizingMode, setDraftSizingMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("inches");
    const [draftWidthInches, setDraftWidthInches] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("8");
    const [draftHeightInches, setDraftHeightInches] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("8");
    const [draftMeshCount, setDraftMeshCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("10");
    const [cardActionError, setCardActionError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [viewMode, setViewMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("grid");
    const [sortMode, setSortMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("updated-desc");
    const [selectedDesignIds, setSelectedDesignIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "LibraryPageClient.useState": ()=>new Set()
    }["LibraryPageClient.useState"]);
    const [bulkDeletePending, setBulkDeletePending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [deleteConfirmation, setDeleteConfirmation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [successNotification, setSuccessNotification] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pendingDeletion, setPendingDeletion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pendingCardAction, setPendingCardAction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [openingDesignId, setOpeningDesignId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [touchPrimaryInput, setTouchPrimaryInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [touchSelectionMode, setTouchSelectionMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const sentinelRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pendingDeletionTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pendingDeletionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const designOpenTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const loadingCards = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LibraryPageClient.useMemo[loadingCards]": ()=>Array.from({
                length: LOADING_CARD_COUNT
            }, {
                "LibraryPageClient.useMemo[loadingCards]": (_, index)=>index
            }["LibraryPageClient.useMemo[loadingCards]"])
    }["LibraryPageClient.useMemo[loadingCards]"], []);
    const sortedDesigns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LibraryPageClient.useMemo[sortedDesigns]": ()=>{
            const collator = new Intl.Collator(undefined, {
                numeric: true,
                sensitivity: "base"
            });
            return [
                ...designs
            ].sort({
                "LibraryPageClient.useMemo[sortedDesigns]": (left, right)=>{
                    if (sortMode === "updated-desc") {
                        return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
                    }
                    if (sortMode === "created-desc") {
                        return Date.parse(right.createdAt) - Date.parse(left.createdAt);
                    }
                    if (sortMode === "name-asc") {
                        return collator.compare(left.title, right.title);
                    }
                    if (sortMode === "size-desc") {
                        const sizeDifference = right.gridWidth * right.gridHeight - left.gridWidth * left.gridHeight;
                        if (sizeDifference !== 0) {
                            return sizeDifference;
                        }
                        return collator.compare(left.title, right.title);
                    }
                    const leftColorCount = left.colorCount ?? -1;
                    const rightColorCount = right.colorCount ?? -1;
                    const colorDifference = rightColorCount - leftColorCount;
                    if (colorDifference !== 0) {
                        return colorDifference;
                    }
                    return collator.compare(left.title, right.title);
                }
            }["LibraryPageClient.useMemo[sortedDesigns]"]);
        }
    }["LibraryPageClient.useMemo[sortedDesigns]"], [
        designs,
        sortMode
    ]);
    const selectedDesignCount = selectedDesignIds.size;
    const allLoadedDesignsSelected = designs.length > 0 && selectedDesignCount === designs.length;
    const isInitialLoading = initialLoadPending && designs.length === 0;
    async function loadInitialPage() {
        setInitialLoadPending(true);
        setLoadMoreError(null);
        try {
            const result = await fetchLibraryPage(0);
            setDesigns(result.designs);
            setTotalCount(result.totalCount);
            setHasMore(result.hasMore);
            setNextOffset(result.nextOffset);
        } catch (error) {
            setLoadMoreError(error instanceof Error ? error.message : "Couldn't load designs.");
        } finally{
            setInitialLoadPending(false);
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LibraryPageClient.useEffect": ()=>{
            pendingDeletionRef.current = pendingDeletion;
        }
    }["LibraryPageClient.useEffect"], [
        pendingDeletion
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LibraryPageClient.useEffect": ()=>{
            if (!deferInitialLoad) {
                return;
            }
            void loadInitialPage();
        }
    }["LibraryPageClient.useEffect"], [
        deferInitialLoad
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LibraryPageClient.useEffect": ()=>{
            if (!hasMore || loadingMore || loadMoreError || initialLoadPending) {
                return;
            }
            const node = sentinelRef.current;
            if (!node) {
                return;
            }
            const observer = new IntersectionObserver({
                "LibraryPageClient.useEffect": (entries)=>{
                    const [entry] = entries;
                    if (!entry?.isIntersecting || loadingMore) {
                        return;
                    }
                    setLoadingMore(true);
                    setLoadMoreError(null);
                    void fetchLibraryPage(nextOffset ?? designs.length).then({
                        "LibraryPageClient.useEffect": (result)=>{
                            setDesigns({
                                "LibraryPageClient.useEffect": (existing)=>[
                                        ...existing,
                                        ...result.designs.filter({
                                            "LibraryPageClient.useEffect": (candidate)=>!existing.some({
                                                    "LibraryPageClient.useEffect": (record)=>record.id === candidate.id
                                                }["LibraryPageClient.useEffect"])
                                        }["LibraryPageClient.useEffect"])
                                    ]
                            }["LibraryPageClient.useEffect"]);
                            setTotalCount(result.totalCount);
                            setHasMore(result.hasMore);
                            setNextOffset(result.nextOffset);
                        }
                    }["LibraryPageClient.useEffect"]).catch({
                        "LibraryPageClient.useEffect": (error)=>{
                            setLoadMoreError(error instanceof Error ? error.message : "Couldn't load more designs.");
                        }
                    }["LibraryPageClient.useEffect"]).finally({
                        "LibraryPageClient.useEffect": ()=>{
                            setLoadingMore(false);
                        }
                    }["LibraryPageClient.useEffect"]);
                }
            }["LibraryPageClient.useEffect"], {
                rootMargin: "320px 0px"
            });
            observer.observe(node);
            return ({
                "LibraryPageClient.useEffect": ()=>observer.disconnect()
            })["LibraryPageClient.useEffect"];
        }
    }["LibraryPageClient.useEffect"], [
        designs.length,
        hasMore,
        initialLoadPending,
        loadMoreError,
        loadingMore,
        nextOffset
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LibraryPageClient.useEffect": ()=>({
                "LibraryPageClient.useEffect": ()=>{
                    if (pendingDeletionTimeoutRef.current !== null) {
                        window.clearTimeout(pendingDeletionTimeoutRef.current);
                    }
                    if (designOpenTimeoutRef.current !== null) {
                        window.clearTimeout(designOpenTimeoutRef.current);
                    }
                }
            })["LibraryPageClient.useEffect"]
    }["LibraryPageClient.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LibraryPageClient.useEffect": ()=>{
            if (("TURBOPACK compile-time value", "object") === "undefined" || typeof window.matchMedia !== "function") {
                return;
            }
            const coarsePointerQuery = window.matchMedia("(any-pointer: coarse)");
            const hoverPointerQuery = window.matchMedia("(any-hover: hover)");
            const primaryCoarsePointerQuery = window.matchMedia("(pointer: coarse)");
            const primaryHoverQuery = window.matchMedia("(hover: hover)");
            const update = {
                "LibraryPageClient.useEffect.update": ()=>{
                    const hasTouchPoints = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
                    const hasCoarsePointer = coarsePointerQuery.matches || primaryCoarsePointerQuery.matches || hasTouchPoints;
                    const hasHoverPointer = hoverPointerQuery.matches || primaryHoverQuery.matches;
                    setTouchPrimaryInput(hasCoarsePointer && !hasHoverPointer);
                }
            }["LibraryPageClient.useEffect.update"];
            update();
            const queries = [
                coarsePointerQuery,
                hoverPointerQuery,
                primaryCoarsePointerQuery,
                primaryHoverQuery
            ];
            const addListener = {
                "LibraryPageClient.useEffect.addListener": (query)=>{
                    if (typeof query.addEventListener === "function") {
                        query.addEventListener("change", update);
                        return ({
                            "LibraryPageClient.useEffect.addListener": ()=>query.removeEventListener("change", update)
                        })["LibraryPageClient.useEffect.addListener"];
                    }
                    query.addListener(update);
                    return ({
                        "LibraryPageClient.useEffect.addListener": ()=>query.removeListener(update)
                    })["LibraryPageClient.useEffect.addListener"];
                }
            }["LibraryPageClient.useEffect.addListener"];
            const cleanups = queries.map(addListener);
            return ({
                "LibraryPageClient.useEffect": ()=>{
                    cleanups.forEach({
                        "LibraryPageClient.useEffect": (cleanup)=>cleanup()
                    }["LibraryPageClient.useEffect"]);
                }
            })["LibraryPageClient.useEffect"];
        }
    }["LibraryPageClient.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LibraryPageClient.useEffect": ()=>{
            if (!touchPrimaryInput && touchSelectionMode) {
                setTouchSelectionMode(false);
            }
        }
    }["LibraryPageClient.useEffect"], [
        touchPrimaryInput,
        touchSelectionMode
    ]);
    function navigateToDesign(event, designId) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }
        event.preventDefault();
        if (openingDesignId === designId) {
            return;
        }
        if (designOpenTimeoutRef.current !== null) {
            window.clearTimeout(designOpenTimeoutRef.current);
        }
        setOpeningDesignId(designId);
        designOpenTimeoutRef.current = window.setTimeout(()=>{
            router.push(`/editor/designs/${designId}`);
        }, DESIGN_OPEN_TRANSITION_MS);
    }
    function handleTouchSelectionModeToggle() {
        setTouchSelectionMode((current)=>{
            if (current) {
                setSelectedDesignIds(new Set());
            }
            return !current;
        });
    }
    function handleTouchCardOpen(event, designId) {
        if (event.defaultPrevented || touchSelectionMode || !touchPrimaryInput) {
            return;
        }
        const target = event.target;
        if (target instanceof HTMLElement && target.closest("[data-card-menu='true']")) {
            return;
        }
        navigateToDesign(event.nativeEvent, designId);
    }
    function handleTouchListRowSelect(event, designId) {
        if (!touchPrimaryInput || !touchSelectionMode) {
            return;
        }
        const target = event.target;
        if (target instanceof HTMLElement && target.closest("[data-card-menu='true']")) {
            return;
        }
        event.preventDefault();
        handleDesignSelectionChange(designId, !selectedDesignIds.has(designId));
    }
    async function handleCreateDesign(config) {
        setCreatingDesign(true);
        setSetupErrorMessage(null);
        try {
            const document = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editor$2d$v2$2f$editor$2f$store$2f$createNewDesignState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createNewDesignState"])(config.width, config.height, {
                projectId: config.draftId,
                sizingMode: config.sizingMode,
                meshCount: config.meshCount,
                widthInches: config.widthInches,
                heightInches: config.heightInches
            }).document;
            const savedRecord = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$editorV2ServerPersistence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveEditorV2Document"])(document);
            setSetupModalOpen(false);
            router.push(`/editor/designs/${savedRecord.storageId}`);
        } catch (error) {
            setSetupErrorMessage(error instanceof Error ? error.message : "Couldn't create a new design.");
        } finally{
            setCreatingDesign(false);
        }
    }
    async function handleCardMenuAction(action, design) {
        const menuAction = action;
        setCardActionError(null);
        if (menuAction === "open") {
            router.push(`/editor/designs/${design.id}`);
            return;
        }
        if (menuAction === "delete") {
            setDeleteConfirmation({
                kind: "single",
                design
            });
            return;
        }
        setPendingCardAction({
            designId: design.id,
            action: menuAction
        });
        try {
            if (menuAction === "duplicate") {
                const loaded = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$editorV2ServerPersistence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["loadSavedEditorV2Document"])(design.id);
                const saved = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$editorV2ServerPersistence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveEditorV2Document"])(loaded.document);
                setDesigns((existing)=>[
                        {
                            id: saved.storageId,
                            title: saved.title,
                            gridWidth: saved.gridWidth,
                            gridHeight: saved.gridHeight,
                            createdAt: saved.createdAt,
                            updatedAt: saved.updatedAt,
                            updatedLabel: "Edited just now",
                            colorCount: countUsedColors(loaded.document.grid.cells),
                            previewUrl: loaded.document.trace?.previewUrl ?? null,
                            thumbnailUrl: loaded.document.trace?.thumbnailUrl ?? null,
                            tracePlacement: loaded.document.trace ? {
                                imageWidth: loaded.document.trace.imageWidth,
                                imageHeight: loaded.document.trace.imageHeight,
                                offsetX: loaded.document.trace.offsetX,
                                offsetY: loaded.document.trace.offsetY,
                                scale: loaded.document.trace.scale,
                                rotation: loaded.document.trace.rotation
                            } : null,
                            stitchSnapshot: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$library$2f$stitchSnapshot$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildLibraryStitchSnapshot"])({
                                gridWidth: loaded.document.grid.width,
                                gridHeight: loaded.document.grid.height,
                                cells: loaded.document.grid.cells,
                                colorsById: loaded.document.palette.colorsById
                            })
                        },
                        ...existing
                    ]);
                setTotalCount((current)=>current + 1);
                return;
            }
        } catch (error) {
            setCardActionError(error instanceof Error ? error.message : "Couldn't complete that action.");
        } finally{
            setPendingCardAction((current)=>current?.designId === design.id ? null : current);
        }
    }
    function handleDesignSelectionChange(designId, checked) {
        setSelectedDesignIds((current)=>{
            const next = new Set(current);
            if (checked) {
                next.add(designId);
            } else {
                next.delete(designId);
            }
            return next;
        });
    }
    function handleClearSelection() {
        setSelectedDesignIds(new Set());
        if (touchPrimaryInput) {
            setTouchSelectionMode(false);
        }
    }
    function handleSelectAllDesigns() {
        setSelectedDesignIds(new Set(designs.map((design)=>design.id)));
    }
    function handleRequestDeleteSelectedDesigns() {
        if (selectedDesignIds.size === 0) {
            return;
        }
        setDeleteConfirmation({
            kind: "bulk",
            designIds: designs.filter((design)=>selectedDesignIds.has(design.id)).map((design)=>design.id)
        });
    }
    function clearPendingDeletionTimeout() {
        if (pendingDeletionTimeoutRef.current === null) {
            return;
        }
        window.clearTimeout(pendingDeletionTimeoutRef.current);
        pendingDeletionTimeoutRef.current = null;
    }
    function restoreDesignSnapshot(previousDesigns) {
        setDesigns((current)=>{
            const snapshotIds = new Set(previousDesigns.map((design)=>design.id));
            const extras = current.filter((design)=>!snapshotIds.has(design.id));
            return [
                ...previousDesigns,
                ...extras
            ];
        });
    }
    async function commitPendingDeletionToServer(nextPendingDeletion) {
        await Promise.all(nextPendingDeletion.designIds.map((designId)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$editorV2ServerPersistence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteSavedEditorV2Document"])(designId)));
    }
    function schedulePendingDeletion(nextPendingDeletion, notification) {
        clearPendingDeletionTimeout();
        setPendingDeletion(nextPendingDeletion);
        setSuccessNotification(notification);
        pendingDeletionTimeoutRef.current = window.setTimeout(()=>{
            const currentPendingDeletion = pendingDeletionRef.current;
            if (!currentPendingDeletion) {
                return;
            }
            void commitPendingDeletionToServer(currentPendingDeletion).then(()=>{
                setPendingDeletion(null);
                setSuccessNotification(null);
            }).catch((error)=>{
                restoreDesignSnapshot(currentPendingDeletion.previousDesigns);
                setTotalCount(currentPendingDeletion.previousTotalCount);
                setPendingDeletion(null);
                setSuccessNotification(null);
                setCardActionError(error instanceof Error ? error.message : "Couldn't delete design.");
            }).finally(()=>{
                clearPendingDeletionTimeout();
            });
        }, 5000);
    }
    function handleUndoPendingDeletion() {
        const currentPendingDeletion = pendingDeletionRef.current;
        if (!currentPendingDeletion) {
            return;
        }
        clearPendingDeletionTimeout();
        restoreDesignSnapshot(currentPendingDeletion.previousDesigns);
        setTotalCount(currentPendingDeletion.previousTotalCount);
        setPendingDeletion(null);
        setSuccessNotification(null);
    }
    function extendPendingDeletion(nextDesignIds) {
        const currentPendingDeletion = pendingDeletionRef.current;
        if (!currentPendingDeletion) {
            return {
                mergedPendingDeletion: null,
                mergedCount: nextDesignIds.length
            };
        }
        const mergedDesignIds = Array.from(new Set([
            ...currentPendingDeletion.designIds,
            ...nextDesignIds
        ]));
        return {
            mergedPendingDeletion: {
                designIds: mergedDesignIds,
                previousDesigns: currentPendingDeletion.previousDesigns,
                previousTotalCount: currentPendingDeletion.previousTotalCount
            },
            mergedCount: mergedDesignIds.length
        };
    }
    async function handleConfirmDelete() {
        if (!deleteConfirmation) {
            return;
        }
        setCardActionError(null);
        setBulkDeletePending(true);
        try {
            if (deleteConfirmation.kind === "single") {
                const designId = deleteConfirmation.design.id;
                const designTitle = deleteConfirmation.design.title;
                const { mergedPendingDeletion, mergedCount } = extendPendingDeletion([
                    designId
                ]);
                const previousDesigns = mergedPendingDeletion?.previousDesigns ?? designs;
                const previousTotalCount = mergedPendingDeletion?.previousTotalCount ?? totalCount;
                setDesigns((existing)=>existing.filter((record)=>record.id !== designId));
                setSelectedDesignIds((current)=>{
                    const next = new Set(current);
                    next.delete(designId);
                    return next;
                });
                schedulePendingDeletion(mergedPendingDeletion ?? {
                    designIds: [
                        designId
                    ],
                    previousDesigns,
                    previousTotalCount
                }, {
                    title: mergedCount === 1 ? "Design deleted" : `Deleted ${mergedCount} designs`,
                    description: mergedCount === 1 ? `"${designTitle}" was removed from your saved designs.` : `${mergedCount} designs were removed from your saved designs.`
                });
                setTotalCount((current)=>Math.max(0, current - 1));
                setDeleteConfirmation(null);
                return;
            }
            const deletedCount = deleteConfirmation.designIds.length;
            const { mergedPendingDeletion, mergedCount } = extendPendingDeletion(deleteConfirmation.designIds);
            const previousDesigns = mergedPendingDeletion?.previousDesigns ?? designs;
            const previousTotalCount = mergedPendingDeletion?.previousTotalCount ?? totalCount;
            const idsToDelete = new Set(deleteConfirmation.designIds);
            setDesigns((existing)=>existing.filter((design)=>!idsToDelete.has(design.id)));
            setSelectedDesignIds(new Set());
            schedulePendingDeletion(mergedPendingDeletion ?? {
                designIds: [
                    ...deleteConfirmation.designIds
                ],
                previousDesigns,
                previousTotalCount
            }, {
                title: mergedCount === 1 ? "Deleted 1 design" : `Deleted ${mergedCount} designs`,
                description: mergedCount === 1 ? "The selected design was removed from your saved designs." : `${mergedCount} designs were removed from your saved designs.`
            });
            setTotalCount((current)=>Math.max(0, current - deletedCount));
            setDeleteConfirmation(null);
        } catch (error) {
            setCardActionError(error instanceof Error ? error.message : "Couldn't delete design.");
        } finally{
            setBulkDeletePending(false);
        }
    }
    function renderCardMenuItemLabel(design, item) {
        const isPending = pendingCardAction?.action === item.id && pendingCardAction?.designId === design.id;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: [
                __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMenuItemLabel,
                item.id === "delete" ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMenuItemLabelDestructive : null
            ].filter(Boolean).join(" "),
            children: [
                isPending ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "loading-spinner",
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                    lineNumber: 772,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                    icon: item.icon,
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMenuItemIcon
                }, void 0, false, {
                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                    lineNumber: 774,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: item.label
                }, void 0, false, {
                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                    lineNumber: 776,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/library/LibraryPageClient.tsx",
            lineNumber: 763,
            columnNumber: 7
        }, this);
    }
    function renderDesignMenu(design) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMenuAnchor,
            "data-card-menu": "true",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SingleSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SingleSelectDropdown"], {
                ariaLabel: `Actions for ${design.title}`,
                items: [
                    ...cardMenuItems
                ],
                value: "",
                placeholder: "Actions",
                triggerLabel: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMenuDots,
                    children: "⋮"
                }, void 0, false, {
                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                    lineNumber: 789,
                    columnNumber: 25
                }, void 0),
                triggerVariant: "ghost",
                showChevron: false,
                menuPortalToViewport: true,
                menuPlacement: "bottom-end",
                menuShowTrailingCheck: false,
                minWidth: "auto",
                getItemValue: (item)=>item.id,
                getItemLabel: (item)=>renderCardMenuItemLabel(design, item),
                getItemDisabled: ()=>pendingCardAction?.designId === design.id,
                onValueChange: (value)=>{
                    void handleCardMenuAction(value, design);
                },
                wrapperClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMenuWrapper,
                triggerClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMenuTrigger,
                menuClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMenuSurface,
                triggerStyle: {
                    minWidth: "32px",
                    padding: "6px 8px"
                }
            }, void 0, false, {
                fileName: "[project]/app/library/LibraryPageClient.tsx",
                lineNumber: 784,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/library/LibraryPageClient.tsx",
            lineNumber: 783,
            columnNumber: 7
        }, this);
    }
    const selectedSortOption = sortOptions.find((option)=>option.id === sortMode) ?? sortOptions[0];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].page,
        "data-navigating-design": openingDesignId ? "true" : "false",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].content,
                    selectedDesignCount > 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].contentWithBulkBar : null
                ].filter(Boolean).join(" "),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].headerCopy,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].title,
                                    children: "My Designs"
                                }, void 0, false, {
                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                    lineNumber: 829,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 828,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].actions,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "button",
                                    variant: "primary",
                                    size: "md",
                                    onClick: ()=>{
                                        setSetupErrorMessage(null);
                                        setSetupModalOpen(true);
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                            icon: "/icons/lucide/plus.svg"
                                        }, void 0, false, {
                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                            lineNumber: 858,
                                            columnNumber: 15
                                        }, this),
                                        "New design"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                    lineNumber: 849,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 832,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                        lineNumber: 827,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewRow,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewSummary,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewSummaryLabel,
                                        children: "All Designs"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 866,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewSummaryCount,
                                        children: [
                                            "(",
                                            totalCount,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 867,
                                        columnNumber: 13
                                    }, this),
                                    touchPrimaryInput ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SingleSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SingleSelectDropdown"], {
                                        ariaLabel: "Library selection actions",
                                        items: [
                                            ...mobileSelectionMenuItems
                                        ],
                                        value: "",
                                        placeholder: "Selection actions",
                                        triggerLabel: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionDots,
                                            children: "⋮"
                                        }, void 0, false, {
                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                            lineNumber: 874,
                                            columnNumber: 31
                                        }, void 0),
                                        triggerVariant: "ghost",
                                        showChevron: false,
                                        menuPortalToViewport: true,
                                        menuPlacement: "bottom-end",
                                        menuShowTrailingCheck: false,
                                        minWidth: "auto",
                                        getItemValue: (item)=>item.id,
                                        getItemLabel: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenuLabel,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                                        icon: touchSelectionMode ? "/icons/lucide/x.svg" : "/icons/lucide/square-check.svg",
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenuIcon
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                        lineNumber: 884,
                                                        columnNumber: 21
                                                    }, void 0),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: touchSelectionMode ? "Done" : "Select"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                        lineNumber: 892,
                                                        columnNumber: 21
                                                    }, void 0)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 883,
                                                columnNumber: 19
                                            }, void 0),
                                        onValueChange: ()=>{
                                            handleTouchSelectionModeToggle();
                                        },
                                        wrapperClassName: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenu} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenuInSummary}`,
                                        triggerClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionTrigger,
                                        menuClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenuSurface,
                                        triggerStyle: {
                                            minWidth: "32px",
                                            padding: "6px 8px"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 869,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 865,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewControls,
                                children: [
                                    touchPrimaryInput ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        type: "button",
                                        variant: "ghostV2",
                                        size: "sm",
                                        active: touchSelectionMode,
                                        onClick: handleTouchSelectionModeToggle,
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].desktopSelectButton,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                                icon: touchSelectionMode ? "/icons/lucide/x.svg" : "/icons/lucide/square-check.svg"
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 917,
                                                columnNumber: 17
                                            }, this),
                                            touchSelectionMode ? "Done" : "Select"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 909,
                                        columnNumber: 15
                                    }, this) : null,
                                    touchPrimaryInput ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewControlsDividerNoMobile,
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 928,
                                        columnNumber: 15
                                    }, this) : null,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sortControl,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sortDropdownLabel,
                                                children: "Sort by:"
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 934,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SingleSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SingleSelectDropdown"], {
                                                ariaLabel: "Sort designs",
                                                items: [
                                                    ...sortOptions
                                                ],
                                                value: sortMode,
                                                placeholder: "Sort",
                                                triggerVariant: "ghost",
                                                triggerLabel: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sortTriggerLabel,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sortTriggerValue,
                                                        children: selectedSortOption.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                        lineNumber: 943,
                                                        columnNumber: 21
                                                    }, void 0)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 942,
                                                    columnNumber: 19
                                                }, void 0),
                                                getItemValue: (item)=>item.id,
                                                getItemLabel: (item)=>item.label,
                                                onValueChange: (value)=>{
                                                    setSortMode(value);
                                                },
                                                triggerClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sortTrigger,
                                                wrapperClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sortDropdown,
                                                menuClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sortMenu,
                                                minWidth: "auto",
                                                menuPlacement: "bottom-end",
                                                menuPortalToViewport: true,
                                                openOnHover: !touchPrimaryInput
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 935,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 933,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewControlsDividerKeep,
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 960,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SegmentedControl$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SegmentedControl"], {
                                        ariaLabel: "Design library view",
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewToggle,
                                        itemClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewToggleItem,
                                        value: viewMode,
                                        onChange: setViewMode,
                                        options: [
                                            {
                                                value: "list",
                                                label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                                    icon: "/icons/lucide/list.svg",
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewToggleIcon
                                                }, void 0, false, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 973,
                                                    columnNumber: 26
                                                }, void 0)
                                            },
                                            {
                                                value: "grid",
                                                label: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                                    icon: "/icons/lucide/layout-grid.svg",
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewToggleIcon
                                                }, void 0, false, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 977,
                                                    columnNumber: 26
                                                }, void 0)
                                            }
                                        ]
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 964,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].viewControlsDividerNoDesktop,
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 981,
                                        columnNumber: 13
                                    }, this),
                                    touchPrimaryInput ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$SingleSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SingleSelectDropdown"], {
                                        ariaLabel: "Library selection actions",
                                        items: [
                                            ...mobileSelectionMenuItems
                                        ],
                                        value: "",
                                        placeholder: "Selection actions",
                                        triggerLabel: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionDots,
                                            children: "⋮"
                                        }, void 0, false, {
                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                            lineNumber: 991,
                                            columnNumber: 31
                                        }, void 0),
                                        triggerVariant: "ghost",
                                        showChevron: false,
                                        menuPortalToViewport: true,
                                        menuPlacement: "bottom-end",
                                        menuShowTrailingCheck: false,
                                        minWidth: "auto",
                                        getItemValue: (item)=>item.id,
                                        getItemLabel: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenuLabel,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                                        icon: touchSelectionMode ? "/icons/lucide/x.svg" : "/icons/lucide/square-check.svg",
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenuIcon
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                        lineNumber: 1001,
                                                        columnNumber: 21
                                                    }, void 0),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: touchSelectionMode ? "Done" : "Select"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                        lineNumber: 1009,
                                                        columnNumber: 21
                                                    }, void 0)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1000,
                                                columnNumber: 19
                                            }, void 0),
                                        onValueChange: ()=>{
                                            handleTouchSelectionModeToggle();
                                        },
                                        wrapperClassName: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenu} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenuInControls}`,
                                        triggerClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionTrigger,
                                        menuClassName: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].mobileSelectionMenuSurface,
                                        triggerStyle: {
                                            minWidth: "32px",
                                            padding: "6px 8px"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 986,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 907,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                        lineNumber: 864,
                        columnNumber: 9
                    }, this),
                    designs.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            viewMode === "grid" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].grid,
                                "aria-label": "Saved designs",
                                children: [
                                    sortedDesigns.map((design)=>{
                                        const isSelected = selectedDesignIds.has(design.id);
                                        const cardSelectable = !touchPrimaryInput || touchSelectionMode;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].card,
                                            "data-selectable": cardSelectable ? "true" : "false",
                                            "data-selected": isSelected ? "true" : "false",
                                            "data-touch-open": touchPrimaryInput && !touchSelectionMode ? "true" : "false",
                                            "data-touch-selection-mode": touchPrimaryInput && touchSelectionMode ? "true" : "false",
                                            onClick: (event)=>handleTouchCardOpen(event, design.id),
                                            children: [
                                                touchPrimaryInput && touchSelectionMode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: isSelected,
                                                    onChange: (event)=>{
                                                        handleDesignSelectionChange(design.id, event.currentTarget.checked);
                                                    },
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardSelectionInputCard,
                                                    "aria-label": `Select ${design.title}`
                                                }, void 0, false, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 1044,
                                                    columnNumber: 25
                                                }, this) : null,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].thumbnailShell} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardSelectionSurface}`,
                                                    children: [
                                                        !touchPrimaryInput ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            checked: isSelected,
                                                            onChange: (event)=>{
                                                                handleDesignSelectionChange(design.id, event.currentTarget.checked);
                                                            },
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardSelectionInput,
                                                            "aria-label": `Select ${design.title}`
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1062,
                                                            columnNumber: 27
                                                        }, this) : null,
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].thumbnail,
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$StitchThumbnailCanvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StitchThumbnailCanvas"], {
                                                                snapshot: design.stitchSnapshot,
                                                                traceThumbnailUrl: design.previewUrl,
                                                                tracePlacement: design.tracePlacement,
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].thumbnailCanvas,
                                                                testId: `grid-thumbnail-${design.id}`
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                lineNumber: 1077,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1076,
                                                            columnNumber: 25
                                                        }, this),
                                                        cardSelectable ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardCheckbox,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "checkbox",
                                                                    checked: isSelected,
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardCheckboxInput,
                                                                    readOnly: true,
                                                                    tabIndex: -1,
                                                                    "aria-hidden": "true"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1088,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardCheckboxIndicator,
                                                                    "aria-hidden": "true"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1096,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1087,
                                                            columnNumber: 27
                                                        }, this) : null
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 1058,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardBody,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardTopRow,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                    href: `/editor/designs/${design.id}`,
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardTitleLink,
                                                                    onClick: (event)=>navigateToDesign(event, design.id),
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardTitle,
                                                                        children: design.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                        lineNumber: 1111,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1106,
                                                                    columnNumber: 27
                                                                }, this),
                                                                renderDesignMenu(design)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1105,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/editor/designs/${design.id}`,
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardDetailsLink,
                                                            onClick: (event)=>navigateToDesign(event, design.id),
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardMeta,
                                                                    children: [
                                                                        design.gridWidth,
                                                                        " × ",
                                                                        design.gridHeight,
                                                                        " cells",
                                                                        typeof design.colorCount === "number" ? ` • ${design.colorCount} ${design.colorCount === 1 ? "color" : "colors"}` : ""
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1122,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardTimestamp,
                                                                    children: design.updatedLabel
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1130,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1117,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 1104,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, design.id, true, {
                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                            lineNumber: 1032,
                                            columnNumber: 21
                                        }, this);
                                    }),
                                    loadingMore ? loadingCards.map((card)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                            className: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].card} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingCard}`,
                                            "aria-hidden": "true",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].thumbnail,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].thumbnailFrame,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingThumbnail,
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "loading-spinner",
                                                                "aria-hidden": "true"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                lineNumber: 1147,
                                                                columnNumber: 31
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1146,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                        lineNumber: 1145,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 1144,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardBody,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineShort
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1152,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineLong
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1153,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineMedium
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1154,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 1151,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, `loading-${card}`, true, {
                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                            lineNumber: 1139,
                                            columnNumber: 23
                                        }, this)) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1027,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listView,
                                "aria-label": "Saved designs list",
                                "data-touch-selection-mode": touchPrimaryInput && touchSelectionMode ? "true" : "false",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listHeader,
                                        "data-touch-selection-mode": touchPrimaryInput && touchSelectionMode ? "true" : "false",
                                        children: [
                                            touchPrimaryInput && touchSelectionMode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1175,
                                                columnNumber: 21
                                            }, this) : null,
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listHeaderName,
                                                children: "Name"
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1177,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Size"
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1178,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Colors"
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1179,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Last Edited"
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1180,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listHeaderActions,
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1181,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1168,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listBody,
                                        children: [
                                            sortedDesigns.map((design)=>{
                                                const isSelected = selectedDesignIds.has(design.id);
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listRow,
                                                    "data-touch-selection-mode": touchPrimaryInput && touchSelectionMode ? "true" : "false",
                                                    "data-selected": isSelected ? "true" : "false",
                                                    onClick: (event)=>handleTouchListRowSelect(event, design.id),
                                                    children: [
                                                        touchPrimaryInput && touchSelectionMode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listSelectionCell,
                                                            "aria-hidden": "true",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listSelectionIndicator
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                lineNumber: 1200,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1199,
                                                            columnNumber: 25
                                                        }, this) : null,
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/editor/designs/${design.id}`,
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listNameCell,
                                                            onClick: (event)=>{
                                                                if (touchPrimaryInput && touchSelectionMode) {
                                                                    event.preventDefault();
                                                                    return;
                                                                }
                                                                navigateToDesign(event, design.id);
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listThumbnailFrame,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$StitchThumbnailCanvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StitchThumbnailCanvas"], {
                                                                        snapshot: design.stitchSnapshot,
                                                                        traceThumbnailUrl: design.previewUrl,
                                                                        tracePlacement: design.tracePlacement,
                                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listThumbnailCanvas
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                        lineNumber: 1216,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1215,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listNameContent,
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listTitle,
                                                                            children: design.title
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                            lineNumber: 1224,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listMobileMeta,
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listMobileMetaItem,
                                                                                    children: [
                                                                                        design.gridWidth,
                                                                                        " × ",
                                                                                        design.gridHeight,
                                                                                        " cells"
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                                    lineNumber: 1226,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listMobileMetaItem,
                                                                                    children: typeof design.colorCount === "number" ? `${design.colorCount} ${design.colorCount === 1 ? "color" : "colors"}` : "—"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                                    lineNumber: 1229,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listMobileMetaItem,
                                                                                    children: design.updatedLabel.replace(/^Edited /, "")
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                                    lineNumber: 1236,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                            lineNumber: 1225,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1223,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1203,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/editor/designs/${design.id}`,
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listMetaCell,
                                                            onClick: (event)=>{
                                                                if (touchPrimaryInput && touchSelectionMode) {
                                                                    event.preventDefault();
                                                                    return;
                                                                }
                                                                navigateToDesign(event, design.id);
                                                            },
                                                            children: [
                                                                design.gridWidth,
                                                                " × ",
                                                                design.gridHeight,
                                                                " cells"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1243,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/editor/designs/${design.id}`,
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listMetaCell,
                                                            onClick: (event)=>{
                                                                if (touchPrimaryInput && touchSelectionMode) {
                                                                    event.preventDefault();
                                                                    return;
                                                                }
                                                                navigateToDesign(event, design.id);
                                                            },
                                                            children: typeof design.colorCount === "number" ? `${design.colorCount} ${design.colorCount === 1 ? "color" : "colors"}` : "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1257,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/editor/designs/${design.id}`,
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listMetaCell,
                                                            onClick: (event)=>{
                                                                if (touchPrimaryInput && touchSelectionMode) {
                                                                    event.preventDefault();
                                                                    return;
                                                                }
                                                                navigateToDesign(event, design.id);
                                                            },
                                                            children: design.updatedLabel.replace(/^Edited /, "")
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1275,
                                                            columnNumber: 23
                                                        }, this),
                                                        renderDesignMenu(design)
                                                    ]
                                                }, design.id, true, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 1189,
                                                    columnNumber: 21
                                                }, this);
                                            }),
                                            loadingMore ? loadingCards.map((card)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listRow} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingCard}`,
                                                    "aria-hidden": "true",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listNameCell,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listThumbnailFrame,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingThumbnail,
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "loading-spinner",
                                                                            "aria-hidden": "true"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                            lineNumber: 1304,
                                                                            columnNumber: 33
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                        lineNumber: 1303,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1302,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listLoadingText,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineLong
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                        lineNumber: 1308,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                    lineNumber: 1307,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1301,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineMedium
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1311,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineShort
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1312,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineMedium
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1313,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1314,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, `list-loading-${card}`, true, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 1296,
                                                    columnNumber: 25
                                                }, this)) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1184,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1161,
                                columnNumber: 15
                            }, this),
                            loadMoreError || cardActionError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadMoreError,
                                children: loadMoreError ?? cardActionError
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1323,
                                columnNumber: 15
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: sentinelRef,
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].scrollSentinel,
                                "aria-hidden": "true"
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1326,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true) : isInitialLoading ? viewMode === "grid" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].grid,
                        "aria-label": "Loading saved designs",
                        children: loadingCards.map((card)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].card} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingCard}`,
                                "aria-hidden": "true",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].thumbnail,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].thumbnailFrame,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingThumbnail,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "loading-spinner",
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                    lineNumber: 1340,
                                                    columnNumber: 25
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1339,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                            lineNumber: 1338,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1337,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cardBody,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineShort
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1345,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineLong
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1346,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineMedium
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1347,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1344,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, `initial-loading-${card}`, true, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1332,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                        lineNumber: 1330,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listView,
                        "aria-label": "Loading saved designs list",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listHeader,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listHeaderName,
                                        children: "Name"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1355,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Size"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1356,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Colors"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1357,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Last Edited"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1358,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listHeaderActions,
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1359,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1354,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listBody,
                                children: loadingCards.map((card)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listRow} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingCard}`,
                                        "aria-hidden": "true",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listNameCell,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listThumbnailFrame,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingThumbnail,
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "loading-spinner",
                                                                "aria-hidden": "true"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                                lineNumber: 1371,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1370,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                        lineNumber: 1369,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listLoadingText,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineLong
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                            lineNumber: 1375,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                        lineNumber: 1374,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1368,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineMedium
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1378,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineShort
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1379,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadingLineMedium
                                            }, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1380,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, void 0, false, {
                                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                                lineNumber: 1381,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, `initial-list-loading-${card}`, true, {
                                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                                        lineNumber: 1363,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1361,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                        lineNumber: 1353,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].emptyState,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].emptyStateTitle,
                                children: "No designs yet"
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1389,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].emptyStateBody,
                                children: "Your saved needlepoint designs will show up here once you create one."
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1390,
                                columnNumber: 13
                            }, this),
                            loadMoreError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].loadMoreError,
                                children: loadMoreError
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1394,
                                columnNumber: 15
                            }, this) : null,
                            loadMoreError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                type: "button",
                                variant: "secondary",
                                size: "md",
                                onClick: ()=>{
                                    void loadInitialPage();
                                },
                                children: "Retry loading designs"
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1397,
                                columnNumber: 15
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                        lineNumber: 1388,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/library/LibraryPageClient.tsx",
                lineNumber: 819,
                columnNumber: 7
            }, this),
            setupModalOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].modalOverlay,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$editor$2d$v2$2f$app$2f$EditorV2SetupModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorV2SetupModal"], {
                    canClose: true,
                    creatingDesign: creatingDesign,
                    draftHeight: draftHeight,
                    draftHeightInches: draftHeightInches,
                    draftMeshCount: draftMeshCount,
                    draftSizingMode: draftSizingMode,
                    draftWidth: draftWidth,
                    draftWidthInches: draftWidthInches,
                    hasSavedDesignAccess: true,
                    mode: "new-only",
                    hasMoreSavedDocuments: false,
                    onDismissSavedDocumentsError: ()=>{},
                    onDismissSetupError: ()=>setSetupErrorMessage(null),
                    onOpenSavedDocuments: ()=>{},
                    onLoadMoreSavedDocuments: ()=>{},
                    onSignIn: ()=>{},
                    onClose: ()=>setSetupModalOpen(false),
                    onCreateDesign: handleCreateDesign,
                    onDraftHeightChange: setDraftHeight,
                    onDraftHeightInchesChange: setDraftHeightInches,
                    onDraftMeshCountChange: setDraftMeshCount,
                    onDraftSizingModeChange: setDraftSizingMode,
                    onDraftWidthChange: setDraftWidth,
                    onDraftWidthInchesChange: setDraftWidthInches,
                    onLoadSavedDesign: ()=>{},
                    savedDocuments: [],
                    savedDocumentsLoading: false,
                    savedDocumentsLoadingMore: false,
                    savedDocumentsErrorMessage: null,
                    selectedStorageId: "",
                    setSelectedStorageId: ()=>{},
                    setupErrorMessage: setupErrorMessage
                }, void 0, false, {
                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                    lineNumber: 1414,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/library/LibraryPageClient.tsx",
                lineNumber: 1413,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Modal"], {
                isOpen: deleteConfirmation !== null,
                title: deleteConfirmation?.kind === "bulk" ? `Delete ${deleteConfirmation.designIds.length} design${deleteConfirmation.designIds.length === 1 ? "" : "s"}?` : "Delete this design?",
                description: deleteConfirmation?.kind === "bulk" ? `This will permanently delete ${deleteConfirmation.designIds.length} selected design${deleteConfirmation.designIds.length === 1 ? "" : "s"} from your saved designs.` : "This will permanently delete the selected design from your saved designs.",
                tone: "fail",
                dismissLabel: "Cancel",
                confirmLabel: deleteConfirmation?.kind === "bulk" ? bulkDeletePending ? "Deleting..." : deleteConfirmation.designIds.length === 1 ? "Delete design" : "Delete designs" : bulkDeletePending ? "Deleting..." : "Delete design",
                confirmVariant: "destructive",
                onDismiss: ()=>{
                    if (bulkDeletePending) {
                        return;
                    }
                    setDeleteConfirmation(null);
                },
                onConfirm: ()=>{
                    void handleConfirmDelete();
                },
                confirmDisabled: bulkDeletePending,
                dismissDisabled: bulkDeletePending
            }, void 0, false, {
                fileName: "[project]/app/library/LibraryPageClient.tsx",
                lineNumber: 1451,
                columnNumber: 7
            }, this),
            successNotification ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].notificationOverlayTop,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].notificationStack,
                    "data-auto-dismiss": "true",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Notification$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notification"], {
                        tone: "success",
                        title: successNotification.title,
                        description: successNotification.description,
                        actionLabel: "Undo",
                        onAction: handleUndoPendingDeletion
                    }, void 0, false, {
                        fileName: "[project]/app/library/LibraryPageClient.tsx",
                        lineNumber: 1498,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                    lineNumber: 1497,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/library/LibraryPageClient.tsx",
                lineNumber: 1496,
                columnNumber: 9
            }, this) : null,
            selectedDesignCount > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarOverlay,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBar,
                    role: "toolbar",
                    "aria-label": "Bulk actions",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarDismiss,
                            onClick: handleClearSelection,
                            "aria-label": "Clear selection",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarDismissIcon,
                                "aria-hidden": "true"
                            }, void 0, false, {
                                fileName: "[project]/app/library/LibraryPageClient.tsx",
                                lineNumber: 1518,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                            lineNumber: 1512,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarCount,
                            children: [
                                selectedDesignCount,
                                " selected"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                            lineNumber: 1521,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarDivider,
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                            lineNumber: 1525,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarAction,
                            onClick: handleSelectAllDesigns,
                            disabled: allLoadedDesignsSelected,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$design$2d$system$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ButtonIcon"], {
                                    icon: "/icons/lucide/square-check.svg"
                                }, void 0, false, {
                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                    lineNumber: 1537,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Select All"
                                }, void 0, false, {
                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                    lineNumber: 1538,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                            lineNumber: 1527,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarAction} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarDeleteAction}`,
                            onClick: ()=>{
                                handleRequestDeleteSelectedDesigns();
                            },
                            disabled: bulkDeletePending,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarActionIcon} ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$library$2f$page$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].bulkBarDeleteIcon}`,
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                    lineNumber: 1549,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: bulkDeletePending ? "Deleting..." : "Delete"
                                }, void 0, false, {
                                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                                    lineNumber: 1553,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/library/LibraryPageClient.tsx",
                            lineNumber: 1541,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/library/LibraryPageClient.tsx",
                    lineNumber: 1511,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/library/LibraryPageClient.tsx",
                lineNumber: 1510,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/app/library/LibraryPageClient.tsx",
        lineNumber: 815,
        columnNumber: 5
    }, this);
}
_s(LibraryPageClient, "fKhualEpd3wwRGH5nAahaPU5J04=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = LibraryPageClient;
var _c;
__turbopack_context__.k.register(_c, "LibraryPageClient");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_1700f5f3._.js.map