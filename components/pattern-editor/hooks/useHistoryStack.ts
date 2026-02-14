"use client";

import { useCallback, useRef, useState } from "react";

type Snapshot = { gridW: number; gridH: number; grid: Uint16Array };

export function useHistoryStack() {
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const historyRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);

  const setHistoryState = useCallback((next: Snapshot[]) => {
    historyRef.current = next;
    setHistory(next);
  }, []);

  const setFutureState = useCallback((next: Snapshot[]) => {
    futureRef.current = next;
    setFuture(next);
  }, []);

  const pushHistory = useCallback(
    (entry: Snapshot) => {
      setHistoryState([...historyRef.current, entry]);
    },
    [setHistoryState]
  );

  const pushFuture = useCallback(
    (entry: Snapshot) => {
      setFutureState([...futureRef.current, entry]);
    },
    [setFutureState]
  );

  const popHistory = useCallback(() => {
    const current = historyRef.current;
    if (current.length === 0) return null;
    const last = current[current.length - 1];
    setHistoryState(current.slice(0, -1));
    return last;
  }, [setHistoryState]);

  const popFuture = useCallback(() => {
    const current = futureRef.current;
    if (current.length === 0) return null;
    const last = current[current.length - 1];
    setFutureState(current.slice(0, -1));
    return last;
  }, [setFutureState]);

  return {
    history,
    future,
    setHistoryState,
    setFutureState,
    pushHistory,
    pushFuture,
    popHistory,
    popFuture,
  };
}
