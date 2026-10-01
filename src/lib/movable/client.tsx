"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { MovableAdapter, MovableCommands, MoveSnapshot, RuntimeMode } from "./contracts";
import { createLocalAdapter } from "./local-adapter";

const Context = createContext<MovableAdapter | null>(null);

/** Future live adapters can be supplied without changing any feature components. */
export function MovableProvider({ children, mode = "local", adapter }: {
  children: ReactNode; mode?: RuntimeMode; adapter?: MovableAdapter;
}) {
  const [store] = useState(() => adapter ?? createLocalAdapter(mode));
  useEffect(() => { store.hydrate(); }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useMovable(): MoveSnapshot & MovableCommands {
  const store = useContext(Context);
  if (!store) throw new Error("useMovable must be used inside MovableProvider.");
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { ...snapshot, ...store.commands };
}

export { newRequestId } from "./local-adapter";
