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
import { GraphState } from '../graph-state';
import { Node } from '../state/nodes';
import { Edge } from '../state/edges';
import { useVisibleNodes } from '../state/nodes/hooks';
import { useVisibleEdges } from '../state/edges/hooks';

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

type SimulationNode = Pick<Node, 'id' | 'isPinned'> & d3.SimulationNodeDatum;
type SimulationEdge = Pick<Edge, 'id'> & d3.SimulationLinkDatum<SimulationNode>;

function isNotNull<T>(obj: T | null | undefined): obj is T {
  return obj !== null && typeof obj !== 'undefined';
}

export type SimulationState = Pick<GraphState, 'nodes'>;

export interface SimulationProps {
  graphId: string;
  onChange: (state: SimulationState) => void;
}

export const Simulation: React.FC<SimulationProps> = ({
  graphId,
  onChange,
  children,
}) => {
  const [svg, setSvg] = useState(d3.select('svg'));
  useEffect(() => {
    setSvg(d3.select('svg'));
  }, []);

  const visibleNodes = useVisibleNodes();
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

  const clonedNodes: SimulationNode[] = useStableMap(
    visibleNodes,
    'id',
    (node, simNode) => ({
      ...simNode,
      id: node.id,
      isPinned: node.isPinned,
      fx: node.isPinned ? simNode?.x : undefined,
      fy: node.isPinned ? simNode?.y : undefined,
      vx: node.isPinned ? 0 : simNode?.vx,
      vy: node.isPinned ? 0 : simNode?.vy,
    }),
  );

  const clonedEdges: SimulationEdge[] = useStableMap(
    visibleEdges,
    'id',
    (edge, simEdge) => {
      return {
        ...edge,
        source: simEdge?.source || edge.sourceNodeId,
        target: simEdge?.target || edge.targetNodeId,
      };
    },
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

      // TODO: consider this when we can plumn tick XOR drag event data
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
        onChange({
          nodes: clonedNodes
            .map((n) => {
              if (typeof n.x === 'number' && typeof n.y === 'number') {
                return {
                  id: n.id,
                  fixed: typeof n.fx === 'number',
                  x: n.x,
                  y: n.y,
                };
              } else {
                return null;
              }
            })
            .filter(isNotNull),
        });
      });

      simulation.on('tick', () => {
        link.each((d: any) => {
          edgeEventsByEdgeId.current[d.id]?.({
            x1: d.source.x,
            y1: d.source.y,
            x2: d.target.x,
            y2: d.target.y,
          });
        });

        node.each((d) => {
          if (typeof d.x === 'number' && typeof d.y === 'number') {
            nodeEventsByNodeId.current[d.id]?.('tick', {
              x: d.x,
              y: d.y,
            });

            const edgeIds = circularEdgeIdsByNode[d.id];

            if (edgeIds?.length) {
              for (const edgeId of edgeIds) {
                edgeEventsByEdgeId.current[edgeId]?.({
                  x1: d.x,
                  y1: d.y,
                  x2: d.x,
                  y2: d.y,
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
  }, [clonedNodes, clonedEdges, circularEdgeIdsByNode, svg, onChange]);

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
      x: event.subject.x,
      y: event.subject.y,
    });
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    subscribers[event.subject.id]?.('drag', {
      x: event.x,
      y: event.y,
    });
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    subscribers[event.subject.id]?.('dragend', {
      x: event.subject.x,
      y: event.subject.y,
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
