"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coalesceDocumentPatches = coalesceDocumentPatches;
exports.coalesceInverseDocumentPatches = coalesceInverseDocumentPatches;
function coalesceDocumentPatches(patches) {
    return coalesceDocumentPatchesWithStrategy(patches, "last-wins");
}
function coalesceInverseDocumentPatches(patches) {
    return coalesceDocumentPatchesWithStrategy(patches, "first-wins");
}
function coalesceDocumentPatchesWithStrategy(patches, strategy) {
    var coalesced = [];
    var pendingGridPatch = null;
    for (var _i = 0, patches_1 = patches; _i < patches_1.length; _i++) {
        var patch = patches_1[_i];
        if (patch.type === "grid.replaceCells") {
            pendingGridPatch = pendingGridPatch
                ? mergeReplaceGridCellsPatches(pendingGridPatch, patch, strategy)
                : patch;
            continue;
        }
        if (pendingGridPatch) {
            coalesced.push(pendingGridPatch);
            pendingGridPatch = null;
        }
        coalesced.push(patch);
    }
    if (pendingGridPatch) {
        coalesced.push(pendingGridPatch);
    }
    return coalesced;
}
function mergeReplaceGridCellsPatches(previous, next, strategy) {
    var replacements = new Map();
    for (var _i = 0, _a = previous.cells; _i < _a.length; _i++) {
        var replacement = _a[_i];
        replacements.set(replacement.index, replacement.value);
    }
    for (var _b = 0, _c = next.cells; _b < _c.length; _b++) {
        var replacement = _c[_b];
        if (strategy === "first-wins" && replacements.has(replacement.index)) {
            continue;
        }
        replacements.set(replacement.index, replacement.value);
    }
    return {
        type: "grid.replaceCells",
        cells: Array.from(replacements, function (_a) {
            var index = _a[0], value = _a[1];
            return ({
                index: index,
                value: value,
            });
        }),
    };
}
