import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as d3 from 'd3';

import { NodeEvent, NodeSubscriber } from './node-subscriber';
import { context } from './context';
import { EdgeEvent, EdgeSubscriber } from './edge-subscriber';
import { Edge, VisibleNode } from '../state/graph';
import { useVisibleEdges } from '../state/graph/hooks';
import { useDispatch, useSelector } from '../state';
import { updateNodeLocations } from '../state/graph/graph-actions';
import { shallowEqual } from 'react-redux';

/**
 * Maps items using the provided mapping function. The resulting
 * mapped items are "stable" meaning that the same (albeit mutated)
 * instance of the object will be returned after each iteration.
 * Not that this not idomatic React; however, D3 needs it to work.
 * @param items This source items to map
 * @param keyProp The prop on the incomming and mapped items used to establish equality
 * @param map The mapping function
 */
function useStableMap<TIn, TOut, KeyProp extends keyof TIn & keyof TOut>(
  items: TIn[],
  keyProp: KeyProp,
  map: (item: TIn, existing: TOut | undefined) => TOut,
): TOut[] {
  const existingMap = useRef(new Map<TIn[KeyProp], TOut>());

  return useMemo(
    () =>
      items.map((item) => {
        const key = item[keyProp];
        const existing = existingMap.current.get(key);
        const clonedExisting = existing ? ({ ...existing } as TOut) : undefined;
        const mappedExisting = map(item, clonedExisting);

        if (existing) {
          for (const prop of Object.keys(mappedExisting)) {
            existing[prop] = mappedExisting[prop];
          }
          existingMap.current.set(key, existing);
          return existing;
        } else {
          existingMap.current.set(key, mappedExisting);
          return mappedExisting;
        }
      }),
    [items, keyProp, map],
  );
}
type PartialNode = Pick<VisibleNode, 'id' | 'isPinned'>;
type SimulationNode = PartialNode & d3.SimulationNodeDatum;
type SimulationEdge = Pick<Edge, 'id'> & d3.SimulationLinkDatum<SimulationNode>;

/**
 * Returns an array of pinned/unpinned nodes.
 * The array reference is stable even if the (x,y) coords change.
 * Note that useEffect cannot be used here because this selector
 * must be synchronous or the actual D3 simulation throws.
 */
function useVisiblePartialNodes(): PartialNode[] {
  const selector = useCallback(
    (nodes: typeof visibleNodes): Record<string, boolean> =>
      Object.keys(nodes).reduce((acc, nodeId) => {
        acc[nodeId] = nodes[nodeId].isPinned;
        return acc;
      }, {}),
    [],
  );
  const mapper = useCallback(
    (m: Record<string, boolean>): PartialNode[] =>
      Object.keys(m).map<PartialNode>((id) => ({
        id,
        isPinned: m[id],
      })),
    [],
  );
  const { visibleNodes } = useSelector((state) => state.graph);

  const pinMap = selector(visibleNodes);
  const pinMapRef = useRef(pinMap);
  const resultRef = useRef(mapper(pinMap));

  if (!shallowEqual(pinMap, pinMapRef.current)) {
    pinMapRef.current = pinMap;
    resultRef.current = mapper(pinMap);
  }

  return resultRef.current;
}

