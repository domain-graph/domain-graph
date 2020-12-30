import { Thunk } from '..';

export const selectEdge = (edgeId: string): Thunk => async (
  dispatch,
  getState,
) => {
  const { edges, nodes } = getState();
  const edge = edges.data[edgeId];
  if (!edge) return;

  const { sourceNodeId, targetNodeId } = edge;

  dispatch(setSelectedEdge({ edgeId, sourceNodeId, targetNodeId }));
};

export const EDGES_SET_SELECTED_EDGE = 'EDGES_SET_SELECTED_EDGE';
export const setSelectedEdge = (payload: {
  sourceNodeId: string;
  edgeId: string;
  targetNodeId: string;
}) => ({ type: EDGES_SET_SELECTED_EDGE, payload });

export const EDGES_UNSET_SELECTED_EDGE = 'EDGES_UNSET_SELECTED_EDGE';
export const unsetSelectedEdge = () => ({
  type: EDGES_UNSET_SELECTED_EDGE,
});
