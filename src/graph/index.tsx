import './index.less';

import React from 'react';

import { SvgCanvas } from '../svg-canvas';
import { DomainObject } from './domain-object';
import { DomainEdge } from './domain-edge';
import { Simulation } from '../simulation';
import { NodePicker } from './node-picker';
import { Spotlight } from './spotlight';
import { useVisibleEdgeIds, useVisibleNodeIds } from '../state/graph/hooks';

export interface GraphProps {
  className?: string;
}

export const Graph: React.VFC<GraphProps> = () => {
  const nodeIds = useVisibleNodeIds();
  const edgeIds = useVisibleEdgeIds();

  return (
    <Simulation>
      <SvgCanvas>
        <g>
          {edgeIds.map((edgeId) => (
            <DomainEdge key={edgeId} edgeId={edgeId} />
          ))}
        </g>
        <g>
          {nodeIds.map((nodeId) => (
            <DomainObject key={nodeId} nodeId={nodeId} />
          ))}
        </g>
      </SvgCanvas>
      <NodePicker />
      <Spotlight />
    </Simulation>
  );
};
