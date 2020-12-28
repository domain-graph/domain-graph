import { Index, Patch } from 'flux-standard-functions';

import { FluxStandardAction } from '..';
import { Node } from './types';

// eslint-disable-next-line no-shadow
export enum Type {
  patchNode = 'NODES_PATCH_NODE',
  patchEachNode = 'NODES_PATCHEACH_NODE',
  setNode = 'NODES_SET_NODE',
  setEachNode = 'NODES_SETEACH_NODE',
  unsetNode = 'NODES_UNSET_NODE',
  unsetEachNode = 'NODES_UNSETEACH_NODE',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Action {
  export type PatchNode = FluxStandardAction<
    Type.patchNode,
    {
      nodeId: string;
      updateData: Patch<Node>;
    }
  >;

  export type PatchEachNode = FluxStandardAction<
    Type.patchEachNode,
    Index<Patch<Node>>
  >;

  export type SetNode = FluxStandardAction<Type.setNode, Node>;

  export type SetEachNode = FluxStandardAction<Type.setEachNode, Index<Node>>;

  export type UnsetNode = FluxStandardAction<Type.unsetNode, string>;

  export type UnsetEachNode = FluxStandardAction<Type.unsetEachNode, string[]>;
}
