import {
  define,
  key,
  required,
  optional,
  indexOf,
  Index,
} from 'flux-standard-functions';

import { Entity } from '../entity';

export type Node = {
  id: string;
  description?: string;
  isPinned: boolean;
  isVisible: boolean;
  x?: number;
  y?: number;
};

const nodeDef = define<Node>({
  id: key(),
  description: optional(),
  isPinned: required(),
  isVisible: required(),
  x: optional(),
  y: optional(),
});

export interface ApplicationState {
  nodes: NodeReducerState;
}

export type NodeReducerState = {
  data: Index<Node>;
};

const stateDef = define<NodeReducerState>({
  data: required(indexOf(nodeDef)),
});

export const nodes = new Entity('NODES', stateDef, nodeDef, { data: {} });
