"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  getStoredWorkspaceId,
  setStoredWorkspaceId,
} from "@/lib/api";
import type { WorkspaceOut } from "@/types/api";
import { useAuth } from "@/contexts/auth-context";

type WorkspaceContextValue = {
  workspaces: WorkspaceOut[];
  active: WorkspaceOut | null;
  activeId: string | null;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<WorkspaceOut>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceOut[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshWorkspaces = useCallback(async () => {
    if (!token) {
      setWorkspaces([]);
      setActiveIdState(null);
      return;
    }
    setLoading(true);
    try {
      const list = await apiFetch<WorkspaceOut[]>("v1/workspaces");
      setWorkspaces(list);
      const stored = getStoredWorkspaceId();
      if (stored && list.some((w) => w.id === stored)) {
        setActiveIdState(stored);
      } else if (list.length > 0) {
        const pick = list[0].id;
        setStoredWorkspaceId(pick);
        setActiveIdState(pick);
      } else {
        setStoredWorkspaceId(null);
        setActiveIdState(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  const setActiveWorkspace = useCallback((id: string) => {
    setStoredWorkspaceId(id);
    setActiveIdState(id);
  }, []);

  const createWorkspace = useCallback(
    async (name: string) => {
      const w = await apiFetch<WorkspaceOut>("v1/workspaces", {
        method: "POST",
        json: { name },
      });
      setStoredWorkspaceId(w.id);
      setActiveIdState(w.id);
      await refreshWorkspaces();
      return w;
    },
    [refreshWorkspaces],
  );

  const active = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? null,
    [workspaces, activeId],
  );

  const value = useMemo(
    () => ({
      workspaces,
      active,
      activeId,
      loading,
      refreshWorkspaces,
      setActiveWorkspace,
      createWorkspace,
    }),
    [
      workspaces,
      active,
      activeId,
      loading,
      refreshWorkspaces,
      setActiveWorkspace,
      createWorkspace,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
