import { NodeState, GraphState, StateRepository } from './types';

export class StateService {
  constructor(private readonly stateRepository: StateRepository) {}
  private _currentId: string | null = null;
  private _currentState: GraphState | null = null;

  static createNewState(): GraphState {
    return {
      canvas: { x: 0, y: 0, scale: 1 },
      nodes: [],
    };
  }

  get currentId(): string | null {
    return this._currentId;
  }

  get currentState(): GraphState | null {
    return this._currentState;
  }

  async init(id: string): Promise<GraphState> {
    const state: GraphState = StateService.createNewState();

    await this.stateRepository.set(id, state);

    this._currentId = id;
    this._currentState = state;

    console.log('init', { id: this._currentId, state: this._currentState });

    return state;
  }

  async load(id: string): Promise<GraphState | null> {
    this._currentState = await this.stateRepository.get(id);

    if (this._currentState) {
      this._currentId = id;
    } else {
      this._currentId = null;
    }

    console.log('load', { id: this._currentId, state: this._currentState });
    return this._currentState;
  }

  async removeNodes(nodeIds: string[]): Promise<void> {
    if (!this._currentId) throw new Error('no current ID');
    if (!this._currentState) throw new Error('no current state');
    const state = this._currentState;

    const ids = new Set(nodeIds);

    const nodes = state.nodes.filter((node) => !ids.has(node.id));

    const newState: GraphState = {
      ...state,
      nodes: [...nodes],
    };

    await this.stateRepository.set(this._currentId, newState);
    this._currentState = newState;
  }

  async updateNodes(
    nodes: (Pick<NodeState, 'id'> & Partial<Omit<NodeState, 'id'>>)[],
  ): Promise<void> {
    if (!this._currentId) throw new Error('no current ID');
    if (!this._currentState) throw new Error('no current state');
    const state = this._currentState;

    const map = new Map(state.nodes.map((n) => [n.id, n]));

    for (const node of nodes) {
      const prev = map.get(node.id);

      map.set(
        node.id,
        partialAssign(prev || { id: node.id, fixed: false, x: 0, y: 0 }, node),
      );
    }

    const newState: GraphState = {
      ...state,
      nodes: [...map.values()],
    };

    await this.stateRepository.set(this._currentId, newState);
    this._currentState = newState;
  }

  async updateCanvas(canvas: Partial<CanvasState>): Promise<void> {
    if (!this._currentId) throw new Error('no current ID');
    if (!this._currentState) throw new Error('no current state');

    const state = this._currentState;

    const newState: GraphState = {
      ...state,
      canvas: { ...state.canvas, ...canvas },
    };

    await this.stateRepository.set(this._currentId, newState);
    this._currentState = newState;
  }
}

function partialAssign<T>(item: T, patch: Partial<T>): T {
  return Object.keys(patch)
    .filter((key) => typeof patch[key] !== undefined && patch[key] !== null)
    .reduce<T>((acc, key) => ({ ...acc, [key]: patch[key] }), { ...item });
}
