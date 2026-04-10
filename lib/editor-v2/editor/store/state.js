"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialEditorStoreState = createInitialEditorStoreState;
function createInitialEditorStoreState() {
    return {
        document: {
            project: {
                id: null,
                title: "Untitled Pattern",
                createdAt: null,
                updatedAt: null,
                sourceVersion: 1,
            },
            grid: {
                width: 0,
                height: 0,
                meshCount: null,
                sizingMode: "stitches",
                widthInches: null,
                heightInches: null,
                cells: [],
            },
            palette: {
                colorsById: {},
                customPalettesById: {},
                extractedPaletteIds: [],
                symbolAssignments: {},
            },
            trace: null,
            text: {
                mode: "destructive-grid",
                entities: [],
            },
            metadata: {
                legacyDraftId: null,
                persistedVersionId: null,
                schemaVersion: 1,
            },
        },
        session: {
            activeTool: {
                tool: "none",
                brushSize: 1,
                colorId: null,
            },
            viewport: {
                zoom: 1,
                offsetX: 0,
                offsetY: 0,
            },
            selection: {
                mode: "none",
                rect: null,
                lassoPoints: [],
                mirrorAxis: null,
                preview: null,
            },
            history: {
                past: [],
                future: [],
                lastAppliedCommandId: null,
                transaction: null,
            },
            persistence: {
                currentDraftId: null,
                dirty: false,
                saving: false,
                loading: false,
                lastSavedAt: null,
                lastLoadedAt: null,
                restoreSource: "none",
                versionPreview: null,
            },
            traceInteraction: {
                uploadStatus: "idle",
                placementMode: "idle",
                runtimeImageRefId: null,
            },
            textInteraction: {
                draftText: "",
                draftColorId: null,
                draftFontFamily: "",
                draftFontSize: 16,
                draftFontStyle: "normal",
                draftFontWeight: 400,
                previewPosition: null,
            },
            inFlightCommand: null,
        },
        ui: {
            shell: {
                sidebarCollapsed: false,
                activeSidebarSection: "document",
                mobileToolbarVisible: true,
                mobileToolbarCollapsed: false,
                isCompact: false,
                isNarrow: false,
            },
            panels: {
                gridOpen: true,
                wipOpen: false,
                traceOpen: false,
                usedColorsOpen: true,
                customPalettesOpen: false,
                imageToPatternOpen: false,
                textOpen: false,
            },
            dialogs: {
                confirmDialog: null,
                draftPickerOpen: false,
                versionHistoryOpen: false,
            },
            menus: {
                fileMenuOpen: false,
                mobileSettingsOpen: false,
                activePopoverId: null,
            },
            preferences: {
                darkMode: false,
                showGridlines: true,
                showMajorGridlines: true,
                showRuler: true,
                showSymbols: true,
                threadView: false,
                darkCanvas: false,
                gridMajorInterval: 10,
            },
        },
    };
}
