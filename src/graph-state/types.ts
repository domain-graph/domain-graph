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