export const Simulation: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const [svg, setSvg] = useState(d3.select('svg'));
  useEffect(() => {
    setSvg(d3.select('svg'));
  }, []);

  const visibleNodes = useVisiblePartialNodes();
  const visibleEdges = useVisibleEdges();

  const circularEdgeIdsByNode: Record<string, string[]> = useMemo(
    () =>
      visibleEdges
        .filter((edge) => edge.sourceNodeId === edge.targetNodeId)
        .reduce<Record<string, string[]>>((acc, edge) => {
          acc[edge.sourceNodeId] ||= [];

          acc[edge.sourceNodeId].push(edge.id);

          return acc;
        }, {}),
    [visibleEdges],
  );

  const fullVisibleNodes = useSelector((state) => state.graph.visibleNodes);
  const fullVisibleNodesRef = useRef(fullVisibleNodes);
  fullVisibleNodesRef.current = fullVisibleNodes;

  const nodeMapper = useCallback(
    (node: PartialNode, simNode: SimulationNode | undefined) => {
      const fullNode = fullVisibleNodesRef.current[node.id];

      // Initialize with stored coords; otherwise, fall back to sim coords
      const x = simNode ? simNode.x : fullNode.x;
      const y = simNode ? simNode.y : fullNode.y;
      return {
        ...simNode,
        ...node,
        x,
        y,
        fx: node.isPinned ? x : undefined,
        fy: node.isPinned ? y : undefined,
        vx: node.isPinned ? 0 : simNode?.vx,
        vy: node.isPinned ? 0 : simNode?.vy,
      };
    },
    [],
  );

  const clonedNodes: SimulationNode[] = useStableMap(
    visibleNodes,
    'id',
    nodeMapper,
  );

  const edgeMapper = useCallback(
    (edge: Edge, simEdge: SimulationEdge | undefined) => {
      return {
        ...edge,
        source: simEdge?.source || edge.sourceNodeId,
        target: simEdge?.target || edge.targetNodeId,
      };
    },
    [],
  );

  const clonedEdges: SimulationEdge[] = useStableMap(
    visibleEdges,
    'id',
    edgeMapper,
  );

  const nodeEventsByNodeId = useRef<Record<string, NodeEvent>>({});
  const nodeSubscriber: NodeSubscriber = useCallback(
    (id: string, onNodeChange: NodeEvent) => {
      nodeEventsByNodeId.current[id] = onNodeChange;
    },
    [],
  );
  const edgeEventsByEdgeId = useRef<Record<string, EdgeEvent>>({});
  const edgeSubscriber: EdgeSubscriber = useCallback(
    (id: string, dataFn: EdgeEvent) => {
      edgeEventsByEdgeId.current[id] = dataFn;
    },
    [],
  );

  // Must be a layout effect because we attach the sim to existing DOM nodes
  useLayoutEffect(() => {
    if (svg && clonedNodes) {
      const simulation = d3
        .forceSimulation<SimulationNode, SimulationEdge>(clonedNodes)
        .force(
          'link',
          d3
            .forceLink<SimulationNode, SimulationEdge>(clonedEdges)
            .id((d) => d.id)
            .distance(120),
        )
        .force('charge', d3.forceManyBody().strength(-500).distanceMax(150));

      // TODO: consider this when we can plumn tick XOR drag event data (issue #42)
      // if (!clonedNodes.some((n) => !n.fixed)) simulation.stop();

      const link = svg.selectAll('g.edge').data(clonedEdges);

      const node = svg
        .selectAll('g.simulation-node .handle')
        .data(clonedNodes, function (this: Element, d: any) {
          // eslint-disable-next-line no-invalid-this
          return d ? d.id : this.id;
        });

      node.on('mouseover', function (d) {
        // eslint-disable-next-line no-invalid-this
        d3.select((this as any).parentNode).raise();
      });

      node.call(drag(simulation, nodeEventsByNodeId.current));

      simulation.on('end', () => {
        const payload: Record<
          string,
          { x: number; y: number }
        > = clonedNodes.reduce((acc, item) => {
          acc[item.id] = { x: r10(item.x || 0), y: r10(item.y || 0) };

          return acc;
        }, {});

        dispatch(updateNodeLocations(payload));
      });

      simulation.on('tick', () => {
        link.each((d: any) => {
          edgeEventsByEdgeId.current[d.id]?.({
            x1: r10(d.source.x),
            y1: r10(d.source.y),
            x2: r10(d.target.x),
            y2: r10(d.target.y),
          });
        });

        node.each((d) => {
          if (typeof d.x === 'number' && typeof d.y === 'number') {
            nodeEventsByNodeId.current[d.id]?.('tick', {
              x: r10(d.x),
              y: r10(d.y),
            });

            const edgeIds = circularEdgeIdsByNode[d.id];

            if (edgeIds?.length) {
              for (const edgeId of edgeIds) {
                edgeEventsByEdgeId.current[edgeId]?.({
                  x1: r10(d.x),
                  y1: r10(d.y),
                  x2: r10(d.x),
                  y2: r10(d.y),
                });
              }
            }
          }
        });
      });

      return () => {
        simulation.stop();
      };
    } else {
      return undefined;
    }
  }, [clonedNodes, clonedEdges, circularEdgeIdsByNode, svg, dispatch]);

  return (
    <context.Provider value={{ nodeSubscriber, edgeSubscriber }}>
      {children}
    </context.Provider>
  );
};

function drag(
  simulation: d3.Simulation<SimulationNode, SimulationEdge>,
  subscribers: { [id: string]: NodeEvent },
): any {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    subscribers[event.subject.id]?.('dragstart', {
      x: r10(event.subject.x),
      y: r10(event.subject.y),
    });
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    subscribers[event.subject.id]?.('drag', {
      x: r10(event.x),
      y: r10(event.y),
    });
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    subscribers[event.subject.id]?.('dragend', {
      x: r10(event.subject.x),
      y: r10(event.subject.y),
    });
    if (!event.subject.isPinned) {
      event.subject.fx = null;
      event.subject.fy = null;
      event.subject.vx = null;
      event.subject.vy = null;
    }
  }

  return d3
    .drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}

function r10(n: number): number {
  return Math.round(n * 10) / 10.0;
}
