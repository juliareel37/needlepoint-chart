"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createEditorStore,
  type EditorStore,
  type EditorStoreState,
} from "@/lib/editor-v2/editor/store";

const EditorStoreContext = createContext<EditorStore | null>(null);

export function EditorStoreProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: EditorStoreState;
}) {
  const [store] = useState(() =>
    createEditorStore({
      initialState,
    }),
  );

  return (
    <EditorStoreContext.Provider value={store}>
      {children}
    </EditorStoreContext.Provider>
  );
}

export function useEditorStore(): EditorStore {
  const store = useContext(EditorStoreContext);

  if (!store) {
    throw new Error("useEditorStore must be used inside EditorStoreProvider");
  }

  return store;
}

export function useEditorStoreDispatch(): EditorStore["dispatch"] {
  return useEditorStore().dispatch;
}

export function useEditorStoreSelector<T>(
  selector: (state: EditorStoreState) => T,
): T {
  const store = useEditorStore();

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
