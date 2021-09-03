import { GraphState } from '../state/graph';

export interface SaveStateRepository {
  has(id: string): Promise<boolean>;
  get(id: string): Promise<SaveState | null>;
  set(id: string, state: SaveState): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface SaveState {
  graph: Omit<
    GraphState,
    'args' | 'edges' | 'fields' | 'nodes' | 'enums' | 'enumValues' | 'visibleEdgeIds'
  >;
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
