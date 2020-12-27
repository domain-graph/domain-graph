import React, { createContext, useContext } from 'react';

export interface StateRepository {
  has(id: string): Promise<boolean>;
  get(id: string): Promise<GraphState | null>;
  set(id: string, state: GraphState): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface GraphState {
  nodes: NodeState[];
  canvas: CanvasState;
}

export interface NodeState {
  id: string;
  fixed: boolean;
  x: number;
  y: number;
}

export interface CanvasState {
  x: number;
  y: number;
  scale: number;
}

export class LocalStorageStateRepository implements StateRepository {
  private readonly prefix = 'domain-graph-state-object';

  private key(id: string): string {
    return `${this.prefix}:${id}`;
  }

  has(id: string): Promise<boolean> {
    return Promise.resolve(window.localStorage.getItem(this.key(id)) !== null);
  }
  get(id: string): Promise<GraphState | null> {
    const item = window.localStorage.getItem(this.key(id));
    return Promise.resolve(item === null ? null : JSON.parse(item));
  }
  set(id: string, state: GraphState): Promise<void> {
    window.localStorage.setItem(this.key(id), JSON.stringify(state));
    return Promise.resolve();
  }
  delete(id: string): Promise<void> {
    window.localStorage.removeItem(this.key(id));
    return Promise.resolve();
  }
}

export class NullStateRepository implements StateRepository {
  has(): Promise<boolean> {
    return Promise.resolve(false);
  }
  get(): Promise<GraphState | null> {
    return Promise.resolve(null);
  }
  set(): Promise<void> {
    return Promise.resolve();
  }
  delete(): Promise<void> {
    return Promise.resolve();
  }
}

const context = createContext<StateRepository>(new NullStateRepository());

export function useStateRepository(): StateRepository {
  return useContext(context);
}

export const StateRepositoryProvider: React.FC<{
  stateRepository: StateRepository;
}> = ({ stateRepository, children }) => {
  return (
    <context.Provider value={stateRepository}>{children}</context.Provider>
  );
};
