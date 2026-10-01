"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { MovableAdapter, MovableCommands, MoveSnapshot, RuntimeMode } from "./contracts";
import { createLocalAdapter } from "./local-adapter";

const Context = createContext<MovableAdapter | null>(null);
const DraftScopeContext = createContext("local");

/** Future live adapters can be supplied without changing any feature components. */
export function MovableProvider({ children, mode = "local", adapter, storageScope = mode }: {
  children: ReactNode; mode?: RuntimeMode; adapter?: MovableAdapter; storageScope?: string;
}) {
  const [store] = useState(() => adapter ?? createLocalAdapter(mode));
  useEffect(() => { store.hydrate(); }, [store]);
  return <Context.Provider value={store}><DraftScopeContext.Provider value={storageScope}>{children}</DraftScopeContext.Provider></Context.Provider>;
}

export function useMovableDraftScope() { return useContext(DraftScopeContext); }

export function useMovable(): MoveSnapshot & MovableCommands {
  const store = useContext(Context);
  if (!store) throw new Error("useMovable must be used inside MovableProvider.");
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { ...snapshot, ...store.commands };
}

export { newRequestId } from "./local-adapter";
