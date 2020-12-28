import {
  define,
  key,
  required,
  optional,
  indexOf,
  Index,
} from 'flux-standard-functions';

import { Entity } from '../entity';

export type Edge = {
  id: string;
  description?: string;
  isPinned: boolean;
  isVisible: boolean;
  x?: number;
  y?: number;
};

const edgeDef = define<Edge>({
  id: key(),
  description: optional(),
  isPinned: required(),
  isVisible: required(),
  x: optional(),
  y: optional(),
});

export interface ApplicationState {
  edges: EdgeReducerState;
}

export type EdgeReducerState = {
  data: Index<Edge>;
};

const stateDef = define<EdgeReducerState>({
  data: required(indexOf(edgeDef)),
});

export const edges = new Entity('asdf', stateDef, edgeDef, { data: {} });
