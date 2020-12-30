import {
  define,
  key,
  required,
  optional,
  indexOf,
} from 'flux-standard-functions';

import { Entity, StandardReducer } from '../entity';
import { handleNodeVisibility, handleSelectNodes } from './side-effects';

export type Node = {
  id: string;
  description?: string;
  isPinned: boolean;
  isVisible: boolean;
  x?: number;
  y?: number;
};

export const nodeDef = define<Node>({
  id: key(),
  description: optional(),
  isPinned: required(),
  isVisible: required(),
  x: optional(),
  y: optional(),
});

export type NodesState = {
  data: Record<string, Node>;
  selectedSourceNodeId?: string;
  selectedTargetNodeId?: string;
  visibleNodeIds: string[];
};

export const stateDef = define<NodesState>({
  data: required(indexOf(nodeDef)),
  selectedSourceNodeId: optional(),
  selectedTargetNodeId: optional(),
  visibleNodeIds: required(),
});

export const nodes = new Entity('NODES', stateDef, nodeDef, {
  data: {},
  visibleNodeIds: [],
});

export const reducer: StandardReducer<'NODES', Node, NodesState> = (
  originalState,
  action,
) => {
  let currentState = nodes.standardReducer(originalState, action);
  currentState = handleNodeVisibility(originalState, currentState, action);
  currentState = handleSelectNodes(originalState, currentState, action);

  return currentState;
};
