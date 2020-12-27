import './index.less';

import React, { useCallback, useMemo, useState } from 'react';

import { SvgCanvas } from '../svg-canvas';
import { Edge, EdgeGroup, Node } from './types';
import { DomainObject } from './domain-object';
import { DomainEdge } from './domain-edge';
import { Simulation, SimulationState } from '../simulation';
import { NodePicker } from './node-picker';
import { Spotlight } from './spotlight';

export interface GraphProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
}

export const Graph: React.VFC<GraphProps> = ({ nodes, edges }) => {
  const [selection, setSelection] = useState<{
    source?: Node;
    edge?: Edge;
    target?: Node;
  }>({});

  const [allNodes, setAllNodes] = useState<Node[]>(
    nodes.map((node) => ({ ...node, isHidden: true })),
  );

  const handleHideAll = useCallback(() => {
    setSelection({});
    setAllNodes((prev) => prev.map((node) => ({ ...node, isHidden: true })));
  }, []);

  const handleHideUnpinned = useCallback(() => {
    setAllNodes((prev) =>
      prev.map((node) => {
        if (node.fixed) return node;

        if (selection.source?.id === node.id) {
          setSelection({});
        } else if (selection.target?.id === node.id) {
          setSelection((sel) => ({
            source: sel.source,
          }));
        }

        return node.fixed ? node : { ...node, isHidden: true };
      }),
    );
  }, [selection]);

  const allEdges: EdgeGroup[] = useMemo(() => {
    const index = edges.reduce<{ [id: string]: EdgeGroup }>((acc, edge) => {
      const { source, target, ...rest } = edge;

      const forwardId = `${source}>${target}`;
      const reverseId = `${target}>${source}`;
      const group = acc[forwardId] || acc[reverseId];

      if (group) {
        const e: EdgeGroup['edges'][number] = rest;
        if (group.id === reverseId) e.reverse = true;
        return { ...acc, [group.id]: { ...group, edges: [...group.edges, e] } };
      } else {
        const e: EdgeGroup['edges'][number] = rest;
        const g: EdgeGroup = {
          id: forwardId,
          source,
          target,
          edges: [e],
        };
        return {
          ...acc,
          [forwardId]: g,
        };
      }
    }, {});

    return Object.keys(index).map((key) => index[key]);
  }, [edges]);

  const visibleNodes = useMemo(
    () => allNodes.filter((node) => !node.isHidden),
    [allNodes],
  );

  const hiddenNodes = useMemo(() => allNodes.filter((node) => node.isHidden), [
    allNodes,
  ]);

  const visibleEdges = useMemo(
    () =>
      allEdges.filter(
        (edge) =>
          allNodes.find((node) => node.id === edge.source)?.isHidden ===
            false &&
          allNodes.find((node) => node.id === edge.target)?.isHidden === false,
      ),
    [allNodes, allEdges],
  );

  const setIsHidden = useCallback((nodeId: string, isHidden: boolean) => {
    setSelection((prev) => {
      if (nodeId === prev.source?.id) return {};
      if (nodeId === prev.target?.id) return { source: prev.source };
      return prev;
    });
    setAllNodes((prev) =>
      prev.some((node) => node.id === nodeId)
        ? prev.map((node) =>
            node.id === nodeId ? { ...node, isHidden } : node,
          )
        : prev,
    );
  }, []);

  const setIsPinned = useCallback((nodeId: string, isPinned: boolean) => {
    setAllNodes((prev) =>
      prev.some((node) => node.id === nodeId)
        ? prev.map((node) =>
            node.id === nodeId ? { ...node, fixed: isPinned } : node,
          )
        : prev,
    );
  }, []);

  const handleExpand = useCallback(
    (nodeId: string) => {
      setAllNodes((prev) => {
        const nodeIds = allEdges
          .filter((edge) => edge.source === nodeId || edge.target === nodeId)
          .reduce<Set<string>>((acc, edge) => {
            if (edge.source !== nodeId) acc.add(edge.source);
            if (edge.target !== nodeId) acc.add(edge.target);
            return acc;
          }, new Set());

        if (
          nodeIds.size &&
          prev.some((node) => nodeIds.has(node.id) && node.isHidden)
        ) {
          return prev.some((node) => nodeIds.has(node.id))
            ? prev.map((node) =>
                nodeIds.has(node.id) && node.isHidden
                  ? { ...node, isHidden: false, fixed: false }
                  : node,
              )
            : prev;
        } else {
          return prev;
        }
      });
    },
    [allEdges],
  );

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);

      if (node?.isHidden) {
        setIsHidden(node.id, false);
      }
      // TODO: pan to node
      setSelection({ source: node });
    },
    [nodes, setIsHidden],
  );

  const handleSelectEdge = useCallback(
    (edgeId: string) => {
      const edge = edges.find((e) => e.id === edgeId) || null;
      const source = nodes.find((n) => n.id === edge?.source) || null;
      const target = nodes.find((n) => n.id === edge?.target) || null;

      if (source && edge && target) {
        if (source.isHidden !== false) {
          setIsHidden(source.id, false);
        }

        if (target.isHidden !== false) {
          setIsHidden(target.id, false);
        }
        // TODO: pad to edge center
        setSelection({ source, edge, target });
      } else {
        setSelection({});
      }
    },
    [nodes, edges, setIsHidden],
  );

  const handleCloseNode = useCallback((nodeId: string) => {
    setSelection((prev) => {
      if (prev.source?.id === nodeId) return {};
      if (prev.target?.id === nodeId) return { source: prev.source };
      return prev;
    });
  }, []);

  const handleChange = useCallback((state: SimulationState) => {
    // TODO
  }, []);

  return (
    <Simulation
      nodes={visibleNodes}
      edges={visibleEdges}
      initialState={{ nodes: [] }}
      onChange={handleChange}
    >
      <SvgCanvas>
        <g>
          {visibleEdges.map((edge) => (
            <DomainEdge
              key={edge.id}
              selectedEdgeId={selection.edge?.id}
              edge={edge}
              onSelect={handleSelectEdge}
            />
          ))}
        </g>
        <g>
          {visibleNodes.map((node) => (
            <DomainObject
              key={node.id}
              isSelected={
                selection.source?.id === node.id ||
                selection.target?.id === node.id
              }
              onPin={(id) => setIsPinned(id, true)}
              onUnpin={(id) => setIsPinned(id, false)}
              onHide={(id) => {
                setIsHidden(id, true);
                setIsPinned(id, false);
              }}
              onExpand={handleExpand}
              onSelect={handleSelectNode}
              node={node}
            />
          ))}
        </g>
      </SvgCanvas>
      <NodePicker
        nodes={allNodes}
        onShow={(id) => {
          setIsHidden(id, false);
        }}
        onHide={(id) => {
          setIsHidden(id, true);
          setIsPinned(id, false);
        }}
        onHideAll={handleHideAll}
        onHideUnpinned={handleHideUnpinned}
      />

      <Spotlight
        source={selection.source}
        edge={selection.edge}
        target={selection.target}
        onCloseNode={handleCloseNode}
        onSelectEdge={handleSelectEdge}
      />
    </Simulation>
  );
};
