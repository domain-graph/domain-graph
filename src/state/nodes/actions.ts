import { Index, Patch } from 'flux-standard-functions';
import { Node } from './types';
import { Action, Type } from './action-types';

export function patchNode(
  nodeId: string,
  updateData: Patch<Node>,
): Action.PatchNode {
  return {
    type: Type.patchNode,
    payload: {
      nodeId,
      updateData,
    },
  };
}

export function patchEachNode(
  updateData: Index<Patch<Node>>,
): Action.PatchEachNode {
  return {
    type: Type.patchEachNode,
    payload: updateData,
  };
}

export function setNode(node: Node): Action.SetNode {
  return {
    type: Type.setNode,
    payload: node,
  };
}

export function setEachNode(nodes: Node[]): Action.SetEachNode {
  return {
    type: Type.setEachNode,
    payload: nodes,
  };
}

export function unsetNode(nodeId: string): Action.UnsetNode {
  return {
    type: Type.unsetNode,
    payload: nodeId,
  };
}

export function unsetEachNode(nodeIds: string[]): Action.UnsetEachNode {
  return {
    type: Type.unsetEachNode,
    payload: nodeIds,
  };
}
