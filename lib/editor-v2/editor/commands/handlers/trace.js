"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTraceCommandHandler = exports.updateTraceCommandHandler = exports.attachTraceCommandHandler = void 0;
exports.attachTraceCommandHandler = {
    canHandle: function (command) {
        return command.kind === "trace.attach";
    },
    handle: function (state, command) {
        var nextTrace = {
            assetUrl: command.payload.assetUrl,
            blendMode: "image",
            opacity: 0.35,
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            rotation: 0,
            locked: false,
            visible: true,
        };
        return {
            nextSession: buildNextSession(state.session),
            nextUi: state.ui,
            patches: [{ type: "trace.upsert", trace: nextTrace }],
            inversePatches: buildInverseTracePatches(state.document.trace),
            effects: [],
            event: {
                type: "command",
                commandId: command.id,
                label: "Attach Trace",
            },
        };
    },
};
exports.updateTraceCommandHandler = {
    canHandle: function (command) {
        return command.kind === "trace.update";
    },
    handle: function (state, command) {
        var currentTrace = state.document.trace;
        if (!currentTrace) {
            return {
                nextSession: state.session,
                nextUi: state.ui,
                patches: [],
                inversePatches: [],
                effects: [],
                event: {
                    type: "session",
                    commandId: command.id,
                },
            };
        }
        var nextTraceChanges = command.payload.changes;
        var inverseTraceChanges = Object.keys(nextTraceChanges).reduce(function (acc, key) {
            var field = key;
            acc[field] = currentTrace[field];
            return acc;
        }, {});
        return {
            nextSession: buildNextSession(state.session),
            nextUi: state.ui,
            patches: [{ type: "trace.update", changes: nextTraceChanges }],
            inversePatches: [{ type: "trace.update", changes: inverseTraceChanges }],
            effects: [],
            event: {
                type: "command",
                commandId: command.id,
                label: "Update Trace",
            },
        };
    },
};
exports.removeTraceCommandHandler = {
    canHandle: function (command) {
        return command.kind === "trace.remove";
    },
    handle: function (state, command) {
        var currentTrace = state.document.trace;
        if (!currentTrace) {
            return {
                nextSession: state.session,
                nextUi: state.ui,
                patches: [],
                inversePatches: [],
                effects: [],
                event: {
                    type: "session",
                    commandId: command.id,
                },
            };
        }
        return {
            nextSession: buildNextSession(state.session),
            nextUi: state.ui,
            patches: [{ type: "trace.remove" }],
            inversePatches: [{ type: "trace.upsert", trace: currentTrace }],
            effects: [],
            event: {
                type: "command",
                commandId: command.id,
                label: "Remove Trace",
            },
        };
    },
};
function buildInverseTracePatches(currentTrace) {
    if (!currentTrace) {
        return [{ type: "trace.remove" }];
    }
    return [{ type: "trace.upsert", trace: currentTrace }];
}
function buildNextSession(session) {
    return __assign(__assign({}, session), { persistence: __assign(__assign({}, session.persistence), { dirty: true }) });
}
