import type {
  RemoveCustomPalettePatch,
  UpsertCustomPalettePatch,
} from "../../store/patches";
import type { CustomPalette, EditorStoreState } from "../../store/state";
import type {
  AddColorToCustomPaletteCommand,
  CreateCustomPaletteCommand,
  DeleteCustomPaletteCommand,
  EditorCommand,
  RemoveColorFromCustomPaletteCommand,
  RenameCustomPaletteCommand,
} from "../types";
import { buildDirtySession } from "./gridMutationUtils";
import type { EditorCommandExecution, EditorCommandHandler } from "./types";

const DEFAULT_CUSTOM_PALETTE_NAME = "Untitled Palette";

export const createCustomPaletteCommandHandler: EditorCommandHandler<CreateCustomPaletteCommand> = {
  canHandle(command): command is CreateCustomPaletteCommand {
    return command.kind === "palette.createCustomPalette";
  },
  handle(state, command) {
    const paletteId = command.payload.paletteId.trim();
    const name = normalizeCustomPaletteName(command.payload.name);

    if (
      paletteId.length === 0 ||
      state.document.palette.customPalettesById[paletteId]
    ) {
      return buildNoopExecution(state, command);
    }

    const nextPalette: CustomPalette = {
      id: paletteId,
      name,
      colorIds: sanitizeColorIds(state, command.payload.colorIds ?? []),
    };

    return buildPaletteExecution(state, command, {
      patches: [{ type: "palette.upsertCustomPalette", palette: nextPalette }],
      inversePatches: [{ type: "palette.removeCustomPalette", paletteId }],
    });
  },
};

export const renameCustomPaletteCommandHandler: EditorCommandHandler<RenameCustomPaletteCommand> = {
  canHandle(command): command is RenameCustomPaletteCommand {
    return command.kind === "palette.renameCustomPalette";
  },
  handle(state, command) {
    const existingPalette = state.document.palette.customPalettesById[command.payload.paletteId];
    if (!existingPalette) {
      return buildNoopExecution(state, command);
    }

    const nextPalette: CustomPalette = {
      ...existingPalette,
      name: normalizeCustomPaletteName(command.payload.name),
    };

    if (nextPalette.name === existingPalette.name) {
      return buildNoopExecution(state, command);
    }

    return buildPaletteExecution(state, command, {
      patches: [{ type: "palette.upsertCustomPalette", palette: nextPalette }],
      inversePatches: [{ type: "palette.upsertCustomPalette", palette: existingPalette }],
    });
  },
};

export const deleteCustomPaletteCommandHandler: EditorCommandHandler<DeleteCustomPaletteCommand> = {
  canHandle(command): command is DeleteCustomPaletteCommand {
    return command.kind === "palette.deleteCustomPalette";
  },
  handle(state, command) {
    const existingPalette = state.document.palette.customPalettesById[command.payload.paletteId];
    if (!existingPalette) {
      return buildNoopExecution(state, command);
    }

    return buildPaletteExecution(state, command, {
      patches: [{ type: "palette.removeCustomPalette", paletteId: existingPalette.id }],
      inversePatches: [{ type: "palette.upsertCustomPalette", palette: existingPalette }],
    });
  },
};

export const addColorToCustomPaletteCommandHandler: EditorCommandHandler<AddColorToCustomPaletteCommand> = {
  canHandle(command): command is AddColorToCustomPaletteCommand {
    return command.kind === "palette.addColorToCustomPalette";
  },
  handle(state, command) {
    const existingPalette = state.document.palette.customPalettesById[command.payload.paletteId];
    if (!existingPalette) {
      return buildNoopExecution(state, command);
    }

    const nextColorIds = sanitizeColorIds(state, [
      ...existingPalette.colorIds,
      command.payload.colorId,
    ]);
    if (nextColorIds.length === existingPalette.colorIds.length) {
      return buildNoopExecution(state, command);
    }

    return buildPaletteExecution(state, command, {
      patches: [
        {
          type: "palette.upsertCustomPalette",
          palette: {
            ...existingPalette,
            colorIds: nextColorIds,
          },
        },
      ],
      inversePatches: [{ type: "palette.upsertCustomPalette", palette: existingPalette }],
    });
  },
};

export const removeColorFromCustomPaletteCommandHandler: EditorCommandHandler<RemoveColorFromCustomPaletteCommand> = {
  canHandle(command): command is RemoveColorFromCustomPaletteCommand {
    return command.kind === "palette.removeColorFromCustomPalette";
  },
  handle(state, command) {
    const existingPalette = state.document.palette.customPalettesById[command.payload.paletteId];
    if (!existingPalette) {
      return buildNoopExecution(state, command);
    }

    const nextColorIds = existingPalette.colorIds.filter(
      (colorId) => colorId !== command.payload.colorId,
    );
    if (nextColorIds.length === existingPalette.colorIds.length) {
      return buildNoopExecution(state, command);
    }

    return buildPaletteExecution(state, command, {
      patches: [
        {
          type: "palette.upsertCustomPalette",
          palette: {
            ...existingPalette,
            colorIds: nextColorIds,
          },
        },
      ],
      inversePatches: [{ type: "palette.upsertCustomPalette", palette: existingPalette }],
    });
  },
};

function buildPaletteExecution(
  state: EditorStoreState,
  command: EditorCommand,
  input: {
    patches: Array<UpsertCustomPalettePatch | RemoveCustomPalettePatch>;
    inversePatches: Array<UpsertCustomPalettePatch | RemoveCustomPalettePatch>;
  },
): EditorCommandExecution {
  return {
    nextSession: buildDirtySession(state),
    nextUi: state.ui,
    patches: input.patches,
    inversePatches: input.inversePatches,
    effects: [],
    event: {
      type: "command",
      commandId: command.id,
      label: command.meta.history.mode === "skip" ? undefined : command.meta.history.label,
    },
  };
}

function buildNoopExecution(
  state: EditorStoreState,
  command: EditorCommand,
): EditorCommandExecution {
  return {
    nextSession: state.session,
    nextUi: state.ui,
    patches: [],
    inversePatches: [],
    effects: [],
    event: {
      type: "command",
      commandId: command.id,
      label: undefined,
    },
  };
}

function normalizeCustomPaletteName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_CUSTOM_PALETTE_NAME;
}

function sanitizeColorIds(
  state: EditorStoreState,
  colorIds: string[],
): string[] {
  const seen = new Set<string>();
  const nextColorIds: string[] = [];

  for (const colorId of colorIds) {
    if (
      typeof colorId !== "string" ||
      seen.has(colorId) ||
      !state.document.palette.colorsById[colorId]
    ) {
      continue;
    }

    seen.add(colorId);
    nextColorIds.push(colorId);
  }

  return nextColorIds;
}
